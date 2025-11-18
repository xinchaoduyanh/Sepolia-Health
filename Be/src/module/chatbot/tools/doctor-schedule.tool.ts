import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { addDays, format, parse, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import Fuse from 'fuse.js';

interface DoctorScheduleParams {
  doctorId?: number;
  doctorName?: string;
  date?: string; // YYYY-MM-DD
  serviceId?: number;
}

@Injectable()
export class DoctorScheduleTool {
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

      // 3. Parse date
      let targetDate: Date;
      if (params.date) {
        // Thử parse với format yyyy-MM-dd trước
        const parsedDate = parse(params.date, 'yyyy-MM-dd', new Date());

        // Kiểm tra nếu parse thành công (không phải Invalid Date)
        if (isNaN(parsedDate.getTime())) {
          // Nếu không parse được, thử xử lý các trường hợp ngày tháng bằng tiếng Việt
          targetDate = this.parseVietnameseDate(params.date);
        } else {
          targetDate = parsedDate;
        }
      } else {
        targetDate = new Date();
      }

      // Validate targetDate
      if (isNaN(targetDate.getTime())) {
        return {
          error: 'Ngày không hợp lệ',
          suggestion:
            'Vui lòng cung cấp ngày theo định dạng YYYY-MM-DD hoặc mô tả rõ ràng (ví dụ: "ngày mai", "Thứ 5 tuần này")',
        };
      }

      // 4. Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isBefore(targetDate, today)) {
        return {
          error: 'Ngày đã qua',
          suggestion: 'Vui lòng chọn ngày trong tương lai',
        };
      }

      // 5. Get doctor availability for that day
      const dayOfWeek = targetDate.getDay();

      // Validate dayOfWeek (0-6)
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return {
          error: 'Lỗi xác định thứ trong tuần',
          suggestion: 'Vui lòng thử lại với ngày cụ thể',
        };
      }
      const availability = await this.prisma.doctorAvailability.findUnique({
        where: {
          doctorId_dayOfWeek: {
            doctorId: doctor.id,
            dayOfWeek,
          },
        },
      });

      if (!availability) {
        // Check next 7 days
        const nextAvailable = await this.findNextAvailableDay(doctor.id);
        return {
          doctor: this.formatDoctorInfo(doctor),
          date: format(targetDate, 'dd/MM/yyyy', { locale: vi }),
          message: 'Bác sĩ không làm việc vào ngày này',
          nextAvailableDate: nextAvailable
            ? format(nextAvailable, 'dd/MM/yyyy', { locale: vi })
            : null,
          suggestion: nextAvailable
            ? `Bác sĩ có lịch làm việc vào ${format(nextAvailable, 'EEEE, dd/MM/yyyy', { locale: vi })}`
            : 'Bác sĩ không có lịch làm việc trong 7 ngày tới',
        };
      }

      // 6. Check for overrides
      const override = await this.prisma.availabilityOverride.findUnique({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: targetDate,
          },
        },
      });

      // If override says not working
      if (override && !override.startTime && !override.endTime) {
        const nextAvailable = await this.findNextAvailableDay(doctor.id);
        return {
          doctor: this.formatDoctorInfo(doctor),
          date: format(targetDate, 'dd/MM/yyyy', { locale: vi }),
          message: 'Bác sĩ nghỉ vào ngày này',
          nextAvailableDate: nextAvailable
            ? format(nextAvailable, 'dd/MM/yyyy', { locale: vi })
            : null,
        };
      }

      // 7. Get working hours (use override if exists)
      const startTime = override?.startTime || availability.startTime;
      const endTime = override?.endTime || availability.endTime;

      // 8. Get booked appointments
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          startTime: {
            gte: startOfDay.toISOString(),
            lte: endOfDay.toISOString(),
          },
          status: {
            not: 'CANCELLED',
          },
        },
        include: {
          service: true,
        },
      });

      // 9. Generate time slots
      const slots = this.generateTimeSlots(startTime, endTime);

      // 10. Mark booked slots
      const bookedTimes = appointments.map((apt) =>
        format(new Date(apt.startTime), 'HH:mm'),
      );

      const availableSlots = slots.filter(
        (slot) => !bookedTimes.includes(slot),
      );

      // 11. Get doctor services
      const doctorServices = await this.prisma.doctorService.findMany({
        where: { doctorId: doctor.id },
        include: {
          service: true,
        },
      });

      return {
        doctor: this.formatDoctorInfo(doctor),
        date: format(targetDate, 'dd/MM/yyyy', { locale: vi }),
        dayOfWeek: format(targetDate, 'EEEE', { locale: vi }),
        workingHours: {
          start: startTime,
          end: endTime,
        },
        slots: {
          total: slots.length,
          booked: bookedTimes.length,
          available: availableSlots.length,
        },
        availableSlots: this.categorizeSlots(availableSlots),
        bookedSlots: bookedTimes,
        services: doctorServices.map((ds) => ({
          id: ds.service.id,
          name: ds.service.name,
          price: ds.service.price,
          duration: ds.service.duration,
        })),
        bookingInstructions:
          availableSlots.length > 0
            ? 'Có thể đặt lịch các khung giờ trên. Vui lòng liên hệ để đặt lịch.'
            : 'Không còn slot trống, vui lòng chọn ngày khác',
      };
    } catch (error) {
      console.error('Doctor schedule tool error:', error);
      return {
        error: 'Có lỗi xảy ra khi tra cứu lịch',
        details: error.message,
      };
    }
  }

  private async findDoctor(params: DoctorScheduleParams) {
    // Ưu tiên doctorId (chính xác 100%)
    if (params.doctorId) {
      return this.prisma.doctorProfile.findUnique({
        where: { id: params.doctorId },
        include: {
          user: true,
          clinic: true,
        },
      });
    }

    // Nếu chỉ có doctorName, dùng Fuse.js để fuzzy search (tương tự search-doctors)
    if (params.doctorName) {
      const searchName = params.doctorName.trim();

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

      // Dùng Fuse.js để fuzzy search (giống search-doctors)
      const fuseOptions = {
        keys: [
          { name: 'firstName', weight: 0.5 },
          { name: 'lastName', weight: 0.5 },
        ],
        includeScore: true,
        threshold: 0.4, // Độ "lỏng" (0 = chính xác, 1 = bất cứ đâu)
        minMatchCharLength: 2,
      };

      const fuse = new Fuse(allDoctors, fuseOptions);
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
          console.warn(
            `⚠️ [DoctorSchedule] Multiple doctors found for "${searchName}". Using best match: ${bestMatch.item.firstName} ${bestMatch.item.lastName} (score: ${bestScore})`,
          );
        }
      }

      // Chỉ trả về nếu match tốt (score < 0.3) hoặc là kết quả duy nhất
      if (bestScore < 0.3 || searchResults.length === 1) {
        return bestMatch.item;
      }

      // Nếu match không tốt lắm, vẫn trả về nhưng có warning
      console.warn(
        `⚠️ [DoctorSchedule] Low confidence match for "${searchName}" (score: ${bestScore}). Consider using doctorId from search_doctors tool.`,
      );
      return bestMatch.item;
    }

    return null;
  }

  private formatDoctorInfo(doctor: any) {
    return {
      id: doctor.id,
      name: `BS. ${doctor.firstName} ${doctor.lastName}`,
      experience: doctor.experience,
      clinic: doctor.clinic ? doctor.clinic.name : null,
      email: doctor.user.email,
    };
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes = 30,
  ): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      slots.push(timeSlot);

      currentMinute += intervalMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
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

  private parseVietnameseDate(dateStr: string): Date {
    const lowerStr = dateStr.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map thứ trong tuần (tiếng Việt -> số)
    const dayMap: { [key: string]: number } = {
      'chủ nhật': 0,
      cn: 0,
      'thứ 2': 1,
      'thứ hai': 1,
      'thứ 3': 2,
      'thứ ba': 2,
      'thứ 4': 3,
      'thứ tư': 3,
      'thứ 5': 4,
      'thứ năm': 4,
      'thứ 6': 5,
      'thứ sáu': 5,
      'thứ 7': 6,
      'thứ bảy': 6,
    };

    // Xử lý "ngày mai"
    if (lowerStr.includes('ngày mai') || lowerStr.includes('mai')) {
      return addDays(today, 1);
    }

    // Xử lý "hôm nay"
    if (lowerStr.includes('hôm nay') || lowerStr.includes('hôm nay')) {
      return today;
    }

    // Xử lý "Thứ X tuần này"
    if (lowerStr.includes('tuần này')) {
      for (const [key, dayNum] of Object.entries(dayMap)) {
        if (lowerStr.includes(key)) {
          const currentDay = today.getDay();
          let daysToAdd = dayNum - currentDay;
          if (daysToAdd < 0) {
            daysToAdd += 7; // Nếu đã qua thứ đó trong tuần, lấy thứ đó tuần sau
          } else if (daysToAdd === 0) {
            // Nếu hôm nay đúng là thứ đó, trả về hôm nay
            return today;
          }
          return addDays(today, daysToAdd);
        }
      }
    }

    // Xử lý "Thứ X tuần sau"
    if (lowerStr.includes('tuần sau')) {
      for (const [key, dayNum] of Object.entries(dayMap)) {
        if (lowerStr.includes(key)) {
          const currentDay = today.getDay();
          const daysToAdd = dayNum - currentDay + 7; // Tuần sau
          return addDays(today, daysToAdd);
        }
      }
    }

    // Xử lý chỉ có "Thứ X" (không có "tuần này/sau")
    for (const [key, dayNum] of Object.entries(dayMap)) {
      if (lowerStr.includes(key) && !lowerStr.includes('tuần')) {
        const currentDay = today.getDay();
        let daysToAdd = dayNum - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Nếu đã qua, lấy tuần sau
        }
        return addDays(today, daysToAdd);
      }
    }

    // Nếu không match được, trả về Invalid Date
    return new Date(NaN);
  }

  private async findNextAvailableDay(doctorId: number): Promise<Date | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 7; i++) {
      const checkDate = addDays(today, i);
      const dayOfWeek = checkDate.getDay();

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
}
