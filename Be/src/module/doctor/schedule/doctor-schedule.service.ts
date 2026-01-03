import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DateUtil } from '@/common/utils';
import {
  WeeklyScheduleResponseDto,
  MonthlyScheduleResponseDto,
  WeeklyScheduleDayDto,
  BookedTimeSlotDto,
} from './dto/doctor-schedule.dto';
// import { TimeUtil } from '@/common/utils/time'; // No longer needed

@Injectable()
export class DoctorScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get doctor profile ID from user ID
   */
  private async getDoctorProfileId(userId: number): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundException('Không tìm thấy hồ sơ bác sĩ');
    }

    return user.doctorProfile.id;
  }

  /**
   * Get start of week (Sunday) for a given date
   */
  private getWeekStartDate(date: Date): Date {
    const d = new Date(date);
    const day = DateUtil.getDayOfWeek(d); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    const weekStart = new Date(d.setDate(diff));
    return DateUtil.startOfDay(weekStart);
  }

  /**
   * Get all dates in a week (Sunday to Saturday)
   */
  private getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  /**
   * Format date to ISO string (YYYY-MM-DD) in local timezone
   */
  private formatDate(date: Date): string {
    return DateUtil.format(date, 'YYYY-MM-DD');
  }

  /**
   * Get day name in Vietnamese (Monday to Sunday)
   */
  private getDayName(dayOfWeek: number): string {
    const days = [
      'Chủ nhật', // 0 = Sunday
      'Thứ 2', // 1 = Monday
      'Thứ 3', // 2 = Tuesday
      'Thứ 4', // 3 = Wednesday
      'Thứ 5', // 4 = Thursday
      'Thứ 6', // 5 = Friday
      'Thứ 7', // 6 = Saturday
    ];
    return days[dayOfWeek];
  }

  /**
   * Get booked time slots for a specific date
   */
  private async getBookedTimeSlots(
    doctorId: number,
    date: Date,
  ): Promise<BookedTimeSlotDto[]> {
    const startOfDay = DateUtil.startOfDay(date);
    const endOfDay = DateUtil.endOfDay(date);

    // Get appointments for the date
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        // Include all statuses to show in calendar
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
        patientProfile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Convert appointments to booked time slots
    return appointments.map((apt) => {
      return {
        appointmentId: apt.id,
        serviceName: apt.service.name,
        patientName: apt.patientProfile
          ? `${apt.patientProfile.firstName} ${apt.patientProfile.lastName}`
          : 'Khách vãng lai',
        status: apt.status,
        startDateTime: apt.startTime.toISOString(),
        endDateTime: apt.endTime.toISOString(),
      };
    });
  }

  /**
   * Get weekly schedule for doctor
   */
  async getWeeklySchedule(
    userId: number,
    weekStartDate?: string,
  ): Promise<WeeklyScheduleResponseDto> {
    const doctorId = await this.getDoctorProfileId(userId);

    // Determine week start date
    let weekStart: Date;
    if (weekStartDate) {
      // Parse YYYY-MM-DD as UTC to avoid timezone issues
      const [year, month, day] = weekStartDate.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      weekStart = this.getWeekStartDate(utcDate);
    } else {
      weekStart = this.getWeekStartDate(new Date());
    }

    const weekEnd = DateUtil.endOfDay(DateUtil.addDays(weekStart, 6));

    // Get doctor info
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Get all availabilities (weekly schedule)
    const availabilities = await this.prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Get all overrides for the week
    const overrides = await this.prisma.availabilityOverride.findMany({
      where: {
        doctorId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Create a map of dayOfWeek -> availability
    const availabilityMap = new Map<number, (typeof availabilities)[0]>();
    availabilities.forEach((avail) => {
      availabilityMap.set(avail.dayOfWeek, avail);
    });

    // Create a map of date string -> override
    const overrideMap = new Map<string, (typeof overrides)[0]>();
    overrides.forEach((override) => {
      const dateStr = this.formatDate(override.date);
      overrideMap.set(dateStr, override);
    });

    // Build schedule for each day in the week
    const weekDates = this.getWeekDates(weekStart);
    const days: WeeklyScheduleDayDto[] = await Promise.all(
      weekDates.map(async (date) => {
        const dateStr = this.formatDate(date);
        const dayOfWeek = date.getDay();
        const availability = availabilityMap.get(dayOfWeek) || null;
        const override = overrideMap.get(dateStr) || null;

        // Determine actual schedule
        let actualSchedule: { startTime: string; endTime: string } | null =
          null;
        let isOff = false;

        if (override) {
          // If override exists
          if (override.startTime === null || override.endTime === null) {
            // Off day
            isOff = true;
            actualSchedule = null;
          } else {
            // Modified schedule
            actualSchedule = {
              startTime: override.startTime,
              endTime: override.endTime,
            };
          }
        } else if (availability) {
          // Use regular availability
          actualSchedule = {
            startTime: availability.startTime,
            endTime: availability.endTime,
          };
        }

        // Get booked time slots for this day
        const bookedTimeSlots = await this.getBookedTimeSlots(doctorId, date);

        return {
          date: dateStr,
          dayOfWeek,
          dayName: this.getDayName(dayOfWeek),
          availability: availability
            ? {
                id: availability.id,
                dayOfWeek: availability.dayOfWeek,
                startTime: availability.startTime,
                endTime: availability.endTime,
              }
            : null,
          override: override
            ? {
                id: override.id,
                date: dateStr,
                startTime: override.startTime,
                endTime: override.endTime,
              }
            : null,
          actualSchedule,
          isOff,
          bookedTimeSlots,
        };
      }),
    );

    return {
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      weekStartDate: this.formatDate(weekStart),
      weekEndDate: this.formatDate(weekEnd),
      days,
    };
  }

  /**
   * Get monthly schedule for doctor
   */
  async getMonthlySchedule(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<MonthlyScheduleResponseDto> {
    const doctorId = await this.getDoctorProfileId(userId);

    // Determine month start and end
    const monthStart = startDate
      ? (() => {
          // Parse YYYY-MM-DD as UTC to avoid timezone issues
          const [year, month, day] = startDate.split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        })()
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of current month

    const monthEnd = endDate
      ? (() => {
          // Parse YYYY-MM-DD as UTC to avoid timezone issues
          const [year, month, day] = endDate.split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        })()
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // Last day of current month

    // Generate full calendar grid: from start of week containing month start to end of week containing month end
    const calendarStart = this.getWeekStartDate(monthStart); // Start of week (Sunday)
    const calendarEnd = DateUtil.endOfDay(
      DateUtil.addDays(monthEnd, 6 - DateUtil.getDayOfWeek(monthEnd)),
    ); // End of week (Saturday)

    // monthStart and monthEnd should also be consistently adjusted
    const adjMonthStart = DateUtil.startOfDay(monthStart);
    const adjMonthEnd = DateUtil.endOfDay(monthEnd);

    // Get doctor info
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Get all availabilities (weekly schedule)
    const availabilities = await this.prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Get all overrides for the calendar period
    const overrides = await this.prisma.availabilityOverride.findMany({
      where: {
        doctorId,
        date: {
          gte: calendarStart,
          lte: calendarEnd,
        },
      },
    });

    // Create a map of dayOfWeek -> availability
    const availabilityMap = new Map<number, (typeof availabilities)[0]>();
    availabilities.forEach((avail) => {
      availabilityMap.set(avail.dayOfWeek, avail);
    });

    // Create a map of date string -> override
    const overrideMap = new Map<string, (typeof overrides)[0]>();
    overrides.forEach((override) => {
      const dateStr = this.formatDate(override.date);
      overrideMap.set(dateStr, override);
    });

    // Generate all dates in the calendar grid (full weeks)
    const dates: Date[] = [];
    const currentDate = new Date(calendarStart);
    while (currentDate <= calendarEnd) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build schedule for each day
    const days: WeeklyScheduleDayDto[] = await Promise.all(
      dates.map(async (date) => {
        const dateStr = this.formatDate(date);
        const dayOfWeek = DateUtil.getDayOfWeek(date);
        const availability = availabilityMap.get(dayOfWeek) || null;
        const override = overrideMap.get(dateStr) || null;

        // Determine actual schedule
        let actualSchedule: { startTime: string; endTime: string } | null =
          null;
        let isOff = false;

        if (override) {
          // If override exists
          if (override.startTime === null || override.endTime === null) {
            // Off day
            isOff = true;
            actualSchedule = null;
          } else {
            // Modified schedule
            actualSchedule = {
              startTime: override.startTime,
              endTime: override.endTime,
            };
          }
        } else if (availability) {
          // Use regular availability
          actualSchedule = {
            startTime: availability.startTime,
            endTime: availability.endTime,
          };
        }

        // Get booked time slots for this day
        const bookedTimeSlots = await this.getBookedTimeSlots(doctorId, date);

        return {
          date: dateStr,
          dayOfWeek,
          dayName: this.getDayName(dayOfWeek),
          availability: availability
            ? {
                id: availability.id,
                dayOfWeek: availability.dayOfWeek,
                startTime: availability.startTime,
                endTime: availability.endTime,
              }
            : null,
          override: override
            ? {
                id: override.id,
                date: dateStr,
                startTime: override.startTime,
                endTime: override.endTime,
              }
            : null,
          actualSchedule,
          isOff,
          bookedTimeSlots,
        };
      }),
    );

    return {
      doctorId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      startDate: this.formatDate(calendarStart),
      endDate: this.formatDate(calendarEnd),
      days,
    };
  }
}
