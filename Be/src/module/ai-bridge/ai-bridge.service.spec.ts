import { ForbiddenException, HttpException } from '@nestjs/common';
import { AiBridgeService } from './ai-bridge.service';
import { CreateBookingDraftSchema } from './dto/ai-bridge.dto';
import {
  BookingDraftResponseSchema,
  CancelAppointmentResponseSchema,
  ConfirmBookingResponseSchema,
  ErrorCodeSchema,
  SearchServicesResponseSchema,
} from './dto/ai-bridge.responses';

const USER = 10;
const OTHER_USER = 11;
const PROFILE = 100;
const DOCTOR = 5;
const SERVICE = 7;
const CLINIC = 3;

/** 09:00 giờ VN của (hôm nay + days) dưới dạng ISO có timezone. */
function slotIso(days: number, hhmm = '09:00'): string {
  const d = new Date(Date.now() + 7 * 3600 * 1000 + days * 86400 * 1000);
  return `${d.toISOString().slice(0, 10)}T${hhmm}:00+07:00`;
}

/**
 * Prisma giả có trạng thái trong bộ nhớ. `$transaction` chạy tuần tự (mutex) để mô
 * phỏng hành vi Serializable + FOR UPDATE: tx sau thấy kết quả commit của tx trước.
 */
function makeFakePrisma() {
  const state = {
    profiles: [
      { id: PROFILE, managerId: USER, firstName: 'An', lastName: 'Nguyen', gender: 'MALE', dateOfBirth: new Date('1990-01-01') },
      { id: 200, managerId: OTHER_USER, firstName: 'Binh', lastName: 'Tran', gender: 'MALE', dateOfBirth: new Date('1990-01-01') },
    ],
    service: { id: SERVICE, name: 'Khám tổng quát', price: 200000, duration: 30, isAvailableOffline: true, targetGender: null, minAge: null, maxAge: null },
    doctor: { id: DOCTOR, firstName: 'Lan', lastName: 'Le', userId: 77, clinicId: CLINIC, deletedAt: null as Date | null, clinic: { id: CLINIC, name: 'PK A', isActive: true } },
    doctorServices: [{ doctorId: DOCTOR, serviceId: SERVICE }] as { doctorId: number; serviceId: number }[],
    availability: new Map<number, { startTime: string; endTime: string }>(),
    overrides: [] as { date: string; startTime: string | null; endTime: string | null }[],
    appointments: [] as any[],
    drafts: [] as any[],
    billings: [] as any[],
    nextApptId: 1,
    nextDraftId: 1,
  };
  for (let dow = 0; dow < 7; dow++) state.availability.set(dow, { startTime: '08:00', endTime: '17:00' });

  const matchDraft = (d: any) => ({
    ...d,
    patientProfile: state.profiles.find((p) => p.id === d.patientProfileId),
    doctor: state.doctor,
    service: state.service,
  });

  const api: any = {
    patientProfile: {
      findFirst: jest.fn(async ({ where }: any) =>
        state.profiles.find((p) => p.id === where.id && p.managerId === where.managerId) ?? null),
      findUnique: jest.fn(async ({ where }: any) => state.profiles.find((p) => p.id === where.id) ?? null),
    },
    service: { findUnique: jest.fn(async () => state.service) },
    doctorProfile: {
      findUnique: jest.fn(async () => (state.doctor.deletedAt ? null : state.doctor)),
      findFirst: jest.fn(async () => (state.doctor.deletedAt ? null : state.doctor)),
    },
    doctorService: {
      findFirst: jest.fn(async ({ where }: any) =>
        state.doctorServices.find((x) => x.doctorId === where.doctorId && x.serviceId === where.serviceId) ?? null),
    },
    availabilityOverride: {
      findUnique: jest.fn(async ({ where }: any) => {
        const iso = where.doctorId_date.date.toISOString().slice(0, 10);
        return state.overrides.find((o) => o.date === iso) ?? null;
      }),
    },
    doctorAvailability: {
      findUnique: jest.fn(async ({ where }: any) => state.availability.get(where.doctorId_dayOfWeek.dayOfWeek) ?? null),
    },
    appointment: {
      findMany: jest.fn(async ({ where }: any) =>
        state.appointments.filter((a) => {
          if (a.doctorId !== where.doctorId) return false;
          if (!where.status.in.includes(a.status)) return false;
          if (where.startTime?.gte) return a.startTime >= where.startTime.gte && a.startTime < where.startTime.lt;
          return a.startTime < where.startTime.lt && a.endTime > where.endTime.gt;
        })),
      create: jest.fn(async ({ data }: any) => {
        // Ràng buộc exclusion của DB: không overlap active cùng doctor.
        const clash = state.appointments.some(
          (a) => a.doctorId === data.doctorId && ['UPCOMING', 'ON_GOING'].includes(a.status) &&
            a.startTime < data.endTime && a.endTime > data.startTime,
        );
        if (clash) throw new Error('conflicting key value violates exclusion constraint "Appointment_doctor_active_no_overlap"');
        const a = {
          ...data,
          id: state.nextApptId++,
          patientProfile: state.profiles.find((p) => p.id === data.patientProfileId),
          doctor: state.doctor,
          service: state.service,
          clinic: state.doctor.clinic,
        };
        state.appointments.push(a);
        return a;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const a = state.appointments.find((x) => x.id === where.id);
        return a ? { ...a } : null;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const a = state.appointments.find((x) => x.id === where.id && where.status.in.includes(x.status));
        if (!a) return { count: 0 };
        Object.assign(a, data);
        return { count: 1 };
      }),
    },
    billing: { create: jest.fn(async ({ data }: any) => { state.billings.push(data); return data; }) },
    bookingDraft: {
      findUnique: jest.fn(async ({ where }: any) => {
        const d = state.drafts.find((x) => (where.id ? x.id === where.id : x.idempotencyKey === where.idempotencyKey));
        return d ? matchDraft(d) : null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const d = { ...data, id: `d${state.nextDraftId++}`, confirmedAppointmentId: null, confirmIdempotencyKey: null };
        state.drafts.push(d);
        return d;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const d = state.drafts.find((x) => x.id === where.id);
        Object.assign(d, data);
        return d;
      }),
    },
    $executeRaw: jest.fn(async () => 1),
  };

  let chain: Promise<unknown> = Promise.resolve();
  api.$transaction = jest.fn((fn: (tx: any) => Promise<unknown>) => {
    const run = chain.then(() => fn(api));
    chain = run.catch(() => undefined);
    return run;
  });

  return { api, state };
}

function makeService() {
  const { api, state } = makeFakePrisma();
  const notifications = {
    sendCreateAppointmentPatientNotification: jest.fn(async () => undefined),
    sendCreateAppointmentDoctorNotification: jest.fn(async () => undefined),
    sendDeleteAppointmentPatientNotification: jest.fn(async () => undefined),
    sendDeleteAppointmentDoctorNotification: jest.fn(async () => undefined),
  };
  const svc = new AiBridgeService(api as any, notifications as any);
  return { svc, api, state, notifications };
}

const draftInput = (over: Partial<Record<string, any>> = {}) => ({
  patientProfileId: PROFILE,
  doctorId: DOCTOR,
  serviceId: SERVICE,
  startTime: slotIso(3),
  idempotencyKey: 'key-1',
  ...over,
});

describe('AiBridgeService.createBookingDraft invariants', () => {
  it('tạo draft hợp lệ', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput());
    expect(res.error_code).toBeUndefined();
    expect(res.draft_id).toBeDefined();
    expect(res.recap_data.appointment_type).toBe('OFFLINE');
  });

  it('patient profile của user khác → patient_profile_forbidden', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput({ patientProfileId: 200 }));
    expect(res.error_code).toBe('patient_profile_forbidden');
  });

  it('patient profile không tồn tại → patient_profile_not_found', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput({ patientProfileId: 999 }));
    expect(res.error_code).toBe('patient_profile_not_found');
  });

  it('doctor không có service → doctor_service_mismatch', async () => {
    const { svc, state } = makeService();
    state.doctorServices.length = 0;
    const res: any = await svc.createBookingDraft(USER, draftInput());
    expect(res.error_code).toBe('doctor_service_mismatch');
  });

  it('doctor đã xóa → doctor_not_found', async () => {
    const { svc, state } = makeService();
    state.doctor.deletedAt = new Date();
    const res: any = await svc.createBookingDraft(USER, draftInput());
    expect(res.error_code).toBe('doctor_not_found');
  });

  it('slot trong quá khứ → slot_in_past', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput({ startTime: slotIso(-2) }));
    expect(res.error_code).toBe('slot_in_past');
  });

  it('startTime không parse được → invalid_start_time', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput({ startTime: 'abc' }));
    expect(res.error_code).toBe('invalid_start_time');
  });

  it('slot ngoài giờ làm việc → slot_outside_working_hours', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput({ startTime: slotIso(3, '19:00') }));
    expect(res.error_code).toBe('slot_outside_working_hours');
  });

  it('slot cuối ngày không đủ duration → slot_outside_working_hours', async () => {
    const { svc } = makeService();
    const res: any = await svc.createBookingDraft(USER, draftInput({ startTime: slotIso(3, '16:45') }));
    expect(res.error_code).toBe('slot_outside_working_hours');
  });

  it('override nghỉ → doctor_off', async () => {
    const { svc, state } = makeService();
    const start = slotIso(3);
    state.overrides.push({ date: start.slice(0, 10), startTime: null, endTime: null });
    const res: any = await svc.createBookingDraft(USER, draftInput({ startTime: start }));
    expect(res.error_code).toBe('doctor_off');
  });

  it('bác sĩ không làm ngày đó → doctor_off', async () => {
    const { svc, state } = makeService();
    state.availability.clear();
    const res: any = await svc.createBookingDraft(USER, draftInput());
    expect(res.error_code).toBe('doctor_off');
  });

  it('slot đã có lịch active → slot_taken, không tạo draft', async () => {
    const { svc, state } = makeService();
    const start = new Date(slotIso(3));
    state.appointments.push({
      id: 900, doctorId: DOCTOR, status: 'UPCOMING', startTime: start, endTime: new Date(start.getTime() + 30 * 60000),
    });
    const res: any = await svc.createBookingDraft(USER, draftInput());
    expect(res.error_code).toBe('slot_taken');
    expect(state.drafts).toHaveLength(0);
  });

  it('lịch CANCELLED không chặn slot', async () => {
    const { svc, state } = makeService();
    const start = new Date(slotIso(3));
    state.appointments.push({
      id: 900, doctorId: DOCTOR, status: 'CANCELLED', startTime: start, endTime: new Date(start.getTime() + 30 * 60000),
    });
    const res: any = await svc.createBookingDraft(USER, draftInput());
    expect(res.error_code).toBeUndefined();
  });

  it('cùng idempotency key, cùng payload → cùng draft', async () => {
    const { svc, state } = makeService();
    const a: any = await svc.createBookingDraft(USER, draftInput());
    const b: any = await svc.createBookingDraft(USER, draftInput());
    expect(b.draft_id).toBe(a.draft_id);
    expect(state.drafts).toHaveLength(1);
  });

  it('idempotency key của draft user khác → idempotency_conflict, không đụng draft đó', async () => {
    const { svc, state } = makeService();
    await svc.createBookingDraft(USER, draftInput());
    const before = JSON.stringify(state.drafts);
    const res: any = await svc.createBookingDraft(OTHER_USER, draftInput({ patientProfileId: 200, doctorId: DOCTOR }));
    expect(res.error_code).toBe('idempotency_conflict');
    expect(JSON.stringify(state.drafts)).toBe(before);
  });
});

describe('AiBridgeService.confirmBooking', () => {
  async function draft(svc: AiBridgeService, key = 'key-1', start = slotIso(3)) {
    const d: any = await svc.createBookingDraft(USER, draftInput({ idempotencyKey: key, startTime: start }));
    return d.draft_id as string;
  }

  it('confirm tạo đúng 1 appointment + billing và đánh dấu draft CONFIRMED', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res).toEqual({ appointment_id: 1, status: 'booked' });
    expect(state.appointments).toHaveLength(1);
    expect(state.billings).toHaveLength(1);
    expect(state.drafts[0].status).toBe('CONFIRMED');
  });

  it('hai confirm đồng thời cùng draft → một appointment, cùng appointment_id', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    const [a, b]: any[] = await Promise.all([
      svc.confirmBooking(USER, id, 'c1'),
      svc.confirmBooking(USER, id, 'c1'),
    ]);
    expect(state.appointments).toHaveLength(1);
    expect(state.billings).toHaveLength(1);
    expect(a.appointment_id).toBe(b.appointment_id);
  });

  it('retry confirm (kể cả key khác) sau khi đã CONFIRMED → cùng appointment, không side effect mới', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    const first: any = await svc.confirmBooking(USER, id, 'c1');
    const again: any = await svc.confirmBooking(USER, id, 'c1');
    const otherKey: any = await svc.confirmBooking(USER, id, 'c2');
    expect(again.appointment_id).toBe(first.appointment_id);
    expect(otherKey.appointment_id).toBe(first.appointment_id);
    expect(state.appointments).toHaveLength(1);
  });

  it('hai draft cùng doctor/giờ, confirm đồng thời → tối đa một appointment', async () => {
    const { svc, state } = makeService();
    const d1 = await draft(svc, 'k1');
    const d2 = await draft(svc, 'k2');
    const results: any[] = await Promise.all([
      svc.confirmBooking(USER, d1, 'c1'),
      svc.confirmBooking(USER, d2, 'c2'),
    ]);
    expect(state.appointments).toHaveLength(1);
    expect(results.filter((r) => r.status === 'booked')).toHaveLength(1);
    expect(results.filter((r) => r.error_code === 'slot_taken')).toHaveLength(1);
  });

  it('draft của user khác → ForbiddenException, không tạo appointment', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    await expect(svc.confirmBooking(OTHER_USER, id, 'c1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(state.appointments).toHaveLength(0);
  });

  it('draft không tồn tại → draft_not_found', async () => {
    const { svc } = makeService();
    const res: any = await svc.confirmBooking(USER, 'nope', 'c1');
    expect(res.error_code).toBe('draft_not_found');
  });

  it('draft hết hạn → draft_expired và đánh dấu EXPIRED', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    state.drafts[0].expiresAt = new Date(Date.now() - 1000);
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res.error_code).toBe('draft_expired');
    expect(state.drafts[0].status).toBe('EXPIRED');
    expect(state.appointments).toHaveLength(0);
  });

  it('draft đã bind confirm key khác (chưa CONFIRMED) → idempotency_conflict', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    state.drafts[0].confirmIdempotencyKey = 'other';
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res.error_code).toBe('idempotency_conflict');
  });

  it('slot bị người khác đặt sau khi tạo draft → slot_taken', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    state.appointments.push({
      id: 900, doctorId: DOCTOR, status: 'UPCOMING',
      startTime: state.drafts[0].startTime, endTime: state.drafts[0].endTime,
    });
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res.error_code).toBe('slot_taken');
    expect(state.appointments).toHaveLength(1);
  });

  it('draft quá giờ hẹn (còn TTL) → slot_in_past, không tạo appointment', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    state.drafts[0].startTime = new Date(Date.now() - 3600 * 1000);
    state.drafts[0].endTime = new Date(Date.now() - 1800 * 1000);
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res.error_code).toBe('slot_in_past');
    expect(state.appointments).toHaveLength(0);
  });

  it('bác sĩ nghỉ/đổi lịch sau khi tạo draft → doctor_off', async () => {
    const { svc, state } = makeService();
    const id = await draft(svc);
    state.availability.clear();
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res.error_code).toBe('doctor_off');
  });

  it('abort Serializable (P2034) được retry; lần sau thấy draft đã CONFIRMED → cùng appointment', async () => {
    const { svc, api, state } = makeService();
    const id = await draft(svc);
    const real = api.$transaction.getMockImplementation();
    let calls = 0;
    api.$transaction.mockImplementation(async (fn: any, opts: any) => {
      calls++;
      if (calls === 1) {
        // Tx A commit thật, nhưng tx của ta (đồng thời) bị abort.
        await real(fn, opts);
        throw Object.assign(new Error('write conflict'), { code: 'P2034' });
      }
      return real(fn, opts);
    });
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res).toEqual({ appointment_id: 1, status: 'booked' });
    expect(state.appointments).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it('DB exclusion constraint vi phạm → slot_taken (lớp bảo vệ cuối)', async () => {
    const { svc, api } = makeService();
    const id = await draft(svc);
    api.$transaction.mockImplementation(async () => {
      throw new Error('conflicting key value violates exclusion constraint "Appointment_doctor_active_no_overlap"');
    });
    const res: any = await svc.confirmBooking(USER, id, 'c1');
    expect(res).toEqual({ error_code: 'slot_taken' });
  });

  it('lỗi hạ tầng → 503 bridge_internal_error, không giả slot_taken', async () => {
    const { svc, api } = makeService();
    const id = await draft(svc);
    api.$transaction.mockImplementation(async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.1:5432');
    });
    const err: any = await svc.confirmBooking(USER, id, 'c1').catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(503);
    expect(JSON.stringify(err.getResponse())).not.toContain('ECONNREFUSED');
  });

  it('billing lỗi → rollback (không orphan): lỗi nổi lên, không báo booked', async () => {
    const { svc, api } = makeService();
    const id = await draft(svc);
    api.billing.create.mockRejectedValueOnce(new Error('billing down'));
    const err: any = await svc.confirmBooking(USER, id, 'c1').catch((e) => e);
    expect(err).toBeInstanceOf(HttpException);
  });
});

describe('AiBridgeService.cancelAppointment', () => {
  const future = () => new Date(Date.now() + 48 * 3600 * 1000);

  function seed(state: any, over: Record<string, any> = {}) {
    state.appointments.push({
      id: 50, doctorId: DOCTOR, status: 'UPCOMING', startTime: future(), endTime: future(),
      patientProfileId: PROFILE, patientProfile: state.profiles[0], doctor: state.doctor,
      service: state.service, clinic: state.doctor.clinic, ...over,
    });
  }

  it('lịch của user khác → ForbiddenException', async () => {
    const { svc, state } = makeService();
    seed(state);
    await expect(svc.cancelAppointment(OTHER_USER, 50)).rejects.toBeInstanceOf(ForbiddenException);
    expect(state.appointments[0].status).toBe('UPCOMING');
  });

  it('hủy hợp lệ, hủy lại → already_cancelled', async () => {
    const { svc, state } = makeService();
    seed(state);
    const a: any = await svc.cancelAppointment(USER, 50);
    expect(a.status).toBe('CANCELLED');
    const b: any = await svc.cancelAppointment(USER, 50);
    expect(b.already_cancelled).toBe(true);
    expect(state.appointments[0].status).toBe('CANCELLED');
  });

  it('dưới 4 giờ → cannot_cancel_near_time', async () => {
    const { svc, state } = makeService();
    seed(state, { startTime: new Date(Date.now() + 3600 * 1000) });
    const res: any = await svc.cancelAppointment(USER, 50);
    expect(res.error_code).toBe('cannot_cancel_near_time');
  });

  it('không tồn tại → appointment_not_found', async () => {
    const { svc } = makeService();
    const res: any = await svc.cancelAppointment(USER, 999);
    expect(res.error_code).toBe('appointment_not_found');
  });

  it('mất race vì trạng thái đổi sang COMPLETED → appointment_not_cancellable (không báo đã hủy)', async () => {
    const { svc, state, api } = makeService();
    seed(state);
    api.appointment.updateMany.mockImplementationOnce(async () => {
      state.appointments[0].status = 'COMPLETED';
      return { count: 0 };
    });
    const res: any = await svc.cancelAppointment(USER, 50);
    expect(res.error_code).toBe('appointment_not_cancellable');
  });

  it('hai lần hủy đồng thời: mất race do bên kia đã hủy → already_cancelled', async () => {
    const { svc, state, api } = makeService();
    seed(state);
    api.appointment.updateMany.mockImplementationOnce(async () => {
      state.appointments[0].status = 'CANCELLED';
      return { count: 0 };
    });
    const res: any = await svc.cancelAppointment(USER, 50);
    expect(res.already_cancelled).toBe(true);
  });
});

describe('AiBridgeService.searchServices', () => {
  it('clinicId thực sự đổi điều kiện truy vấn (chỉ service có doctor tại clinic)', async () => {
    const findMany = jest.fn(async () => []);
    const svc = new AiBridgeService({ service: { findMany } } as any, {} as any);
    await svc.searchServices('mắt');
    await svc.searchServices('mắt', 3);
    const [noClinic, withClinic] = findMany.mock.calls.map((c: any) => c[0].where);
    expect(noClinic.doctorService).toBeUndefined();
    expect(withClinic.doctorService).toEqual({ some: { doctor: { clinicId: 3, deletedAt: null } } });
  });
});

describe('CreateBookingDraftSchema', () => {
  const base = { patientProfileId: 1, doctorId: 2, serviceId: 3, idempotencyKey: 'k' };
  it('chấp nhận ISO có timezone', () => {
    expect(CreateBookingDraftSchema.safeParse({ ...base, startTime: '2030-01-01T09:00:00+07:00' }).success).toBe(true);
    expect(CreateBookingDraftSchema.safeParse({ ...base, startTime: '2030-01-01T02:00:00Z' }).success).toBe(true);
  });
  it('từ chối thiếu timezone / sai định dạng / id không dương', () => {
    expect(CreateBookingDraftSchema.safeParse({ ...base, startTime: '2030-01-01T09:00:00' }).success).toBe(false);
    expect(CreateBookingDraftSchema.safeParse({ ...base, startTime: 'ngày mai' }).success).toBe(false);
    expect(CreateBookingDraftSchema.safeParse({ ...base, startTime: '2030-01-01T09:00:00Z', doctorId: 0 }).success).toBe(false);
  });
});

describe('output contract (AI/ <-> Be/)', () => {
  it('draft / confirm / cancel / search_services khớp schema output', async () => {
    const { svc, state } = makeService();
    const d: any = await svc.createBookingDraft(USER, draftInput());
    expect(BookingDraftResponseSchema.parse(d)).toBeDefined();
    expect(BookingDraftResponseSchema.parse(await svc.createBookingDraft(USER, draftInput()))).toBeDefined();

    const c: any = await svc.confirmBooking(USER, d.draft_id, 'c1');
    expect(ConfirmBookingResponseSchema.parse(c)).toEqual(c);

    state.appointments[0].startTime = new Date(Date.now() + 48 * 3600 * 1000);
    const x: any = await svc.cancelAppointment(USER, c.appointment_id);
    expect(CancelAppointmentResponseSchema.parse(x)).toBeDefined();
  });

  it('mọi nhánh lỗi chỉ có error_code ổn định, không message/stack', async () => {
    const { svc, state } = makeService();
    state.doctorServices.length = 0;
    const errs: any[] = [
      await svc.createBookingDraft(USER, draftInput({ patientProfileId: 200 })),
      await svc.createBookingDraft(USER, draftInput()),
      await svc.createBookingDraft(USER, draftInput({ startTime: slotIso(-2) })),
      await svc.confirmBooking(USER, 'nope', 'c1'),
      await svc.cancelAppointment(USER, 999),
    ];
    for (const e of errs) {
      expect(Object.keys(ErrorCodeSchema.parse(e))).toEqual(['error_code']);
      expect(Object.keys(e).filter((k) => k !== 'error_code')).toEqual([]);
    }
  });

  it('search_services output khớp schema', async () => {
    const findMany = jest.fn(async () => [
      { id: 1, name: 'Mắt', price: 100000, duration: 30, specialty: { name: 'Nhãn khoa' } },
    ]);
    const svc = new AiBridgeService({ service: { findMany } } as any, {} as any);
    expect(SearchServicesResponseSchema.parse(await svc.searchServices('mắt', 3)).clinic_id).toBe(3);
  });
});
