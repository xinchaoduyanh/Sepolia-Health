/**
 * Test đồng thời THẬT trên Postgres (không mock). Chạy thủ công:
 *   AI_BRIDGE_DB_TESTS=1 npx jest --testRegex '.*\.db-spec\.ts$' src/module/ai-bridge
 * Cần DATABASE_URL trỏ DB test có seed (doctor 1 + service 1 + availability T2–T6,
 * patient profile 1 của user 121, profile 2 của user 122) và constraint
 * Appointment_doctor_active_no_overlap. Dọn sạch mọi bản ghi tạo ra.
 */
import { PrismaService } from '@/common/prisma/prisma.service';
import { AiBridgeService } from './ai-bridge.service';

const enabled = process.env.AI_BRIDGE_DB_TESTS === '1';
const d = enabled ? describe : describe.skip;

const DOCTOR = 1;
const SERVICE = 1;
const USER_A = 121;
const PROFILE_A = 1;
const USER_B = 122;
const PROFILE_B = 2;

/** Thứ 4 đầu tiên của năm 2035, 09:00 giờ VN — xa tương lai, không đụng dữ liệu thật. */
function farWednesday(): string {
  const d0 = new Date(Date.UTC(2035, 0, 1));
  while (d0.getUTCDay() !== 3) d0.setUTCDate(d0.getUTCDate() + 1);
  return `${d0.toISOString().slice(0, 10)}T09:00:00+07:00`;
}

d('AiBridgeService concurrency (real Postgres)', () => {
  jest.setTimeout(60000);
  const prisma = new PrismaService();
  const notif: any = new Proxy({}, { get: () => jest.fn(async () => undefined) });
  const svc = new AiBridgeService(prisma, notif);
  const tag = `dbtest-${Date.now()}`;
  const start = new Date(farWednesday());

  const cleanup = async () => {
    const drafts = await prisma.bookingDraft.findMany({
      where: { idempotencyKey: { startsWith: tag } },
      select: { id: true },
    });
    const appts = await prisma.appointment.findMany({
      where: { doctorId: DOCTOR, startTime: start },
      select: { id: true },
    });
    const ids = appts.map((a) => a.id);
    await prisma.bookingDraft.deleteMany({ where: { id: { in: drafts.map((x) => x.id) } } });
    await prisma.billing.deleteMany({ where: { appointmentId: { in: ids } } });
    await prisma.appointment.deleteMany({ where: { id: { in: ids } } });
  };

  beforeAll(async () => {
    await prisma.$connect();
    await cleanup();
  });
  afterEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  const mk = async (user: number, profile: number, key: string) => {
    const r: any = await svc.createBookingDraft(user, {
      patientProfileId: profile,
      doctorId: DOCTOR,
      serviceId: SERVICE,
      startTime: farWednesday(),
      idempotencyKey: `${tag}-${key}`,
    });
    expect(r.error_code).toBeUndefined();
    return r.draft_id as string;
  };

  it('confirm đồng thời cùng draft → đúng một appointment, cùng id', async () => {
    const id = await mk(USER_A, PROFILE_A, 'same');
    const results: any[] = await Promise.all(
      Array.from({ length: 5 }, () => svc.confirmBooking(USER_A, id, `${tag}-c`)),
    );
    expect(results.every((r) => r.status === 'booked')).toBe(true);
    expect(new Set(results.map((r) => r.appointment_id)).size).toBe(1);
    expect(await prisma.appointment.count({ where: { doctorId: DOCTOR, startTime: start } })).toBe(1);
  });

  it('hai draft khác user cùng bác sĩ/giờ confirm đồng thời → đúng một booked', async () => {
    const a = await mk(USER_A, PROFILE_A, 'a');
    const b = await mk(USER_B, PROFILE_B, 'b');
    const results: any[] = await Promise.all([
      svc.confirmBooking(USER_A, a, `${tag}-ca`),
      svc.confirmBooking(USER_B, b, `${tag}-cb`),
    ]);
    expect(results.filter((r) => r.status === 'booked')).toHaveLength(1);
    expect(results.filter((r) => r.error_code === 'slot_taken')).toHaveLength(1);
    expect(await prisma.appointment.count({ where: { doctorId: DOCTOR, startTime: start } })).toBe(1);
  });
});
