import { fakerVI as faker } from '@faker-js/faker';
import {
  AppointmentStatus,
  AppointmentType,
  Gender,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  Relationship,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

class HyperScheduler {
  private occupied = new Map<string, Array<{ s: number; e: number }>>();

  isBusy(id: number, role: 'doc' | 'pat', start: number, end: number): boolean {
    const slots = this.occupied.get(`${role}-${id}`) || [];
    for (let i = slots.length - 1; i >= 0; i--) {
      if (start < slots[i].e && end > slots[i].s) return true;
    }
    return false;
  }

  occupy(doctorId: number, patientId: number, start: number, end: number) {
    const dKey = `doc-${doctorId}`,
      pKey = `pat-${patientId}`;
    if (!this.occupied.has(dKey)) this.occupied.set(dKey, []);
    if (!this.occupied.has(pKey)) this.occupied.set(pKey, []);
    this.occupied.get(dKey)!.push({ s: start, e: end });
    this.occupied.get(pKey)!.push({ s: start, e: end });
  }
}

const DEFAULT_PASSWORD = 'password123';
const TODAY = new Date('2026-01-06T14:07:12+07:00');
const SEED_RANGE = {
  start: new Date('2025-01-01T00:00:00'),
  end: new Date('2026-01-31T23:59:59'),
};

const specialtiesData = [
  'Nội & Nam khoa',
  'Nhi khoa',
  'Tai Mũi Họng',
  'Da liễu & Thẩm mỹ',
  'Sản Phụ khoa',
  'Nhãn khoa',
  'Răng Hàm Mặt',
  'Tiêu hóa & Nội soi',
  'Vật lý trị liệu & PHCN',
  'Tâm lý & Dinh dưỡng',
  'Gói khám sức khỏe tổng quát',
  'Chẩn đoán & Ngoại khoa',
];

async function main() {
  const scheduler = new HyperScheduler();
  const pass = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  console.log('--- MEGA FINAL RESET ---');
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Clinic", "Specialty", "Service", "DoctorProfile", "PatientProfile", "Appointment", "DoctorAvailability", "Billing", "Feedback", "AppointmentResult", "Question", "Answer", "Tag", "QuestionTag", "Medicine", "Promotion", "UserPromotion", "Transaction", "Prescription", "PrescriptionItem" RESTART IDENTITY CASCADE;`;

  // 1. Clinics
  const clinics = await Promise.all(
    ['Hoàn Kiếm', 'Cầu Giấy', 'Đống Đa', 'Ba Đình', 'Hà Đông'].map((n) =>
      prisma.clinic.create({
        data: {
          name: `Sepolia ${n}`,
          address: `Hà Nội - ${n}`,
          phone: '024',
          email: faker.internet.email(),
          isActive: true,
        },
      }),
    ),
  );

  // 2. Specialties
  const specs = await Promise.all(
    specialtiesData.map((name) => prisma.specialty.create({ data: { name } })),
  );

  // 3. Services (99)
  const svcsData: any[] = [];
  const actionTerms = [
    'Khám và tư vấn',
    'Điều trị chuyên sâu',
    'Tầm soát định kỳ',
    'Xét nghiệm tổng quát',
    'Chẩn đoán hình ảnh',
    'Theo dõi định kỳ',
    'Khám sức khỏe',
    'Tư vấn từ xa',
  ];

  for (let i = 0; i < 99; i++) {
    const sIdx = Math.floor(i / 8.5) % specs.length;
    const term = actionTerms[i % actionTerms.length];
    svcsData.push({
      name: `${term} ${specialtiesData[sIdx]}`,
      price: 200000 + (i % 10) * 100000,
      duration: [30, 45, 60, 90][i % 4],
      specialtyId: specs[sIdx].id,
      isAvailableOnline: i % 3 !== 0,
      isAvailableOffline: true,
      targetGender:
        i % 15 === 0 ? Gender.MALE : i % 15 === 1 ? Gender.FEMALE : null,
    });
  }
  await prisma.service.createMany({ data: svcsData });
  const svcs = await prisma.service.findMany();
  const servicePriceMap = new Map<number, number>();
  svcs.forEach((s) => servicePriceMap.set(s.id, s.price));

  // 4. Users (All together to avoid P2002)
  console.log('Bulk creating all Users...');
  const allUsersData: any[] = [];
  // - Doctors (120)
  for (let i = 1; i <= 120; i++) {
    allUsersData.push({
      email: `doctor${i}@sepolia.vn`,
      password: pass,
      role: 'DOCTOR',
      status: 'ACTIVE',
    });
  }
  // - Patients (5000)
  for (let i = 1; i <= 5000; i++) {
    allUsersData.push({
      email: `user${i}@sepolia.vn`,
      password: pass,
      role: 'PATIENT',
      status: 'ACTIVE',
    });
  }
  // - Admin (1)
  allUsersData.push({
    email: 'admin@sepolia.vn',
    password: pass,
    role: 'ADMIN',
    status: 'ACTIVE',
  });
  // - Receptionists (5)
  const clinicNames = [
    'Hoàn Kiếm',
    'Cầu Giấy',
    'Đống Đa',
    'Ba Đình',
    'Hà Đông',
  ];
  for (let i = 0; i < 5; i++) {
    allUsersData.push({
      email: `receptionist${i + 1}@sepolia.vn`,
      password: pass,
      role: 'RECEPTIONIST',
      status: 'ACTIVE',
    });
  }
  await prisma.user.createMany({ data: allUsersData });

  const dbUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  const dbDocUsers = dbUsers.filter((u) => u.role === 'DOCTOR');
  const dbPatientUsers = dbUsers.filter((u) => u.role === 'PATIENT');
  const dbAdminUser = dbUsers.find((u) => u.role === 'ADMIN')!;
  const dbReceptionistUsers = dbUsers.filter((u) => u.role === 'RECEPTIONIST');

  // 4a. Admin Profile
  await prisma.adminProfile.create({
    data: {
      userId: dbAdminUser.id,
      firstName: 'Admin',
      lastName: 'Sepolia',
      gender: Gender.MALE,
    },
  });

  // 4b. Receptionist Profiles
  for (let i = 0; i < 5; i++) {
    await prisma.receptionistProfile.create({
      data: {
        userId: dbReceptionistUsers[i].id,
        firstName: clinicNames[i],
        lastName: 'Sepolia',
        clinicId: clinics[i].id,
        gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
      },
    });
  }

  // 5. Doctors Profiles
  console.log('Creating Doctor Profiles...');
  const docProfilesData: any[] = [];
  for (let i = 0; i < dbDocUsers.length; i++) {
    docProfilesData.push({
      userId: dbDocUsers[i].id,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      clinicId: clinics[i % 5].id,
      gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      avatar: faker.image.avatar(),
      experience: `${faker.number.int({ min: 2, max: 30 })} năm kinh nghiệm trong ngành y tế.`,
      contactInfo: faker.phone.number(),
    });
  }
  await prisma.doctorProfile.createMany({ data: docProfilesData });
  const doctors = await prisma.doctorProfile.findMany();

  // Assign Specialties & Services
  const docSpecs: any[] = [];
  const docSvcs: any[] = [];
  const docAvails: any[] = [];
  for (let i = 0; i < doctors.length; i++) {
    const spec = specs[i % specs.length];
    docSpecs.push({ doctorId: doctors[i].id, specialtyId: spec.id });
    const mySvcs = svcs.filter((s) => s.specialtyId === spec.id);
    for (const s of mySvcs)
      docSvcs.push({ doctorId: doctors[i].id, serviceId: s.id });
    for (let d = 1; d <= 6; d++)
      docAvails.push({
        doctorId: doctors[i].id,
        dayOfWeek: d,
        startTime: '08:00',
        endTime: '17:30',
      });
  }
  await prisma.doctorSpecialty.createMany({ data: docSpecs });
  await prisma.doctorService.createMany({ data: docSvcs });
  await prisma.doctorAvailability.createMany({ data: docAvails });

  // 6. Patient Profiles
  console.log('Creating Patient Profiles...');
  const pProfilesData: any[] = [];
  for (const user of dbPatientUsers) {
    const n = faker.number.int({ min: 1, max: 4 });
    for (let j = 0; j < n; j++) {
      pProfilesData.push({
        managerId: user.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        relationship:
          j === 0
            ? Relationship.SELF
            : faker.helpers.arrayElement(Object.values(Relationship)),
        gender: faker.helpers.arrayElement(Object.values(Gender)),
        phone: '03' + faker.string.numeric(8),
        dateOfBirth: faker.date.birthdate({ min: 1, max: 80, mode: 'age' }),
        avatar: faker.image.avatar(),
        address: faker.location.streetAddress() + ', ' + faker.location.city(),
        occupation: faker.person.jobTitle(),
        nationality: 'Việt Nam',
        idCardNumber: faker.string.numeric(12),
      });
    }
  }
  await prisma.patientProfile.createMany({ data: pProfilesData });
  const allProfiles = await prisma.patientProfile.findMany({
    select: { id: true },
  });

  // 7. APPOINTMENTS (500k to reach 2026)
  console.log('Generating Appointments until Jan 2026...');
  let total = 0;
  const LIMIT = 400000;
  const BATCH = 10000;
  let cache: any[] = [];
  const date = new Date(SEED_RANGE.start);

  while (date <= SEED_RANGE.end && total < LIMIT) {
    for (const doc of doctors) {
      if (total >= LIMIT) break;
      const hours = [8, 9, 10, 11, 14, 15, 16, 17];
      for (const h of hours) {
        if (faker.datatype.boolean(0.85)) {
          const pat = faker.helpers.arrayElement(allProfiles);
          const start = new Date(date);
          start.setHours(h, faker.helpers.arrayElement([0, 30]), 0, 0);
          const end = new Date(start.getTime() + 30 * 60000);

          if (
            !scheduler.isBusy(doc.id, 'doc', start.getTime(), end.getTime()) &&
            !scheduler.isBusy(pat.id, 'pat', start.getTime(), end.getTime())
          ) {
            let status: AppointmentStatus =
              end < TODAY
                ? AppointmentStatus.COMPLETED
                : AppointmentStatus.UPCOMING;

            // Randomly cancel ~5% of appointments
            if (faker.datatype.boolean(0.05)) {
              status = AppointmentStatus.CANCELLED;
            }

            scheduler.occupy(doc.id, pat.id, start.getTime(), end.getTime());
            cache.push({
              startTime: start,
              endTime: end,
              status,
              doctorId: doc.id,
              patientProfileId: pat.id,
              clinicId: doc.clinicId,
              serviceId: faker.helpers.arrayElement(svcs).id,
              type:
                total % 5 === 0
                  ? AppointmentType.ONLINE
                  : AppointmentType.OFFLINE,
            });

            if (cache.length >= BATCH) {
              await prisma.appointment.createMany({ data: cache });

              const billingCache = cache.map((appt, index) => ({
                appointmentId: total + index + 1,
                amount: servicePriceMap.get(appt.serviceId) || 500000,
                status:
                  appt.status === AppointmentStatus.COMPLETED
                    ? PaymentStatus.PAID
                    : PaymentStatus.PENDING,
                paymentMethod:
                  appt.status === AppointmentStatus.COMPLETED
                    ? PaymentMethod.ONLINE
                    : null,
              }));

              await prisma.billing.createMany({ data: billingCache });

              total += cache.length;
              console.log(`...Seeded ${total} appointments and billings`);
              cache = [];
            }
          }
        }
      }
    }
    date.setDate(date.getDate() + 1);
  }
  if (cache.length > 0) {
    await prisma.appointment.createMany({ data: cache });

    const billingCache = cache.map((appt, index) => ({
      appointmentId: total + index + 1,
      amount: servicePriceMap.get(appt.serviceId) || 500000,
      status:
        appt.status === AppointmentStatus.COMPLETED
          ? PaymentStatus.PAID
          : PaymentStatus.PENDING,
      paymentMethod:
        appt.status === AppointmentStatus.COMPLETED
          ? PaymentMethod.ONLINE
          : null,
    }));

    await prisma.billing.createMany({ data: billingCache });

    total += cache.length;
  }

  console.log(`✅ APPOINTMENTS SEEDED. Total: ${total}`);

  // 8. Tags & Community Questions
  console.log('Seeding Tags and Community Questions...');
  const tagsData = [
    { name: 'Sức khỏe nhi', slug: 'suc-khoe-nhi' },
    { name: 'Tim mạch', slug: 'tim-mach' },
    { name: 'Dinh dưỡng', slug: 'dinh-duong' },
    { name: 'Da liễu', slug: 'da-lieu' },
    { name: 'Cơ xương khớp', slug: 'co-xuong-khop' },
    { name: 'Tâm lý', slug: 'tam-ly' },
    { name: 'Sản khoa', slug: 'san-khoa' },
  ];
  await prisma.tag.createMany({ data: tagsData });
  const dbTags = await prisma.tag.findMany();

  const questionsData: any[] = [];
  for (let i = 0; i < 200; i++) {
    const author = faker.helpers.arrayElement(dbPatientUsers);
    questionsData.push({
      title: faker.lorem.sentence({ min: 5, max: 12 }).replace(/\.$/, '?'),
      content: faker.lorem.paragraphs(2),
      authorId: author.id,
      upvotes: faker.number.int({ min: 0, max: 50 }),
      downvotes: faker.number.int({ min: 0, max: 5 }),
      views: faker.number.int({ min: 10, max: 1000 }),
      createdAt: faker.date.past({ years: 1, refDate: TODAY }),
    });
  }
  await prisma.question.createMany({ data: questionsData });
  const dbQuestions = await prisma.question.findMany();

  const questionTags: any[] = [];
  for (const q of dbQuestions) {
    const numTags = faker.number.int({ min: 1, max: 3 });
    const selectedTags = faker.helpers.arrayElements(dbTags, numTags);
    for (const t of selectedTags) {
      questionTags.push({ questionId: q.id, tagId: t.id });
    }
  }
  await prisma.questionTag.createMany({ data: questionTags });

  // 9. Answers
  const answersData: any[] = [];
  for (const q of dbQuestions) {
    const numAnswers = faker.number.int({ min: 0, max: 5 });
    for (let i = 0; i < numAnswers; i++) {
      const isDoc = faker.datatype.boolean(0.6);
      const author = isDoc
        ? faker.helpers.arrayElement(dbDocUsers)
        : faker.helpers.arrayElement(dbPatientUsers);
      answersData.push({
        content: faker.lorem.paragraph(),
        questionId: q.id,
        authorId: author.id,
        upvotes: faker.number.int({ min: 0, max: 20 }),
        isBestAnswer: i === 0 && faker.datatype.boolean(0.2),
        createdAt: new Date(
          q.createdAt.getTime() +
            faker.number.int({ min: 3600000, max: 86400000 }),
        ),
      });
    }
  }
  await prisma.answer.createMany({ data: answersData });

  console.log(`✅ MEGA SEED SUCCESS.`);

  // 10. Medicines
  console.log('Seeding Medicines...');
  const medicinesData = Array.from({ length: 50 }).map(() => ({
    name: faker.commerce.productName(),
    dosage: faker.helpers.arrayElement(['500mg', '100mg', '10ml', '1 viên']),
    stock: faker.number.int({ min: 10, max: 1000 }),
    price: faker.number.int({ min: 5000, max: 200000 }),
  }));
  await prisma.medicine.createMany({ data: medicinesData });
  const dbMedicines = await prisma.medicine.findMany();

  // 11. Promotions
  console.log('Seeding Promotions...');
  const promotionsData = [
    {
      title: 'Giảm giá 20% cho người mới',
      code: 'WELCOME20',
      discountPercent: 20,
      maxDiscountAmount: 50000,
      validFrom: faker.date.past(),
      validTo: faker.date.future(),
    },
    {
      title: 'Ưu đãi Tết 2026',
      code: 'TET2026',
      discountPercent: 15,
      maxDiscountAmount: 100000,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-02-15'),
    },
  ];
  await prisma.promotion.createMany({ data: promotionsData });
  const dbPromotions = await prisma.promotion.findMany();

  for (const p of dbPromotions) {
    await prisma.promotionDisplay.create({
      data: {
        promotionId: p.id,
        isActive: true,
        backgroundColor: JSON.stringify(['#1E3A5F', '#2C5282']),
        textColor: '#FFFFFF',
        buttonColor: '#38B2AC',
        buttonTextColor: '#FFFFFF',
        buttonText: 'Nhận ngay',
        iconName: 'gift-outline',
      },
    });
  }

  console.log('--- ALL SYSTEMS GREEN ---');

  // 12. Results and Feedbacks for Completed Appointments
  console.log('Seeding Results and Feedbacks for Completed Appointments...');
  const completedAppts = await prisma.appointment.findMany({
    where: { status: AppointmentStatus.COMPLETED },
    select: { id: true, doctorId: true, startTime: true },
  });

  console.log(
    `Found ${completedAppts.length} completed appointments to process...`,
  );

  const apptResultsCache: any[] = [];
  const feedbacksCache: any[] = [];

  const diagnosisSamples = [
    'Viêm họng cấp tính',
    'Viêm xoang mãn tính',
    'Rối loạn tiêu hóa nhẹ',
    'Sốt siêu vi',
    'Viêm da cơ địa',
    'Đau thắt lưng do vận động',
    'Suy nhược cơ thể',
    'Viêm kết mạc - đau mắt đỏ',
    'Viêm phế quản cấp',
    'Viêm dạ dày cấp tính',
  ];

  const feedbackSamples = [
    'Bác sĩ tư vấn rất tận tâm và nhẹ nhàng.',
    'Phòng khám sạch sẽ, nhân viên hỗ trợ nhiệt tình.',
    'Bác sĩ giải thích tình trạng bệnh rất rõ ràng.',
    'Quy trình nhanh gọn, bác sĩ giỏi.',
    'Dịch vụ tốt, bác sĩ chuyên môn cao.',
    'Hơi đông nên phải chờ một chút nhưng bác sĩ rất chu đáo.',
    'Rất hài lòng với dịch vụ tại đây.',
    'Bác sĩ nhiệt tình, trang thiết bị hiện đại.',
  ];

  for (let i = 0; i < completedAppts.length; i++) {
    const appt = completedAppts[i];

    // 95% chance of having a result
    if (faker.datatype.boolean(0.95)) {
      apptResultsCache.push({
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        diagnosis: faker.helpers.arrayElement(diagnosisSamples),
        notes: faker.lorem.paragraph(),
        recommendations:
          'Uống nhiều nước, nghỉ ngơi đầy đủ và tái khám sau 7 ngày nếu không thuyên giảm.',
        prescription: 'Paracetamol 500mg (20 viên), Vitamin C 500mg (10 viên).',
        createdAt: appt.startTime,
        updatedAt: appt.startTime,
      });
    }

    // 80% chance of having feedback
    if (faker.datatype.boolean(0.8)) {
      feedbacksCache.push({
        appointmentId: appt.id,
        rating: faker.number.int({ min: 4, max: 5 }),
        comment: faker.helpers.arrayElement(feedbackSamples),
        createdAt: new Date(appt.startTime.getTime() + 4 * 3600000), // 4 hours after
      });
    }

    if (apptResultsCache.length >= 10000) {
      await prisma.appointmentResult.createMany({
        data: apptResultsCache,
        skipDuplicates: true,
      });
      apptResultsCache.length = 0;
      console.log(`...Seeded ${i + 1} results`);
    }

    if (feedbacksCache.length >= 10000) {
      await prisma.feedback.createMany({
        data: feedbacksCache,
        skipDuplicates: true,
      });
      feedbacksCache.length = 0;
    }
  }

  if (apptResultsCache.length > 0)
    await prisma.appointmentResult.createMany({
      data: apptResultsCache,
      skipDuplicates: true,
    });
  if (feedbacksCache.length > 0)
    await prisma.feedback.createMany({
      data: feedbacksCache,
      skipDuplicates: true,
    });

  console.log('✅ RESULTS AND FEEDBACKS SEEDED.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
