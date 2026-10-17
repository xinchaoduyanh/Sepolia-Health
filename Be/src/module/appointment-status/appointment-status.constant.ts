import { AppointmentStatus } from '@prisma/client';

export const APPOINTMENT_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  [AppointmentStatus.UPCOMING]: [
    AppointmentStatus.ON_GOING,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.ON_GOING]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
};

export const CHECK_IN_EARLY_WINDOW_MS = 10 * 60 * 1000;
