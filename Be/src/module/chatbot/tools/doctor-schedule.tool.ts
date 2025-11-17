import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { addDays, format, parse, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';

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
      // 1. Find doctor
      const doctor = await this.findDoctor(params);
      if (!doctor) {
        return {
          error: 'Không tìm thấy bác sĩ này trong hệ thống',
          suggestion: 'Vui lòng kiểm tra lại tên hoặc ID bác sĩ',
        };
      }

      // 2. Parse date
      const targetDate = params.date
        ? parse(params.date, 'yyyy-MM-dd', new Date())
        : new Date();

      // 3. Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isBefore(targetDate, today)) {
        return {
          error: 'Ngày đã qua',
          suggestion: 'Vui lòng chọn ngày trong tương lai',
        };
      }

      // 4. Get doctor availability for that day
      const dayOfWeek = targetDate.getDay();
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

      // 5. Check for overrides
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

      // 6. Get working hours (use override if exists)
      const startTime = override?.startTime || availability.startTime;
      const endTime = override?.endTime || availability.endTime;

      // 7. Get booked appointments
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          startTime: {
            gte: startOfDay.toISOString(),
            lt: endOfDay.toISOString(),
          },
          status: {
            not: 'CANCELLED',
          },
        },
        include: {
          service: true,
        },
      });

      // 8. Generate time slots
      const slots = this.generateTimeSlots(startTime, endTime);

      // 9. Mark booked slots
      const bookedTimes = appointments.map((apt) =>
        format(new Date(apt.startTime), 'HH:mm'),
      );

      const availableSlots = slots.filter(
        (slot) => !bookedTimes.includes(slot),
      );

      // 10. Get doctor services
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
    if (params.doctorId) {
      return this.prisma.doctorProfile.findUnique({
        where: { id: params.doctorId },
        include: {
          user: true,
          clinic: true,
        },
      });
    }

    if (params.doctorName) {
      // Search by name (case-insensitive)
      const doctors = await this.prisma.doctorProfile.findMany({
        where: {
          OR: [
            { firstName: { contains: params.doctorName, mode: 'insensitive' } },
            { lastName: { contains: params.doctorName, mode: 'insensitive' } },
          ],
        },
        include: {
          user: true,
          clinic: true,
        },
        take: 1,
      });

      return doctors[0] || null;
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
