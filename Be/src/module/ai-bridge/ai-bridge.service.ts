import { PrismaService } from '@/common/prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';

const TZ_OFFSET_MS = 7 * 3600 * 1000; // GMT+7
const ACTIVE_STATUSES = ['UPCOMING', 'ON_GOING'] as const;
const DEFAULT_SLOT_MIN = 30;

/**
 * Adapter DATA-only giữa AI/ và Prisma. KHÔNG trả message/prose/emoji.
 * Lỗi -> { error_code }. Thời gian -> ISO. Thứ -> số 0..6.
 * Ownership các endpoint cá nhân enforce bằng actingUserId (KHÔNG tin LLM).
 */
@Injectable()
export class AiBridgeService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- helpers thời gian ----------
  private parseHHMM(s: string): number {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  }

  private toHHMM(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private vnMinuteOfDay(utc: Date): number {
    return Math.floor((utc.getTime() + TZ_OFFSET_MS) / 60000) % 1440;
  }

  // ---------- search (dữ liệu công khai) ----------
  async searchClinics(q?: string, location?: string) {
    const where: any = { isActive: true };
    const ors: any[] = [];
    if (q) ors.push({ name: { contains: q, mode: 'insensitive' } });
    if (location) ors.push({ address: { contains: location, mode: 'insensitive' } });
    if (ors.length) where.OR = ors;
    const clinics = await this.prisma.clinic.findMany({ where, take: 10 });
    return {
      clinics: clinics.map((c) => ({ id: c.id, name: c.name, address: c.address, phone: c.phone, email: c.email, description: c.description })),
      total: clinics.length,
    };
  }

  async searchServices(q?: string, clinicId?: number) {
    const services = await this.prisma.service.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      include: { specialty: true },
      take: 10,
    });
    return {
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration_min: s.duration,
        specialty: s.specialty?.name ?? null,
      })),
    };
  }

  async searchDoctors(q?: string, serviceId?: number, clinicId?: number) {
    const where: any = { deletedAt: null };
    if (q) {
      const tokens = q.trim().split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            { firstName: { contains: token, mode: 'insensitive' } },
            { lastName: { contains: token, mode: 'insensitive' } },
          ],
        }));
      }
    }
    if (clinicId) where.clinicId = clinicId;
    if (serviceId) where.services = { some: { serviceId } };
    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      include: { specialties: { include: { specialty: true } }, services: { include: { service: true } } },
      take: 10,
    });
    return {
      doctors: doctors.map((d) => ({
        id: d.id,
        first_name: d.firstName,
        last_name: d.lastName,
        experience: d.experience,
        specialties: d.specialties.map(s => s.specialty?.name).filter(Boolean),
        services: d.services.map(s => ({ id: s.service.id, name: s.service.name, price: s.service.price })),
        clinic_id: d.clinicId ?? null,
      })),
    };
  }

  // ---------- details ----------
  async getClinicDetail(clinicId: number) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) return { error_code: 'clinic_not_found' };

    // Service không gắn trực tiếp với Clinic. Lấy các service được cung cấp
    // bởi bác sĩ đang làm việc tại clinic này (qua DoctorService -> DoctorProfile).
    const services = await this.prisma.service.findMany({
      where: {
        doctorService: {
          some: { doctor: { clinicId, deletedAt: null } },
        },
      },
      include: { specialty: true }
    });

    const doctorCount = await this.prisma.doctorProfile.count({
      where: { clinicId, deletedAt: null }
    });

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      description: clinic.description,
      doctor_count: doctorCount,
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration_min: s.duration,
        specialty: s.specialty?.name ?? null
      }))
    };
  }

  async getDoctorDetail(doctorId: number) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId, deletedAt: null },
      include: {
        clinic: true,
        specialties: { include: { specialty: true } },
        services: { include: { service: true } }
      }
    });

    if (!doctor) return { error_code: 'doctor_not_found' };

    const feedbackAgg = await this.prisma.feedback.aggregate({
      where: { appointment: { doctorId } },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return {
      id: doctor.id,
      first_name: doctor.firstName,
      last_name: doctor.lastName,
      experience: doctor.experience,
      clinic: doctor.clinic ? { id: doctor.clinic.id, name: doctor.clinic.name } : null,
      specialties: doctor.specialties.map(s => s.specialty?.name).filter(Boolean),
      services: doctor.services.map(s => ({
        id: s.service.id,
        name: s.service.name,
        price: s.service.price,
        duration_min: s.service.duration
      })),
      average_rating: feedbackAgg._avg.rating ?? 0,
      review_count: feedbackAgg._count.rating
    };
  }

  // ---------- availability ----------
  async getDoctorAvailability(doctorId: number, date: string, serviceId?: number) {
    const parts = date.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !n)) {
      return { doctor_id: doctorId, date, error_code: 'invalid_date' };
    }
    const [y, mo, d] = parts;
    const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // 0=CN..6=T7

    let duration = DEFAULT_SLOT_MIN;
    if (serviceId) {
      const svc = await this.prisma.service.findUnique({ where: { id: serviceId } });
      if (svc) duration = svc.duration;
    }

    const empty = {
      doctor_id: doctorId,
      date,
      working_hours: null,
      available_slots: [] as string[],
      occupied_slots: [] as string[],
    };

    // override ngày cụ thể (nghỉ / đổi giờ)
    const override = await this.prisma.availabilityOverride.findUnique({
      where: { doctorId_date: { doctorId, date: new Date(Date.UTC(y, mo - 1, d)) } },
    });
    let startStr: string;
    let endStr: string;
    if (override) {
      if (!override.startTime || !override.endTime) {
        return { ...empty, error_code: 'doctor_off' };
      }
      startStr = override.startTime;
      endStr = override.endTime;
    } else {
      const avail = await this.prisma.doctorAvailability.findUnique({
        where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: dow } },
      });
      if (!avail) return { ...empty, error_code: 'doctor_off' };
      startStr = avail.startTime;
      endStr = avail.endTime;
    }

    const startMin = this.parseHHMM(startStr);
    const endMin = this.parseHHMM(endStr);
    const allSlots: string[] = [];
    for (let t = startMin; t + duration <= endMin; t += duration) {
      allSlots.push(this.toHHMM(t));
    }

    // slot đã có lịch (active) trong ngày (theo giờ VN)
    const dayStart = new Date(`${date}T00:00:00+07:00`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);
    const appts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ACTIVE_STATUSES as unknown as any[] },
        startTime: { gte: dayStart, lt: dayEnd },
      },
    });
    const occupied = appts.map((a) => this.toHHMM(this.vnMinuteOfDay(a.startTime)));

    let available = allSlots.filter((s) => !occupied.includes(s));

    // bỏ slot đã qua nếu là hôm nay (giờ VN)
    const nowVn = new Date(Date.now() + TZ_OFFSET_MS);
    const todayIso = nowVn.toISOString().slice(0, 10);
    if (date === todayIso) {
      const nowMin = nowVn.getUTCHours() * 60 + nowVn.getUTCMinutes();
      available = available.filter((s) => this.parseHHMM(s) > nowMin);
    }

    return {
      doctor_id: doctorId,
      date,
      working_hours: { start: startStr, end: endStr },
      available_slots: available,
      occupied_slots: occupied,
    };
  }

  // Biên giờ theo buổi — đồng bộ với AI/ app/nlu/timeofday.py (GMT+7, nửa mở [start,end)).
  private timeWindow(pref?: string): { start: number; end: number } | null {
    switch (pref) {
      case 'morning':
        return { start: 6 * 60, end: 11 * 60 + 30 };
      case 'noon':
        return { start: 11 * 60 + 30, end: 13 * 60 };
      case 'afternoon':
        return { start: 13 * 60, end: 17 * 60 };
      case 'evening':
        return { start: 17 * 60, end: 21 * 60 };
      case 'office':
        return { start: 8 * 60, end: 17 * 60 };
      default:
        return null;
    }
  }

  async findAvailableDoctors(
    date: string,
    serviceId?: number,
    clinicId?: number,
    timePreference?: string,
  ) {
    const where: any = { deletedAt: null };
    if (serviceId) where.services = { some: { serviceId } };
    if (clinicId) where.clinicId = clinicId;
    const doctors = await this.prisma.doctorProfile.findMany({ where, take: 10 });
    const window = this.timeWindow(timePreference);
    const result: any[] = [];
    for (const d of doctors) {
      const av = await this.getDoctorAvailability(d.id, date, serviceId);
      let slots: string[] = (av as any).available_slots ?? [];
      if (window) {
        slots = slots.filter((s) => {
          const m = this.parseHHMM(s);
          return m >= window.start && m < window.end;
        });
      }
      if (slots.length) {
        result.push({
          doctor_id: d.id,
          first_name: d.firstName,
          last_name: d.lastName,
          clinic_id: d.clinicId ?? null,
          slot_count: slots.length,
          sample_slots: slots.slice(0, 4),
        });
      }
    }
    return { doctors: result };
  }

  // ---------- dữ liệu cá nhân (ownership) ----------
  async resolvePatientProfile(actingUserId: number) {
    let p = await this.prisma.patientProfile.findFirst({
      where: { managerId: actingUserId, relationship: 'SELF' },
    });
    if (!p) {
      p = await this.prisma.patientProfile.findFirst({
        where: { managerId: actingUserId },
        orderBy: { createdAt: 'asc' },
      });
    }
    if (!p) return { error_code: 'profile_not_found' };
    return {
      patient_profile_id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      dob: p.dateOfBirth.toISOString().slice(0, 10),
      gender: p.gender,
      phone: p.phone,
    };
  }

  async getUpcomingAppointments(actingUserId: number) {
    const profiles = await this.prisma.patientProfile.findMany({
      where: { managerId: actingUserId },
      select: { id: true },
    });
    const ids = profiles.map((p) => p.id);
    const appts = await this.prisma.appointment.findMany({
      where: {
        patientProfileId: { in: ids },
        status: { in: ACTIVE_STATUSES as unknown as any[] },
        startTime: { gte: new Date() },
      },
      include: { doctor: true, service: true },
      orderBy: { startTime: 'asc' },
      take: 20,
    });
    return {
      appointments: appts.map((a) => ({
        id: a.id,
        doctor_name: `${a.doctor.lastName} ${a.doctor.firstName}`,
        service_name: a.service.name,
        start_time: a.startTime.toISOString(),
        status: a.status,
      })),
    };
  }

  // ---------- booking draft + confirm (idempotent) ----------
  private async findConflicts(doctorId: number, start: Date, end: Date) {
    const appts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ACTIVE_STATUSES as unknown as any[] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    return appts.map((a) => ({ appointment_id: a.id, start_time: a.startTime.toISOString() }));
  }

  async createBookingDraft(
    actingUserId: number,
    input: { patientProfileId: number; doctorId: number; serviceId: number; startTime: string; idempotencyKey: string },
  ) {
    // Người khám = hồ sơ LLM đưa NẾU hợp lệ & thuộc user; nếu không (LLM bịa id/
    // chưa gọi resolve_patient_profile) -> fallback HỒ SƠ CHÍNH (SELF). Tránh 403
    // "forbidden_cross_user" làm hỏng cả luồng đặt lịch.
    let profile = input.patientProfileId
      ? await this.prisma.patientProfile.findFirst({
          where: { id: input.patientProfileId, managerId: actingUserId },
        })
      : null;
    if (!profile) {
      profile =
        (await this.prisma.patientProfile.findFirst({
          where: { managerId: actingUserId, relationship: 'SELF' },
        })) ??
        (await this.prisma.patientProfile.findFirst({
          where: { managerId: actingUserId },
          orderBy: { createdAt: 'asc' },
        }));
    }
    if (!profile) return { error_code: 'profile_not_found' };
    const patientProfileId = profile.id;

    const existing = await this.prisma.bookingDraft.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return {
        draft_id: existing.id,
        expires_at: existing.expiresAt.toISOString(),
        conflicts: [],
      };
    }

    const svc = await this.prisma.service.findUnique({ where: { id: input.serviceId } });
    if (!svc) return { error_code: 'service_not_found' };

    const start = new Date(input.startTime);
    const end = new Date(start.getTime() + svc.duration * 60000);
    const conflicts = await this.findConflicts(input.doctorId, start, end);

    const draft = await this.prisma.bookingDraft.create({
      data: {
        patientProfileId,
        doctorId: input.doctorId,
        serviceId: input.serviceId,
        startTime: start,
        endTime: end,
        estimatedPrice: Math.round(svc.price),
        idempotencyKey: input.idempotencyKey,
        expiresAt: new Date(Date.now() + 10 * 60000),
        status: 'PENDING',
      },
    });

    return {
      draft_id: draft.id,
      expires_at: draft.expiresAt.toISOString(),
      conflicts,
      recap_data: {
        doctor_id: input.doctorId,
        service_id: input.serviceId,
        service_name: svc.name,
        start_time: start.toISOString(),
        price: svc.price,
      },
    };
  }

  async confirmBooking(actingUserId: number, draftId: string) {
    const draft = await this.prisma.bookingDraft.findUnique({
      where: { id: draftId },
      include: { patientProfile: true },
    });
    if (!draft) return { error_code: 'draft_not_found' };
    if (draft.patientProfile.managerId !== actingUserId) {
      throw new ForbiddenException('forbidden_cross_user');
    }
    if (draft.status === 'CONFIRMED' && draft.confirmedAppointmentId) {
      return { appointment_id: draft.confirmedAppointmentId, status: 'booked' };
    }
    if (draft.status === 'EXPIRED' || draft.expiresAt.getTime() < Date.now()) {
      await this.prisma.bookingDraft.update({
        where: { id: draftId },
        data: { status: 'EXPIRED' },
      });
      return { error_code: 'draft_expired' };
    }

    const conflicts = await this.findConflicts(draft.doctorId, draft.startTime, draft.endTime);
    if (conflicts.length) {
      return { error_code: 'slot_taken' };
    }

    const appt = await this.prisma.appointment.create({
      data: {
        startTime: draft.startTime,
        endTime: draft.endTime,
        status: 'UPCOMING',
        type: 'OFFLINE',
        patientProfileId: draft.patientProfileId,
        doctorId: draft.doctorId,
        serviceId: draft.serviceId,
      },
    });
    await this.prisma.bookingDraft.update({
      where: { id: draftId },
      data: { status: 'CONFIRMED', confirmedAppointmentId: appt.id },
    });

    return { appointment_id: appt.id, status: 'booked' };
  }

  async getPatientSummary(actingUserId: number) {
    let p = await this.prisma.patientProfile.findFirst({
      where: { managerId: actingUserId, relationship: 'SELF' },
    });
    if (!p) {
      p = await this.prisma.patientProfile.findFirst({
        where: { managerId: actingUserId },
        orderBy: { createdAt: 'asc' },
      });
    }
    if (!p) return { error_code: 'profile_not_found' };

    const lastAppt = await this.prisma.appointment.findFirst({
      where: { patientProfileId: p.id, status: 'COMPLETED' },
      include: { doctor: true, clinic: true, service: { include: { specialty: true } } },
      orderBy: { startTime: 'desc' },
    });

    let defaultClinic: string | null = null;
    if (lastAppt && lastAppt.clinic) {
      defaultClinic = lastAppt.clinic.name;
    } else {
      const anyAppt = await this.prisma.appointment.findFirst({
        where: { patientProfileId: p.id },
        include: { clinic: true },
        orderBy: { startTime: 'desc' },
      });
      if (anyAppt && anyAppt.clinic) {
        defaultClinic = anyAppt.clinic.name;
      }
    }

    const today = new Date();
    let age = today.getFullYear() - p.dateOfBirth.getFullYear();
    const m = today.getMonth() - p.dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < p.dateOfBirth.getDate())) {
      age--;
    }

    return {
      patient_profile_id: p.id,
      full_name: `${p.lastName} ${p.firstName}`.trim(),
      age,
      gender: p.gender,
      default_clinic: defaultClinic,
      last_visit: lastAppt
        ? {
            date: lastAppt.startTime.toISOString().slice(0, 10),
            doctor_name: `BS. ${lastAppt.doctor.lastName} ${lastAppt.doctor.firstName}`.trim(),
            specialty: lastAppt.service.specialty?.name ?? null,
            clinic_name: lastAppt.clinic?.name ?? null,
          }
        : null,
    };
  }

  async getPatientHistory(actingUserId: number, limit: number) {
    let p = await this.prisma.patientProfile.findFirst({
      where: { managerId: actingUserId, relationship: 'SELF' },
    });
    if (!p) {
      p = await this.prisma.patientProfile.findFirst({
        where: { managerId: actingUserId },
        orderBy: { createdAt: 'asc' },
      });
    }
    if (!p) return { error_code: 'profile_not_found' };

    const appts = await this.prisma.appointment.findMany({
      where: {
        patientProfileId: p.id,
        status: 'COMPLETED',
      },
      include: {
        doctor: true,
        clinic: true,
        service: { include: { specialty: true } },
        result: true,
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    const history = appts.map((a) => ({
      appointment_id: a.id,
      date: a.startTime.toISOString().slice(0, 10),
      doctor_name: `BS. ${a.doctor.lastName} ${a.doctor.firstName}`.trim(),
      specialty: a.service.specialty?.name ?? null,
      clinic_name: a.clinic?.name ?? null,
      result: a.result
        ? {
            diagnosis: a.result.diagnosis,
            notes: a.result.notes,
            recommendations: a.result.recommendations,
            prescription: a.result.prescription,
          }
        : null,
    }));

    return { history };
  }

  async cancelAppointment(actingUserId: number, appointmentId: number) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patientProfile: true },
    });
    if (!appt) return { error_code: 'appointment_not_found' };
    if (appt.patientProfile?.managerId !== actingUserId) {
      throw new ForbiddenException('forbidden_cross_user');
    }
    if (appt.status === 'CANCELLED') {
      return { success: true, message: 'already_cancelled' };
    }
    const fourHoursLater = new Date(Date.now() + 4 * 3600 * 1000);
    if (appt.startTime.getTime() < fourHoursLater.getTime()) {
      return { error_code: 'cannot_cancel_near_time' };
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
  }
}
