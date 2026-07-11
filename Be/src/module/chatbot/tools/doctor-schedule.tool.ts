import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { addDays, format, isBefore, isValid, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import Fuse from 'fuse.js';

const APP_TIMEZONE_OFFSET = 7; // GMT+7

interface DoctorScheduleParams {
  doctorId?: number;
  doctorName?: string;
  date?: string; // YYYY-MM-DD
  serviceId?: number;
  serviceName?: string; // Tên dịch vụ để tính duration
}

@Injectable()
export class DoctorScheduleTool {
  private readonly logger = new Logger(DoctorScheduleTool.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: DoctorScheduleParams) {
    try {
      // 1. Validate: Ưu tiên doctorId (chính xác 100%)
      if (!params.doctorId && !params.doctorName) {
        return {
          error: 'Vui lòng cung cấp ID hoặc tên bác sĩ',
          suggestion:
            'Để đảm bảo chính xác, nên sử dụng doctorId từ kết quả tìm kiếm',
        };
      }

      // 2. Find doctor
      const doctor = await this.findDoctor(params);
      if (!doctor) {
        return {
          error: 'Không tìm thấy bác sĩ này trong hệ thống',
          suggestion:
            'Vui lòng kiểm tra lại tên hoặc ID bác sĩ. Nếu tìm bằng tên, hãy sử dụng tool search_doctors trước để lấy doctorId chính xác.',
        };
      }

      // 3. XỬ LÝ NGÀY & TIMEZONE (UTC+7)
      let targetDate: Date;
      const now = new Date();
      const nowUtc = now.getTime();
      const vnNow = new Date(nowUtc + APP_TIMEZONE_OFFSET * 3600000);
      
      // Calculate start of today in VN Time (UTC+7), represented as UTC timestamp
      // Example: Now = 10:00 UTC. VN = 17:00. Start of VN Day = 00:00 VN.
      // We want targetDate to be the UTC Date object representing 00:00:00 of the target VN day.
      // This ensures Prisma queries against @db.Date column work correctly (expecting YYYY-MM-DD 00:00:00 UTC usually)
      
      if (params.date) {
        // Parse "YYYY-MM-DD" literally
        const [y, m, d] = params.date.split('-').map(Number);
        if (!y || !m || !d) {
             return { error: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD.' };
        }
        // Construct strictly UTC midnight
        targetDate = new Date(Date.UTC(y, m - 1, d));
        
        // Validation: Past check
        // Compare with "today" VN start
        const todayVnYear = vnNow.getUTCFullYear();
        const todayVnMonth = vnNow.getUTCMonth();
        const todayVnDay = vnNow.getUTCDate();
        const todayVnStart = new Date(Date.UTC(todayVnYear, todayVnMonth, todayVnDay));

        if (targetDate < todayVnStart) {
          return {
            message: 'Xin lỗi, mình không thể hỗ trợ đặt lịch trong quá khứ được ạ. Bạn vui lòng chọn một ngày từ hôm nay trở đi nhé!',
            isPast: true,
          };
        }
      } else {
        // Default to today VN
        targetDate = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
      }

      // 4. Kiểm tra lịch làm việc của bác sĩ
      const dayOfWeek = this.getVNDayOfWeek(targetDate);
      const availability = await this.prisma.doctorAvailability.findUnique({
        where: {
          doctorId_dayOfWeek: {
            doctorId: doctor.id,
            dayOfWeek,
          },
        },
      });

      if (!availability) {
        // Tìm ngày gần nhất có lịch
        const nextAvailable = await this.findNextAvailableDay(doctor.id);
        return {
          doctor: this.formatDoctorInfo(doctor),
          date: this.formatVNDate(targetDate, 'dd/MM/yyyy'),
          message: 'Bác sĩ không làm việc vào ngày này',
          nextAvailableDate: nextAvailable
            ? this.formatVNDate(nextAvailable, 'dd/MM/yyyy')
            : null,
          suggestion: nextAvailable
            ? `Bác sĩ có lịch làm việc vào ${this.formatVNDate(nextAvailable, 'EEEE, dd/MM/yyyy')}`
            : 'Bác sĩ không có lịch làm việc trong 7 ngày tới',
        };
      }

      // 5. Kiểm tra Overrides (Nghỉ đột xuất)
      // targetDate is strictly YYYY-MM-DD 00:00:00 UTC, which matches Prisma @db.Date expectations
      const override = await this.prisma.availabilityOverride.findUnique({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: targetDate, 
          },
        },
      });

      if (override && !override.startTime && !override.endTime) {
        const nextAvailable = await this.findNextAvailableDay(doctor.id);
        return {
          doctor: this.formatDoctorInfo(doctor),
          date: this.formatVNDate(targetDate, 'dd/MM/yyyy'),
          message: 'Bác sĩ nghỉ vào ngày này',
          nextAvailableDate: nextAvailable
            ? this.formatVNDate(nextAvailable, 'dd/MM/yyyy')
            : null,
        };
      }

      // 6. Lấy khung giờ làm việc
      const workingStartTime = override?.startTime || availability.startTime;
      const workingEndTime = override?.endTime || availability.endTime;

      // 7. Lấy danh sách lịch đã đặt
      // We need to query appointments that overlap with this VN Day.
      // VN Day starts at targetDate - 7 hours (in absolute UTC time).
      // Example: Jan 13 00:00 VN = Jan 12 17:00 UTC.
      
      const startOfDay = new Date(targetDate.getTime() - APP_TIMEZONE_OFFSET * 3600000);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 3600000 - 1); // End of VN day

      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          startTime: {
            gte: startOfDay.toISOString(),
            lte: endOfDay.toISOString(),
          },
          status: {
            in: ['UPCOMING', 'ON_GOING'],
          },
        },
      });

      // 8. Xác định thời lượng dịch vụ (duration)
      let serviceDuration = 30;
      if (params.serviceName || params.serviceId) {
        const service = await this.prisma.service.findFirst({
          where: {
            OR: [
              { id: params.serviceId },
              { name: { contains: params.serviceName, mode: 'insensitive' } },
            ],
          },
        });
        if (service) serviceDuration = service.duration;
      }

      // 9. Tính toán Slot trống bằng Minute-Overlap Logic (Mirror AppointmentService)
      const availableSlots: string[] = [];
      const startMin = this.timeToMinutes(workingStartTime);
      const endMin = this.timeToMinutes(workingEndTime);

      const vnNowMinutes = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();
      const isToday = this.isSameDayVN(targetDate, now);

      for (let time = startMin; time + serviceDuration <= endMin; time += 30) {
        // Loại bỏ khung giờ đã qua nếu là hôm nay
        if (isToday && time <= vnNowMinutes) continue;

        // Kiểm tra chồng chéo với từng lịch hẹn
        const hasOverlap = appointments.some((apt) => {
          const aptStart = this.dateToMinutesVN(new Date(apt.startTime));
          const aptEnd = this.dateToMinutesVN(new Date(apt.endTime));
          // Logic: time < aptEnd && time + duration > aptStart
          return time < aptEnd && time + serviceDuration > aptStart;
        });

        if (!hasOverlap) {
          availableSlots.push(this.minutesToTime(time));
        }
      }

      // 11. Get doctor services
      const doctorServices = await this.prisma.doctorService.findMany({
        where: { doctorId: doctor.id },
        include: {
          service: true,
        },
      });

      return {
        doctor: this.formatDoctorInfo(doctor),
        date: this.formatVNDate(targetDate, 'dd/MM/yyyy'),
        dayOfWeek: this.formatVNDate(targetDate, 'EEEE'),
        workingHours: {
          start: workingStartTime,
          end: workingEndTime,
        },
        slots: {
          available: availableSlots.length,
        },
        availableSlots: this.categorizeSlots(availableSlots),
        services: doctorServices.map((ds) => ({
          id: ds.service.id,
          name: ds.service.name,
          price: ds.service.price,
          duration: ds.service.duration,
        })),
        message: this.generateConversationalMessage(
          doctor,
          targetDate,
          availableSlots,
        ),
        bookingInstructions:
          availableSlots.length > 0
            ? 'Bạn thấy khung giờ nào phù hợp với mình không? Để mình chốt lịch giúp bạn nhé.'
            : 'Hiện tại bác sĩ đã kín lịch vào ngày này, bạn có muốn mình tìm ngày khác hoặc bác sĩ khác không?',
      };
    } catch (error) {
      this.logger.error('Doctor schedule tool error', error?.stack);
      return {
        error: 'Có lỗi xảy ra khi tra cứu lịch',
        details: error.message,
      };
    }
  }

  private async findDoctor(params: DoctorScheduleParams) {
    let drId = NaN;
    let drName = params.doctorName;

    // Phân tích doctorId: nếu là string (ví dụ "BS Thái Đức"), chuyển sang drName
    if (params.doctorId) {
      const parsedId = Number(params.doctorId);
      if (!isNaN(parsedId)) {
        drId = parsedId;
      } else if (typeof params.doctorId === 'string' && !drName) {
        // AI bị nhầm: đưa tên vào field ID
        drName = params.doctorId;
      }
    }

    // 1. Ưu tiên doctorId (chính xác 100%)
    if (!isNaN(drId)) {
      return this.prisma.doctorProfile.findUnique({
        where: { id: drId },
        include: {
          user: true,
          clinic: true,
        },
      });
    }

    // 2. Nếu không có ID hợp lệ, dùng drName (đã được sửa lỗi nếu AI nhầm)
    if (drName) {
      const searchName = drName.trim();

      // Lấy tất cả bác sĩ
      const allDoctors = await this.prisma.doctorProfile.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          user: true,
          clinic: true,
        },
      });

      if (allDoctors.length === 0) {
        return null;
      }

      // Tạo danh sách bác sĩ với fullName để search chính xác hơn
      const searchData = allDoctors.map((d) => ({
        ...d,
        fullName: `${d.lastName} ${d.firstName}`.toLowerCase(),
        fullNameReverse: `${d.firstName} ${d.lastName}`.toLowerCase(),
      }));

      // Dùng Fuse.js để fuzzy search (giống search-doctors)
      const fuseOptions = {
        keys: [
          { name: 'fullName', weight: 0.7 },
          { name: 'fullNameReverse', weight: 0.3 },
          { name: 'firstName', weight: 0.2 },
        ],
        includeScore: true,
        threshold: 0.35, // Chặt chẽ hơn một chút
        minMatchCharLength: 2,
      };

      const fuse = new Fuse(searchData, fuseOptions);
      const searchResults = fuse.search(searchName);

      if (searchResults.length === 0) {
        return null;
      }

      // Lấy kết quả tốt nhất (score thấp nhất = match tốt nhất)
      const bestMatch = searchResults[0];
      const bestScore = bestMatch.score || 1;

      // Nếu có nhiều kết quả và score của kết quả thứ 2 gần với kết quả tốt nhất
      // thì có thể có ambiguity
      if (searchResults.length > 1) {
        const secondBestScore = searchResults[1].score || 1;
        const scoreDiff = secondBestScore - bestScore;

        // Nếu score khác biệt < 0.1, có thể có ambiguity
        if (scoreDiff < 0.1 && bestScore > 0.2) {
          // Trả về warning nhưng vẫn dùng kết quả tốt nhất
          this.logger.warn(
            `Multiple doctors found for "${searchName}". Using best match: ${bestMatch.item.firstName} ${bestMatch.item.lastName} (score: ${bestScore})`,
          );
        }
      }

      // Chỉ trả về nếu match tốt (score < 0.3) hoặc là kết quả duy nhất
      if (bestScore < 0.3 || searchResults.length === 1) {
        return bestMatch.item;
      }

      // Nếu match không tốt lắm, vẫn trả về nhưng có warning
      this.logger.warn(
        `Low confidence match for "${searchName}" (score: ${bestScore}). Consider using doctorId from search_doctors tool.`,
      );
      return bestMatch.item;
    }

    return null;
  }

  private formatDoctorInfo(doctor: any) {
    return {
      id: doctor.id,
      name: `BS. ${doctor.lastName} ${doctor.firstName}`,
      experience: doctor.experience || 'nhiều năm kinh nghiệm',
      clinic: doctor.clinic ? doctor.clinic.name : null,
      email: doctor.user.email,
    };
  }

  private generateConversationalMessage(
    doctor: any,
    date: Date,
    availableSlots: string[],
  ): string {
    const doctorName = `BS. ${doctor.lastName} ${doctor.firstName}`;
    const dateStr = this.formatVNDate(date, 'EEEE, dd/MM/yyyy');

    if (availableSlots.length === 0) {
      return `Rất tiếc, mình kiểm tra thì thấy ${doctorName} đã kín lịch vào ${dateStr} rồi bạn ạ.`;
    }

    const { morning, afternoon, evening } =
      this.categorizeSlots(availableSlots);
    let msg = `Mình đã tìm thấy lịch của ${doctorName} vào ${dateStr} rồi đây:\n\n`;

    if (morning && morning.length > 0) {
      msg += `☀️ Buổi sáng: ${this.mergeSlotsIntoRanges(morning)}. (Khung giờ này thường vắng, bạn sẽ không phải chờ lâu đâu).\n`;
    }
    if (afternoon && afternoon.length > 0) {
      msg += `🌤️ Buổi chiều: ${this.mergeSlotsIntoRanges(afternoon)}. (Phù hợp nếu bạn muốn thong thả thời gian sau giờ làm).\n`;
    }
    if (evening && evening.length > 0) {
      msg += `🌙 Buổi tối: ${this.mergeSlotsIntoRanges(evening)}.\n`;
    }

    msg += `\nBạn thấy khung giờ nào phù hợp với mình không? Để mình hỗ trợ bạn đặt lịch luôn nhé!`;

    return msg;
  }

  private mergeSlotsIntoRanges(slots: string[]): string {
    if (slots.length === 0) return '';
    if (slots.length === 1) return slots[0];

    // Sắp xếp slot theo thời gian
    const sortedSlots = [...slots].sort((a, b) => {
      const minA = this.timeToMinutes(a);
      const minB = this.timeToMinutes(b);
      return minA - minB;
    });

    const ranges: string[] = [];
    let startMin = this.timeToMinutes(sortedSlots[0]);
    let lastMin = startMin;
    const interval = 30;

    for (let i = 1; i < sortedSlots.length; i++) {
      const currentMin = this.timeToMinutes(sortedSlots[i]);
      if (currentMin === lastMin + interval) {
        // Tiếp tục range
        lastMin = currentMin;
      } else {
        // Kết thúc range cũ, bắt đầu range mới
        const rangeEnd = lastMin + interval;
        ranges.push(
          `${this.minutesToTime(startMin)} - ${this.minutesToTime(rangeEnd)}`,
        );
        startMin = currentMin;
        lastMin = currentMin;
      }
    }

    // Push range cuối cùng
    const finalEnd = lastMin + interval;
    ranges.push(
      `${this.minutesToTime(startMin)} - ${this.minutesToTime(finalEnd)}`,
    );

    return ranges.join(', ');
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private dateToMinutesVN(date: Date): number {
    const vnTime = new Date(date.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    return vnTime.getUTCHours() * 60 + vnTime.getUTCMinutes();
  }

  private isSameDayVN(d1: Date, d2: Date): boolean {
    const t1 = new Date(d1.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    const t2 = new Date(d2.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    return (
      t1.getUTCFullYear() === t2.getUTCFullYear() &&
      t1.getUTCMonth() === t2.getUTCMonth() &&
      t1.getUTCDate() === t2.getUTCDate()
    );
  }

  private categorizeSlots(slots: string[]) {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return {
      morning: morning.length > 0 ? morning : null,
      afternoon: afternoon.length > 0 ? afternoon : null,
      evening: evening.length > 0 ? evening : null,
    };
  }

  private async findNextAvailableDay(doctorId: number): Promise<Date | null> {
    const now = new Date();
    const vnNow = new Date(now.getTime() + APP_TIMEZONE_OFFSET * 3600000);
    // Align to UTC Midnight for VN Today
    const todayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));

    for (let i = 1; i <= 7; i++) {
      // Add days to UTC date
      const checkDate = new Date(todayUtc);
      checkDate.setUTCDate(todayUtc.getUTCDate() + i);
      
      const dayOfWeek = checkDate.getUTCDay();

      // Check regular availability
      const availability = await this.prisma.doctorAvailability.findUnique({
        where: {
          doctorId_dayOfWeek: {
            doctorId,
            dayOfWeek,
          },
        },
      });

      if (!availability) continue;

      // Check for override
      const override = await this.prisma.availabilityOverride.findUnique({
        where: {
          doctorId_date: {
            doctorId,
            date: checkDate,
          },
        },
      });

      // If override says not working, skip
      if (override && !override.startTime && !override.endTime) {
        continue;
      }

      // Found available day
      return checkDate;
    }

    return null;
  }

  private getVNDayOfWeek(date: Date): number {
    // If the date is already UTC midnight (hacked or from our logic), use getUTCDay()
    // If it's a real timestamp, adjust to VN and then use getUTCDay()
    // Our targetDate is always UTC midnight.
    return date.getUTCDay();
  }

  private formatVNDate(date: Date, pattern: string): string {
    // Create a display date that format() will treat as "local" but whose numbers match the VN day
    // Since our date is UTC midnight, we just need format to show that date.
    // However, format() uses server local time. 
    // To be safe, we reconstruct a local date with the same numbers as the UTC date.
    const displayDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12, // Use Noon to avoid any DST/timezone edge cases at the very start/end of day
      0, 0
    );
    return format(displayDate, pattern, { locale: vi });
  }
}
