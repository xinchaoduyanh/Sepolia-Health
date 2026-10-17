import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationService } from '@/module/notification/notification.service';
import {
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';

const TZ_OFFSET_MS = 7 * 3600 * 1000; // GMT+7
const ACTIVE_STATUSES = ['UPCOMING', 'ON_GOING'] as const;
const DEFAULT_SLOT_MIN = 30;
/** AI booking scope hiện tại: chỉ offline (product decision). */
const AI_APPOINTMENT_TYPE = 'OFFLINE' as const;

/**
 * Adapter DATA-only giữa AI/ và Prisma. KHÔNG trả message/prose/emoji.
 * Lỗi -> { error_code }. Thời gian -> ISO. Thứ -> số 0..6.
 * Ownership các endpoint cá nhân enforce bằng actingUserId (KHÔNG tin LLM).
 */
@Injectable()
export class AiBridgeService {
  private readonly logger = new Logger(AiBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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
    const where: Prisma.ServiceWhereInput = {};
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }
    // Khi có clinicId: chỉ service được ít nhất 1 doctor active tại clinic cung cấp.
    if (clinicId) {
      where.doctorService = {
        some: {
          doctor: { clinicId, deletedAt: null },
        },
      };
    }
    const services = await this.prisma.service.findMany({
      where,
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
      clinic_id: clinicId ?? null,
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
  // Khớp luồng đặt lịch của app (appointment.service): slot bắt đầu TRƯỚC 12:00 là
  // buổi sáng (slot 11:30-12:00 vẫn là sáng); chiều chạy tới 17:30 để không rớt
  // slot 17:00-17:30 (bác sĩ làm đến 17:30).
  private timeWindow(pref?: string): { start: number; end: number } | null {
    switch (pref) {
      case 'morning':
        return { start: 6 * 60, end: 12 * 60 };
      case 'noon':
        return { start: 11 * 60, end: 13 * 60 + 30 };
      case 'afternoon':
        return { start: 12 * 60, end: 17 * 60 + 30 };
      case 'evening':
        return { start: 17 * 60, end: 21 * 60 };
      case 'office':
        return { start: 8 * 60, end: 17 * 60 + 30 };
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
          // Trả đủ slot trong khung (buổi sáng ~7 slot) thay vì 4 slot mẫu —
          // LLM đọc sample sẽ nói sai "chỉ trống 8h-9h30". Cap 12 phòng trường
          // hợp không lọc buổi (cả ngày ~19 slot x 10 bác sĩ phình context).
          sample_slots: slots.slice(0, 12),
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

  /**
   * Không silent-fallback: sai/missing profile phải trả error_code rõ.
   */
  private async resolveOwnedPatientProfile(
    actingUserId: number,
    patientProfileId?: number | null,
  ) {
    if (patientProfileId == null || !Number.isInteger(patientProfileId) || patientProfileId <= 0) {
      return { error_code: 'patient_profile_required' as const };
    }
    const owned = await this.prisma.patientProfile.findFirst({
      where: { id: patientProfileId, managerId: actingUserId },
    });
    if (owned) return { profile: owned };
    const exists = await this.prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
      select: { id: true },
    });
    if (exists) return { error_code: 'patient_profile_forbidden' as const };
    return { error_code: 'patient_profile_not_found' as const };
  }

  /** Validate slot thuộc working hours / override và chưa qua giờ (GMT+7). */
  private async assertSlotBookable(
    doctorId: number,
    serviceId: number,
    start: Date,
    durationMin: number,
  ): Promise<{ error_code: string } | null> {
    if (Number.isNaN(start.getTime())) {
      return { error_code: 'invalid_start_time' };
    }
    if (start.getTime() <= Date.now()) {
      return { error_code: 'slot_in_past' };
    }

    const dateVn = new Date(start.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
    const slotHhmm = this.toHHMM(this.vnMinuteOfDay(start));
    const availability = await this.getDoctorAvailability(doctorId, dateVn, serviceId);
    if ((availability as any).error_code === 'doctor_off') {
      return { error_code: 'doctor_off' };
    }
    if ((availability as any).error_code === 'invalid_date') {
      return { error_code: 'invalid_date' };
    }
    const slots: string[] = (availability as any).available_slots ?? [];
    if (!slots.includes(slotHhmm)) {
      // occupied vs outside hours
      const occupied: string[] = (availability as any).occupied_slots ?? [];
      if (occupied.includes(slotHhmm)) {
        return { error_code: 'slot_taken' };
      }
      return { error_code: 'slot_outside_working_hours' };
    }

    // Slot duration must fit (already encoded in available_slots generation).
    const end = new Date(start.getTime() + durationMin * 60000);
    if (end.getTime() <= start.getTime()) {
      return { error_code: 'invalid_duration' };
    }
    return null;
  }

  private validateOfflineBookingContext(
    profile: {
      gender: string | null;
      dateOfBirth: Date | null;
    },
    service: {
      isAvailableOffline: boolean;
      targetGender: string | null;
      minAge: number | null;
      maxAge: number | null;
    },
    doctor: {
      clinicId: number | null;
      clinic?: { isActive: boolean } | null;
    },
  ): { error_code: string } | null {
    if (!service.isAvailableOffline) {
      return { error_code: 'service_type_mismatch' };
    }
    if (!doctor.clinicId || !doctor.clinic?.isActive) {
      return { error_code: 'clinic_not_available' };
    }
    if (
      service.targetGender &&
      profile.gender &&
      service.targetGender !== profile.gender
    ) {
      return { error_code: 'patient_gender_mismatch' };
    }
    if (profile.dateOfBirth) {
      const today = new Date();
      const dob = new Date(profile.dateOfBirth);
      let age = today.getUTCFullYear() - dob.getUTCFullYear();
      const birthdayPassed =
        today.getUTCMonth() > dob.getUTCMonth() ||
        (today.getUTCMonth() === dob.getUTCMonth() &&
          today.getUTCDate() >= dob.getUTCDate());
      if (!birthdayPassed) age -= 1;
      if (
        (service.minAge != null && age < service.minAge) ||
        (service.maxAge != null && age > service.maxAge)
      ) {
        return { error_code: 'patient_age_mismatch' };
      }
    }
    return null;
  }

  async createBookingDraft(
    actingUserId: number,
    input: {
      patientProfileId: number;
      doctorId: number;
      serviceId: number;
      startTime: string;
      idempotencyKey: string;
    },
  ) {
    const resolved = await this.resolveOwnedPatientProfile(
      actingUserId,
      input.patientProfileId,
    );
    if ('error_code' in resolved) return resolved;
    const patientProfileId = resolved.profile.id;

    const svc = await this.prisma.service.findUnique({ where: { id: input.serviceId } });
    if (!svc) return { error_code: 'service_not_found' };

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: input.doctorId, deletedAt: null },
      include: { clinic: true },
    });
    if (!doctor) return { error_code: 'doctor_not_found' };

    // Doctor must offer this service.
    const doctorService = await this.prisma.doctorService.findFirst({
      where: { doctorId: input.doctorId, serviceId: input.serviceId },
    });
    if (!doctorService) {
      return { error_code: 'doctor_service_mismatch' };
    }
    const contextError = this.validateOfflineBookingContext(
      resolved.profile,
      svc,
      doctor,
    );
    if (contextError) return contextError;

    const start = new Date(input.startTime);
    const end = new Date(start.getTime() + svc.duration * 60000);

    const slotErr = await this.assertSlotBookable(
      input.doctorId,
      input.serviceId,
      start,
      svc.duration,
    );
    if (slotErr) return slotErr;

    const conflicts = await this.findConflicts(input.doctorId, start, end);
    if (conflicts.length) {
      return { error_code: 'slot_taken', conflicts };
    }

    // recap_data: tên chuẩn từ DB; AI chỉ đặt offline. Confirm luôn đọc draft row,
    // nên recap khi reuse PHẢI khớp row (không lấy request mới nếu payload lệch).
    const buildRecap = async (params: {
      doctorId: number;
      serviceId: number;
      startTime: Date;
      patientProfileId: number;
    }) => {
      const [doc, service, profile] = await Promise.all([
        this.prisma.doctorProfile.findFirst({
          where: { id: params.doctorId, deletedAt: null },
          include: { clinic: true },
        }),
        this.prisma.service.findUnique({ where: { id: params.serviceId } }),
        this.prisma.patientProfile.findUnique({
          where: { id: params.patientProfileId },
          select: { firstName: true, lastName: true },
        }),
      ]);
      if (!doc || !service) {
        return null;
      }
      return {
        doctor_id: params.doctorId,
        doctor_name: `${doc.firstName} ${doc.lastName}`,
        service_id: params.serviceId,
        service_name: service.name,
        start_time: params.startTime.toISOString(),
        price: service.price,
        clinic_id: doc.clinicId ?? null,
        clinic_name: doc.clinic?.name ?? null,
        patient_profile_id: params.patientProfileId,
        patient_name: profile
          ? `${profile.lastName} ${profile.firstName}`.trim()
          : null,
        appointment_type: AI_APPOINTMENT_TYPE,
      };
    };

    const recapData = await buildRecap({
      doctorId: input.doctorId,
      serviceId: input.serviceId,
      startTime: start,
      patientProfileId,
    });
    if (!recapData) return { error_code: 'service_not_found' };

    const existing = await this.prisma.bookingDraft.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      // CONFIRMED -> idempotent, recap từ appointment/draft đã chốt.
      if (existing.status === 'CONFIRMED') {
        const storedRecap =
          (await buildRecap({
            doctorId: existing.doctorId,
            serviceId: existing.serviceId,
            startTime: existing.startTime,
            patientProfileId: existing.patientProfileId,
          })) ?? recapData;
        return {
          draft_id: existing.id,
          expires_at: existing.expiresAt.toISOString(),
          conflicts: [],
          recap_data: storedRecap,
          already_confirmed: true,
          confirmed_appointment_id: existing.confirmedAppointmentId,
        };
      }

      const pendingValid =
        existing.status === 'PENDING' && existing.expiresAt.getTime() > Date.now();

      if (pendingValid) {
        const samePayload =
          existing.doctorId === input.doctorId &&
          existing.serviceId === input.serviceId &&
          existing.patientProfileId === patientProfileId &&
          existing.startTime.getTime() === start.getTime();

        if (samePayload) {
          // Source of truth = draft row; recap từ DB, không từ request "mới".
          const storedRecap =
            (await buildRecap({
              doctorId: existing.doctorId,
              serviceId: existing.serviceId,
              startTime: existing.startTime,
              patientProfileId: existing.patientProfileId,
            })) ?? recapData;
          return {
            draft_id: existing.id,
            expires_at: existing.expiresAt.toISOString(),
            conflicts: [],
            recap_data: storedRecap,
          };
        }

        // Cùng idempotency key nhưng payload lệch (key cũ thiếu service_id, hoặc
        // client lỗi): cập nhật PENDING draft theo request đã validate để
        // recap === confirm target.
        const updated = await this.prisma.bookingDraft.update({
          where: { id: existing.id },
          data: {
            patientProfileId,
            doctorId: input.doctorId,
            serviceId: input.serviceId,
            startTime: start,
            endTime: end,
            estimatedPrice: Math.round(svc.price),
            expiresAt: new Date(Date.now() + 10 * 60000),
            status: 'PENDING',
          },
        });
        return {
          draft_id: updated.id,
          expires_at: updated.expiresAt.toISOString(),
          conflicts: [],
          recap_data: recapData,
          draft_refreshed: true,
        };
      }

      // Draft hết hạn/EXPIRED -> hồi sinh với payload hiện tại.
      const revived = await this.prisma.bookingDraft.update({
        where: { id: existing.id },
        data: {
          patientProfileId,
          doctorId: input.doctorId,
          serviceId: input.serviceId,
          startTime: start,
          endTime: end,
          estimatedPrice: Math.round(svc.price),
          expiresAt: new Date(Date.now() + 10 * 60000),
          status: 'PENDING',
        },
      });
      return {
        draft_id: revived.id,
        expires_at: revived.expiresAt.toISOString(),
        conflicts: [],
        recap_data: recapData,
      };
    }

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
      conflicts: [],
      recap_data: recapData,
    };
  }

  async confirmBooking(
    actingUserId: number,
    draftId: string,
    idempotencyKey: string,
  ) {
    // Atomic: lock draft row → re-check conflict → create appointment + billing → confirm.
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT id FROM "BookingDraft" WHERE id = ${draftId} FOR UPDATE`;

          const draft = await tx.bookingDraft.findUnique({
            where: { id: draftId },
            include: {
              patientProfile: true,
              doctor: { include: { clinic: true } },
              service: true,
            },
          });
          if (!draft) return { error_code: 'draft_not_found' as const };
          if (draft.patientProfile.managerId !== actingUserId) {
            throw new ForbiddenException('forbidden_cross_user');
          }
          if (draft.status === 'CONFIRMED' && draft.confirmedAppointmentId) {
            return {
              appointment_id: draft.confirmedAppointmentId,
              status: 'booked' as const,
              idempotent: true,
            };
          }
          if (
            draft.confirmIdempotencyKey &&
            draft.confirmIdempotencyKey !== idempotencyKey
          ) {
            return { error_code: 'idempotency_conflict' as const };
          }
          if (draft.status === 'EXPIRED' || draft.expiresAt.getTime() < Date.now()) {
            await tx.bookingDraft.update({
              where: { id: draftId },
              data: { status: 'EXPIRED' },
            });
            return { error_code: 'draft_expired' as const };
          }

          const conflicts = await tx.appointment.findMany({
            where: {
              doctorId: draft.doctorId,
              status: { in: ACTIVE_STATUSES as unknown as any[] },
              startTime: { lt: draft.endTime },
              endTime: { gt: draft.startTime },
            },
            select: { id: true },
          });
          if (conflicts.length) {
            return { error_code: 'slot_taken' as const };
          }

          // Re-validate doctor still offers service and is active.
          if (draft.doctor.deletedAt) {
            return { error_code: 'doctor_not_found' as const };
          }
          const ds = await tx.doctorService.findFirst({
            where: { doctorId: draft.doctorId, serviceId: draft.serviceId },
          });
          if (!ds) return { error_code: 'doctor_service_mismatch' as const };
          const contextError = this.validateOfflineBookingContext(
            draft.patientProfile,
            draft.service,
            draft.doctor,
          );
          if (contextError) {
            return { error_code: contextError.error_code };
          }

          const appt = await tx.appointment.create({
            data: {
              startTime: draft.startTime,
              endTime: draft.endTime,
              status: 'UPCOMING',
              type: AI_APPOINTMENT_TYPE,
              patientProfileId: draft.patientProfileId,
              doctorId: draft.doctorId,
              serviceId: draft.serviceId,
              clinicId: draft.doctor.clinicId,
            },
            include: {
              patientProfile: true,
              doctor: true,
              service: true,
              clinic: true,
            },
          });

          await tx.billing.create({
            data: {
              amount: draft.service?.price ?? draft.estimatedPrice,
              status: PaymentStatus.PENDING,
              appointmentId: appt.id,
            },
          });

          await tx.bookingDraft.update({
            where: { id: draftId },
            data: {
              status: 'CONFIRMED',
              confirmedAppointmentId: appt.id,
              confirmIdempotencyKey: idempotencyKey,
            },
          });

          return {
            appointment_id: appt.id,
            status: 'booked' as const,
            _notify: {
              patientUserId: appt.patientProfile?.managerId?.toString(),
              doctorUserId: appt.doctor.userId?.toString(),
              startTime: appt.startTime,
              doctorName: `${appt.doctor.firstName} ${appt.doctor.lastName}`,
              patientName: `${appt.patientProfile?.firstName ?? ''} ${appt.patientProfile?.lastName ?? ''}`.trim(),
              serviceName: appt.service?.name ?? '',
              clinicName: appt.clinic?.name ?? 'Phòng khám',
            },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if ('error_code' in result) return result;
      if ('idempotent' in result && result.idempotent) {
        return { appointment_id: result.appointment_id, status: 'booked' };
      }

      // Notifications outside transaction (best-effort).
      const n = (result as any)._notify;
      if (n) {
        try {
          if (n.patientUserId) {
            await this.notificationService.sendCreateAppointmentPatientNotification({
              appointmentId: result.appointment_id,
              startTime: n.startTime,
              doctorName: n.doctorName,
              serviceName: n.serviceName,
              clinicName: n.clinicName,
              recipientId: n.patientUserId,
            });
          }
        } catch (err) {
          this.logger.error('AI confirm: patient notification failed', err instanceof Error ? err.stack : err);
        }
        try {
          if (n.doctorUserId) {
            await this.notificationService.sendCreateAppointmentDoctorNotification({
              appointmentId: result.appointment_id,
              startTime: n.startTime,
              patientName: n.patientName,
              serviceName: n.serviceName,
              clinicName: n.clinicName,
              recipientId: n.doctorUserId,
            });
          }
        } catch (err) {
          this.logger.error('AI confirm: doctor notification failed', err instanceof Error ? err.stack : err);
        }
      }

      return { appointment_id: result.appointment_id, status: 'booked' };
    } catch (err) {
      // Auth / HTTP: bubble up (không nuốt thành slot_taken).
      if (err instanceof ForbiddenException) throw err;
      if (err instanceof HttpException) throw err;

      const classified = this.classifyConfirmTransactionError(err);
      this.logger.warn(
        `confirmBooking transaction failed: error_code=${classified.error_code} msg=${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      // Race/unique → DATA error_code cho LLM. Lỗi khác → 5xx (ops thấy rõ, không giả slot).
      if (classified.httpStatus >= 500) {
        throw new HttpException(
          {
            error_code: classified.error_code,
            message: 'confirm_booking_internal_error',
          },
          classified.httpStatus,
        );
      }
      return { error_code: classified.error_code };
    }
  }

  /**
   * Chỉ map serialization / unique-conflict → slot_taken.
   * Mọi lỗi khác → bridge_internal_error (+ 5xx ở caller).
   */
  private classifyConfirmTransactionError(err: unknown): {
    error_code: string;
    httpStatus: number;
  } {
    const prismaCode =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    const msg = err instanceof Error ? err.message : String(err);

    // P2034: write conflict / serialization; P2002: unique constraint (double book).
    const isRaceOrUnique =
      prismaCode === 'P2034' ||
      prismaCode === 'P2002' ||
      /could not serialize|serialization failure|deadlock detected|write conflict|unique constraint|duplicate key/i.test(
        msg,
      );

    if (isRaceOrUnique) {
      return { error_code: 'slot_taken', httpStatus: 200 };
    }

    // DB down / billing / schema / bug — không giả slot_taken.
    return { error_code: 'bridge_internal_error', httpStatus: 503 };
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
      include: {
        patientProfile: true,
        doctor: true,
        service: true,
        clinic: true,
      },
    });
    if (!appt) return { error_code: 'appointment_not_found' };
    if (appt.patientProfile?.managerId !== actingUserId) {
      throw new ForbiddenException('forbidden_cross_user');
    }
    if (appt.status === 'CANCELLED') {
      return { success: true, already_cancelled: true };
    }
    if (!['UPCOMING', 'ON_GOING'].includes(appt.status)) {
      return { error_code: 'appointment_not_cancellable' };
    }
    const fourHoursLater = new Date(Date.now() + 4 * 3600 * 1000);
    if (appt.startTime.getTime() < fourHoursLater.getTime()) {
      return { error_code: 'cannot_cancel_near_time' };
    }

    // Atomic-ish: only cancel if still active (concurrent cancel -> already_cancelled).
    const updated = await this.prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        status: { in: ['UPCOMING', 'ON_GOING'] as any },
      },
      data: { status: 'CANCELLED' },
    });
    if (updated.count === 0) {
      return { success: true, already_cancelled: true };
    }

    // Best-effort notifications (domain parity).
    try {
      const patientUserId = appt.patientProfile?.managerId?.toString();
      if (patientUserId) {
        await this.notificationService.sendDeleteAppointmentPatientNotification({
          appointmentId: appt.id,
          startTime: appt.startTime,
          doctorName: `${appt.doctor.firstName} ${appt.doctor.lastName}`,
          serviceName: appt.service?.name ?? '',
          recipientId: patientUserId,
          reason: 'Hủy qua trợ lý AI',
        });
      }
    } catch (err) {
      this.logger.error(
        'AI cancel: patient notification failed',
        err instanceof Error ? err.stack : err,
      );
    }
    try {
      await this.notificationService.sendDeleteAppointmentDoctorNotification({
        appointmentId: appt.id,
        startTime: appt.startTime,
        patientName: `${appt.patientProfile?.firstName ?? ''} ${appt.patientProfile?.lastName ?? ''}`.trim(),
        serviceName: appt.service?.name ?? '',
        recipientId: appt.doctor.userId.toString(),
        reason: 'Hủy qua trợ lý AI',
      });
    } catch (err) {
      this.logger.error(
        'AI cancel: doctor notification failed',
        err instanceof Error ? err.stack : err,
      );
    }

    return { success: true, appointment_id: appointmentId, status: 'CANCELLED' };
  }
}
