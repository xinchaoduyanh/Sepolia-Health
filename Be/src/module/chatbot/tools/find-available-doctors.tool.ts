import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { format, parse, isBefore, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

interface FindAvailableDoctorsParams {
  locationName?: string; // Tên cơ sở/phòng khám
  serviceName?: string; // Tên dịch vụ/chuyên khoa
  date?: string; // YYYY-MM-DD
}

@Injectable()
export class FindAvailableDoctorsTool {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: FindAvailableDoctorsParams) {
    try {
      console.log('🔎 FindAvailableDoctors Params:', params);

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

      // 6. Nếu có date, lọc bác sĩ available vào ngày đó
      let targetDate: Date | null = null;
      if (params.date) {
        const parsedDate = parse(params.date, 'yyyy-MM-dd', new Date());

        if (!isValid(parsedDate)) {
          return {
            error: 'Định dạng ngày không hợp lệ.',
            suggestion:
              'Vui lòng sử dụng định dạng YYYY-MM-DD (ví dụ: 2025-11-24)',
          };
        }

        targetDate = parsedDate;

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isBefore(targetDate, today)) {
          return {
            error: 'Ngày đã qua',
            suggestion: 'Vui lòng chọn ngày trong tương lai',
          };
        }
      }

      // 7. Kiểm tra availability cho từng bác sĩ (nếu có date)
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
        const dayOfWeek = targetDate.getDay();

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
        });

        // Generate time slots
        const slots = this.generateTimeSlots(startTime, endTime);

        // Mark booked slots
        const bookedTimes = appointments.map((apt) =>
          format(new Date(apt.startTime), 'HH:mm'),
        );

        const availableSlots = slots.filter(
          (slot) => !bookedTimes.includes(slot),
        );

        // Chỉ thêm bác sĩ nếu có slot trống
        if (availableSlots.length > 0) {
          availableDoctors.push({
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
            message: `Có ${availableSlots.length} khung giờ trống vào ${format(targetDate, 'EEEE, dd/MM/yyyy', { locale: vi })}`,
          });
        }
      }

      // 8. Format response
      if (availableDoctors.length === 0) {
        let message = 'Không tìm thấy bác sĩ nào available';
        if (params.date) {
          message = `Không tìm thấy bác sĩ nào có lịch trống vào ngày ${format(targetDate!, 'dd/MM/yyyy', { locale: vi })}`;
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
        responseMessage = `Tìm thấy ${availableDoctors.length} bác sĩ có lịch trống vào ngày ${format(targetDate!, 'dd/MM/yyyy', { locale: vi })}`;
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

      // Luôn thêm dấu : ở cuối
      responseMessage += ':';

      // Format danh sách bác sĩ thành text đơn giản (không dùng table)
      const formattedList = availableDoctors
        .map((item, index) => {
          const doctorName = item.doctor.fullName;
          if (
            item.workingHours &&
            item.workingHours.start &&
            item.workingHours.end
          ) {
            // Có giờ làm việc cụ thể
            return `${index + 1}. ${doctorName} _ Giờ làm việc ${item.workingHours.start}-${item.workingHours.end}`;
          } else {
            // Không có giờ làm việc cụ thể
            return `${index + 1}. ${doctorName}`;
          }
        })
        .join('\n');

      const formattedMessage = `${responseMessage}\n\n${formattedList}`;

      console.log('🔍 [FindAvailableDoctors] Formatted message:', {
        responseMessage,
        formattedListLength: formattedList.length,
        formattedMessagePreview: formattedMessage.substring(0, 300),
      });

      return {
        found: true,
        count: availableDoctors.length,
        message: responseMessage,
        formattedMessage: formattedMessage,
        doctors: availableDoctors,
      };
    } catch (error) {
      console.error('Find available doctors tool error:', error);
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
      fullName: `BS. ${doctor.firstName} ${doctor.lastName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      experience: doctor.experience || 'Chưa cập nhật',
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
}
