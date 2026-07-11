import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { format, isBefore, isValid, parse } from 'date-fns';
import { vi } from 'date-fns/locale';

const APP_TIMEZONE_OFFSET = 7; // GMT+7

interface FindAvailableDoctorsParams {
  locationName?: string; // Tên cơ sở/phòng khám
  serviceName?: string; // Tên dịch vụ/chuyên khoa
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm (Ví dụ: "09:00", "15:30")
}

@Injectable()
export class FindAvailableDoctorsTool {
  private readonly logger = new Logger(FindAvailableDoctorsTool.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(params: FindAvailableDoctorsParams) {
    try {
      this.logger.debug(
        `FindAvailableDoctors params: ${JSON.stringify(params)}`,
      );

      // 1. Validate: Phải có ít nhất locationName hoặc serviceName
      if (!params.locationName && !params.serviceName) {
        return {
          error: 'Vui lòng cung cấp ít nhất tên cơ sở hoặc tên dịch vụ',
          suggestion:
            'Để tìm bác sĩ available, cần biết cơ sở hoặc dịch vụ bạn muốn khám',
        };
      }

      // 2. Tìm clinic IDs từ locationName (nếu có)
      let clinicIds: number[] = [];
      if (params.locationName) {
        const clinics = await this.prisma.clinic.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: params.locationName.trim(),
                  mode: 'insensitive',
                },
              },
              {
                address: {
                  contains: params.locationName.trim(),
                  mode: 'insensitive',
                },
              },
            ],
            isActive: true,
          },
          select: { id: true },
        });

        clinicIds = clinics.map((clinic) => clinic.id);

        if (clinicIds.length === 0) {
          return {
            found: false,
            count: 0,
            message: `Không tìm thấy cơ sở nào có tên hoặc địa chỉ "${params.locationName}".`,
            suggestion:
              'Vui lòng kiểm tra lại tên địa điểm hoặc thử tìm kiếm với từ khóa khác',
          };
        }
      }

      // 3. Tìm service IDs từ serviceName (nếu có)
      let serviceIds: number[] = [];
      if (params.serviceName) {
        const services = await this.prisma.service.findMany({
          where: {
            name: {
              contains: params.serviceName.trim(),
              mode: 'insensitive',
            },
          },
          select: { id: true },
        });

        serviceIds = services.map((service) => service.id);

        if (serviceIds.length === 0) {
          return {
            found: false,
            count: 0,
            message: `Không tìm thấy dịch vụ nào có tên "${params.serviceName}".`,
            suggestion:
              'Vui lòng kiểm tra lại tên dịch vụ hoặc thử tìm kiếm với từ khóa khác',
          };
        }
      }

      // 4. Xây dựng where clause để tìm bác sĩ
      const whereConditions: any[] = [
        { deletedAt: null }, // Chỉ lấy bác sĩ chưa bị xóa
      ];

      // Filter by clinic(s) if locationName was provided
      if (clinicIds.length > 0) {
        whereConditions.push({
          clinicId: { in: clinicIds },
        });
      }

      // Filter by service if serviceName was provided
      if (serviceIds.length > 0) {
        whereConditions.push({
          services: {
            some: {
              serviceId: { in: serviceIds },
            },
          },
        });
      }

      // 5. Lấy danh sách bác sĩ phù hợp
      const doctors = await this.prisma.doctorProfile.findMany({
        where: {
          AND: whereConditions,
        },
        include: {
          user: { select: { email: true, phone: true } },
          clinic: true,
          services: {
            include: {
              service: true,
            },
            ...(serviceIds.length > 0
              ? { where: { serviceId: { in: serviceIds } } }
              : {}),
          },
        },
      });

      if (doctors.length === 0) {
        let message = 'Không tìm thấy bác sĩ nào phù hợp';
        if (params.locationName && params.serviceName) {
          message = `Không tìm thấy bác sĩ nào có dịch vụ "${params.serviceName}" tại cơ sở "${params.locationName}".`;
        } else if (params.locationName) {
          message = `Không tìm thấy bác sĩ nào tại cơ sở "${params.locationName}".`;
        } else if (params.serviceName) {
          message = `Không tìm thấy bác sĩ nào có dịch vụ "${params.serviceName}".`;
        }

        return {
          found: false,
          count: 0,
          message,
          suggestion:
            'Vui lòng kiểm tra lại thông tin hoặc thử tìm kiếm với từ khóa khác',
        };
      }

      // 6. XỬ LÝ NGÀY & TIMEZONE (UTC+7)
      let targetDate: Date;
      const now = new Date();
      const nowUtc = now.getTime();
      const vnNow = new Date(nowUtc + APP_TIMEZONE_OFFSET * 3600000);
      
      // Calculate start of today in VN Time (UTC+7), represented as UTC timestamp
      // Example: Now = 10:00 UTC. VN = 17:00. Start of VN Day = 00:00 VN.
      // We want targetDate to be the UTC Date object representing 00:00:00 of the target VN day.
      
      const vnToday = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));

      if (params.date) {
        // Parse "YYYY-MM-DD" literally
        const [y, m, d] = params.date.split('-').map(Number);
        if (!y || !m || !d) {
             return { error: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD.' };
        }
        // Construct strictly UTC midnight
        targetDate = new Date(Date.UTC(y, m - 1, d));
        
        // Validation: Past check
        if (targetDate < vnToday) {
          return {
            message: 'Xin lỗi, mình không thể hỗ trợ đặt lịch trong quá khứ được ạ. Bạn vui lòng chọn một ngày từ hôm nay trở đi nhé!',
            isPast: true,
          };
        }
      } else {
        targetDate = vnToday;
      }

      // 7. Xác định thời lượng dịch vụ để tính slot
      let intervalMinutes = 30;
      if (params.serviceName) {
        const service = await this.prisma.service.findFirst({
          where: {
            name: { contains: params.serviceName.trim(), mode: 'insensitive' },
          },
        });
        if (service) intervalMinutes = service.duration;
      }

      // 8. Kiểm tra availability cho từng bác sĩ (nếu có date)
      const availableDoctors: any[] = [];

      for (const doctor of doctors) {
        if (!targetDate) {
          // Nếu không có date, thêm tất cả bác sĩ vào danh sách
          availableDoctors.push({
            doctor: this.formatDoctorInfo(doctor),
            available: true,
            message: 'Có thể kiểm tra lịch cụ thể',
          });
          continue;
        }

        // Kiểm tra availability cho ngày cụ thể
        const dayOfWeek = this.getVNDayOfWeek(targetDate);

        // Check regular availability
        const availability = await this.prisma.doctorAvailability.findUnique({
          where: {
            doctorId_dayOfWeek: {
              doctorId: doctor.id,
              dayOfWeek,
            },
          },
        });

        if (!availability) {
          // Bác sĩ không làm việc vào ngày này
          continue;
        }

        // Check for override (nghỉ)
        // targetDate is strictly UTC Midnight used for DB lookup
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
          continue;
        }

        // Get working hours (use override if exists)
        const startTime = override?.startTime || availability.startTime;
        const endTime = override?.endTime || availability.endTime;

        // Get booked appointments
        // VN Day starts at targetDate - 7 hours (in absolute UTC time).
        const startOfDay = new Date(targetDate.getTime() - APP_TIMEZONE_OFFSET * 3600000);
        const endOfDay = new Date(startOfDay.getTime() + 24 * 3600000 - 1);

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
        });

        // 9. Tính toán Slot trống bằng Minute-Overlap Logic
        const bestSlots: string[] = [];
        const startMin = this.timeToMinutes(startTime);
        const endMin = this.timeToMinutes(endTime);

        const vnNowMinutes = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();
        const isToday = this.isSameDayVN(targetDate, now);

        if (params.time) {
          const requestedMin = this.timeToMinutes(params.time);
          if (
            requestedMin < startMin ||
            requestedMin + intervalMinutes > endMin
          ) {
            continue;
          }
          if (isToday && requestedMin <= vnNowMinutes) continue;

          const hasOverlap = appointments.some((apt) => {
            const aptStart = this.dateToMinutesVN(new Date(apt.startTime));
            const aptEnd = this.dateToMinutesVN(new Date(apt.endTime));
            return (
              requestedMin < aptEnd && requestedMin + intervalMinutes > aptStart
            );
          });

          if (!hasOverlap) {
            bestSlots.push(params.time);
          }
        } else {
          // Gợi ý tối đa 3 slot
          for (
            let time = startMin;
            time + intervalMinutes <= endMin;
            time += 30
          ) {
            if (isToday && time <= vnNowMinutes) continue;

            const hasOverlap = appointments.some((apt) => {
              const aptStart = this.dateToMinutesVN(new Date(apt.startTime));
              const aptEnd = this.dateToMinutesVN(new Date(apt.endTime));
              return time < aptEnd && time + intervalMinutes > aptStart;
            });

            if (!hasOverlap) {
              bestSlots.push(this.minutesToTime(time));
            }
          }
        }

        if (bestSlots.length > 0) {
          availableDoctors.push({
            doctor: this.formatDoctorInfo(doctor),
            date: this.formatVNDate(targetDate, 'dd/MM/yyyy'),
            dayOfWeek: this.formatVNDate(targetDate, 'EEEE'),
            workingHours: {
              start: startTime,
              end: endTime,
            },
            bestSlots,
            message: `Có ${bestSlots.length} khung giờ trống ${params.time ? `lúc ${params.time}` : ''} vào ${this.formatVNDate(targetDate, 'EEEE, dd/MM/yyyy')}`,
          });
        }
      }

      // 9. Format response
      if (availableDoctors.length === 0) {
        let message = 'Không tìm thấy bác sĩ nào available';
        if (params.date) {
          const dateStr = this.formatVNDate(targetDate!, 'dd/MM/yyyy');
          message = `Không tìm thấy bác sĩ nào có lịch trống vào ngày ${dateStr}`;
        }
        if (params.locationName && params.serviceName) {
          message += ` cho dịch vụ "${params.serviceName}" tại cơ sở "${params.locationName}".`;
        } else if (params.locationName) {
          message += ` tại cơ sở "${params.locationName}".`;
        } else if (params.serviceName) {
          message += ` cho dịch vụ "${params.serviceName}".`;
        }

        return {
          found: false,
          count: 0,
          message,
          suggestion: 'Vui lòng thử với ngày khác hoặc cơ sở/dịch vụ khác',
        };
      }

      let responseMessage = '';
      if (params.date) {
        responseMessage = `Tìm thấy ${availableDoctors.length} bác sĩ có lịch trống vào ngày ${this.formatVNDate(targetDate!, 'dd/MM/yyyy')}`;
      } else {
        responseMessage = `Tìm thấy ${availableDoctors.length} bác sĩ phù hợp`;
      }

      if (params.locationName && params.serviceName) {
        responseMessage += ` cho dịch vụ "${params.serviceName}" tại cơ sở "${params.locationName}"`;
      } else if (params.locationName) {
        responseMessage += ` tại cơ sở "${params.locationName}"`;
      } else if (params.serviceName) {
        responseMessage += ` cho dịch vụ "${params.serviceName}"`;
      }

      responseMessage += ':';

      // Format danh sách bác sĩ thành text đơn chuẩn "Họ + Tên"
      const formattedList = availableDoctors
        .map((item, index) => {
          const ranges = this.mergeSlotsIntoRanges(item.bestSlots);
          const doctorName = item.doctor.fullName;
          const clinicName = item.doctor.clinic?.name || 'Phòng khám';
          return `${index + 1}. **${doctorName}** (${clinicName}): Rảnh từ **${ranges}**`;
        })
        .join('\n');

      const footer = params.time
        ? `\nMình thấy các bác sĩ trên đều đang rảnh lúc ${params.time} đó bạn. Bạn muốn đặt lịch với ai ạ?`
        : `\n\nBạn muốn xem chi tiết khung giờ trống của bác sĩ nào trong danh sách trên thì hãy cho mình biết nhé! Mình sẽ kiểm tra và báo lại chính xác cho bạn ạ.`;

      const formattedMessage = `${responseMessage}\n\n${formattedList}${footer}`;

      return {
        found: true,
        count: availableDoctors.length,
        message: responseMessage,
        formattedMessage: formattedMessage,
        doctors: availableDoctors,
      };
    } catch (error) {
      this.logger.error('Find available doctors tool error', error?.stack);
      return {
        error: 'Có lỗi xảy ra khi tìm kiếm bác sĩ available',
        details: error.message,
      };
    }
  }

  private formatDoctorInfo(doctor: any) {
    const specialties = doctor.services
      .map((ds: any) => ds.service.name)
      .join(', ');

    return {
      id: doctor.id,
      fullName: `BS. ${doctor.lastName} ${doctor.firstName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      experience: doctor.experience || 'Nhiều năm kinh nghiệm',
      specialty: specialties || 'Chưa cập nhật',
      clinic: doctor.clinic
        ? {
            id: doctor.clinic.id,
            name: doctor.clinic.name,
            address: doctor.clinic.address,
          }
        : null,
      email: doctor.user.email,
    };
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
  private getVNDayOfWeek(date: Date): number {
    return date.getUTCDay();
  }

  private formatVNDate(date: Date, pattern: string): string {
    const displayDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12, 0, 0
    );
    return format(displayDate, pattern, { locale: vi });
  }
}
