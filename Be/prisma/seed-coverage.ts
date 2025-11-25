import {
  PrismaClient,
  UserStatus,
  AppointmentStatus,
  AppTermsType,
} from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- CẤU HÌNH ---
const NUMBER_OF_CLINICS = 5; // ID từ 1 đến 5
const DEFAULT_PASSWORD = 'password123';

// Cấu hình dữ liệu mới
const NUMBER_OF_PATIENT_USERS = 800; // 800 user bệnh nhân
const NUMBER_OF_ADMIN = 5; // 5 admin
const NUMBER_OF_RECEPTIONISTS = 10; // 10 lễ tân
const MIN_DOCTORS_PER_SPECIALTY_PER_CLINIC = 3; // Ít nhất 3 bác sĩ cho mỗi chuyên khoa tại mỗi clinic
const MAX_DOCTORS_PER_SPECIALTY_PER_CLINIC = 5; // Tối đa 5 bác sĩ

// Thời gian appointment: 01/01/2024 - 31/12/2025
const APPOINTMENT_START_DATE = new Date('2024-01-01');
const APPOINTMENT_END_DATE = new Date('2025-12-31');

// Community posts
const NUMBER_OF_POSTS = 20; // 20 bài viết cộng đồng
// -----------------

// Dữ liệu 4 chuyên khoa được giữ lại
const specialties = [
  {
    name: 'Mắt',
    description: 'Chuyên khoa về các bệnh lý mắt và phẫu thuật mắt',
  },
  {
    name: 'Tai - Mũi - Họng',
    description: 'Chuyên khoa về tai, mũi và họng',
  },
  {
    name: 'Sản phụ khoa',
    description: 'Chuyên khoa về sản phụ khoa và chăm sóc sức khỏe phụ nữ',
  },
  {
    name: 'Tiêm chủng',
    description: 'Chuyên khoa về tiêm chủng và phòng ngừa bệnh tật',
  },
];

// Dữ liệu dịch vụ - Mỗi chuyên khoa có 4-5 dịch vụ
const servicesData = [
  // Mắt (4 dịch vụ)
  {
    name: 'Khám mắt tổng quát',
    description:
      'Khám và tầm soát các bệnh lý về mắt, đo thị lực, kiểm tra khúc xạ',
    price: 200000,
    duration: 30,
    specialtyIndex: 0,
  },
  {
    name: 'Điều trị tật khúc xạ',
    description: 'Điều trị cận thị, viễn thị, loạn thị, lão thị',
    price: 300000,
    duration: 45,
    specialtyIndex: 0,
  },
  {
    name: 'Phẫu thuật mắt',
    description: 'Phẫu thuật đục thủy tinh thể, glaucoma, võng mạc',
    price: 5000000,
    duration: 90,
    specialtyIndex: 0,
  },
  {
    name: 'Điều trị bệnh võng mạc',
    description:
      'Điều trị thoái hóa hoàng điểm, bệnh lý võng mạc do tiểu đường',
    price: 800000,
    duration: 60,
    specialtyIndex: 0,
  },

  // Tai - Mũi - Họng (5 dịch vụ)
  {
    name: 'Khám Tai - Mũi - Họng tổng quát',
    description: 'Khám và điều trị các bệnh lý về tai, mũi, họng',
    price: 250000,
    duration: 30,
    specialtyIndex: 1,
  },
  {
    name: 'Điều trị viêm xoang',
    description: 'Điều trị viêm xoang cấp và mãn tính',
    price: 350000,
    duration: 45,
    specialtyIndex: 1,
  },
  {
    name: 'Điều trị viêm amidan',
    description: 'Điều trị viêm amidan, phẫu thuật cắt amidan',
    price: 400000,
    duration: 60,
    specialtyIndex: 1,
  },
  {
    name: 'Điều trị viêm tai giữa',
    description: 'Điều trị viêm tai giữa cấp và mãn tính',
    price: 300000,
    duration: 45,
    specialtyIndex: 1,
  },
  {
    name: 'Nội soi tai mũi họng',
    description: 'Nội soi chẩn đoán và điều trị các bệnh lý tai mũi họng',
    price: 500000,
    duration: 60,
    specialtyIndex: 1,
  },

  // Sản phụ khoa (5 dịch vụ)
  {
    name: 'Khám sản phụ khoa tổng quát',
    description: 'Khám và tầm soát các bệnh lý phụ khoa',
    price: 300000,
    duration: 30,
    specialtyIndex: 2,
  },
  {
    name: 'Khám thai định kỳ',
    description: 'Khám thai, siêu âm thai, theo dõi sức khỏe mẹ và bé',
    price: 350000,
    duration: 45,
    specialtyIndex: 2,
  },
  {
    name: 'Tầm soát ung thư cổ tử cung',
    description: 'Xét nghiệm PAP, HPV test, soi cổ tử cung',
    price: 500000,
    duration: 60,
    specialtyIndex: 2,
  },
  {
    name: 'Tư vấn kế hoạch hóa gia đình',
    description: 'Tư vấn các biện pháp tránh thai, đặt vòng, cấy que',
    price: 250000,
    duration: 30,
    specialtyIndex: 2,
  },
  {
    name: 'Điều trị vô sinh',
    description: 'Khám và điều trị vô sinh nam nữ, hỗ trợ sinh sản',
    price: 800000,
    duration: 60,
    specialtyIndex: 2,
  },

  // Tiêm chủng (4 dịch vụ)
  {
    name: 'Tiêm chủng trẻ em',
    description:
      'Tiêm các loại vắc xin trong chương trình tiêm chủng mở rộng cho trẻ em',
    price: 150000,
    duration: 20,
    specialtyIndex: 3,
  },
  {
    name: 'Tiêm chủng người lớn',
    description: 'Tiêm phòng cúm, viêm gan, HPV, COVID-19 cho người lớn',
    price: 200000,
    duration: 20,
    specialtyIndex: 3,
  },
  {
    name: 'Tiêm phòng dại',
    description: 'Tiêm phòng bệnh dại sau khi bị động vật cắn',
    price: 300000,
    duration: 30,
    specialtyIndex: 3,
  },
  {
    name: 'Tiêm phòng du lịch',
    description: 'Tiêm các loại vắc xin cần thiết khi đi du lịch nước ngoài',
    price: 250000,
    duration: 30,
    specialtyIndex: 3,
  },
];

// Dữ liệu phòng khám
const clinics = [
  {
    name: 'Sepolia Healthcare Hoàn Kiếm',
    address: '22 P. Lý Thường Kiệt, Phan Chu Trinh, Hoàn Kiếm, Hà Nội',
    phone: '02439748888',
    email: 'hoankiem@sepoliahealthcare.vn',
    description:
      'Cơ sở trung tâm tại quận Hoàn Kiếm, chuyên cung cấp dịch vụ khám đa khoa và sàng lọc sức khỏe cao cấp.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Cầu Giấy',
    address:
      'Tầng 2, Tòa nhà Discovery Complex, 302 P. Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
    phone: '02438398686',
    email: 'caugiay@sepoliahealthcare.vn',
    description:
      'Phòng khám hiện đại tại Cầu Giấy, tập trung vào các chuyên khoa Tai - Mũi - Họng.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Đống Đa',
    address: '180 P. Xã Đàn, Phương Liên, Đống Đa, Hà Nội',
    phone: '02435729999',
    email: 'dongda@sepoliahealthcare.vn',
    description:
      'Chuyên khoa Sản phụ khoa, cung cấp dịch vụ chăm sóc toàn diện cho mẹ và bé tại khu vực Đống Đa.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Ba Đình',
    address: '5 P. Đội Cấn, Đội Cấn, Ba Đình, Hà Nội',
    phone: '02437228686',
    email: 'badinh@sepoliahealthcare.vn',
    description:
      'Cơ sở chuyên về Mắt, với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị tiên tiến.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Hà Đông',
    address:
      'Tầng 1, Tòa nhà Hồ Gươm Plaza, 102 P. Trần Phú, Mộ Lao, Hà Đông, Hà Nội',
    phone: '02439968989',
    email: 'hadong@sepoliahealthcare.vn',
    description:
      'Cung cấp dịch vụ y tế đa dạng cho khu vực Hà Đông, bao gồm các gói tiêm chủng.',
    isActive: true,
  },
];

// Các ca làm việc mẫu
const workShifts = [
  { name: 'Sáng', startTime: '08:00', endTime: '12:00' },
  { name: 'Chiều', startTime: '13:30', endTime: '17:30' },
];

// Thứ trong tuần: 1 = Monday, 2 = Tuesday, ..., 6 = Saturday (không bao gồm Sunday = 0)
const daysOfWeek = [1, 2, 3, 4, 5, 6];

// Gender options
const genders = ['MALE', 'FEMALE'] as const;

// Tags cho Q&A
const tagsData = [
  {
    name: 'Sức khỏe tổng quát',
    slug: 'suc-khoe-tong-quat',
    description: 'Câu hỏi về sức khỏe tổng quát',
  },
  {
    name: 'Bệnh mắt',
    slug: 'benh-mat',
    description: 'Câu hỏi về các bệnh lý mắt',
  },
  {
    name: 'Tai mũi họng',
    slug: 'tai-mui-hong',
    description: 'Câu hỏi về bệnh tai mũi họng',
  },
  {
    name: 'Sản phụ khoa',
    slug: 'san-phu-khoa',
    description: 'Câu hỏi về sản phụ khoa',
  },
  {
    name: 'Tiêm chủng',
    slug: 'tiem-chung',
    description: 'Câu hỏi về tiêm chủng',
  },
  {
    name: 'Dinh dưỡng',
    slug: 'dinh-duong',
    description: 'Câu hỏi về dinh dưỡng',
  },
  {
    name: 'Thuốc men',
    slug: 'thuoc-men',
    description: 'Câu hỏi về thuốc và điều trị',
  },
  {
    name: 'Chăm sóc trẻ em',
    slug: 'cham-soc-tre-em',
    description: 'Câu hỏi về chăm sóc trẻ em',
  },
];

// FAQ data
const faqsData = [
  {
    type: AppTermsType.APP_FAQ,
    title: 'Làm thế nào để đặt lịch khám bệnh?',
    content:
      'Bạn có thể đặt lịch khám bệnh bằng cách vào mục "Đặt lịch", chọn chuyên khoa, bác sĩ và thời gian phù hợp. Sau đó xác nhận và thanh toán để hoàn tất.',
  },
  {
    type: AppTermsType.APP_FAQ,
    title: 'Tôi có thể hủy lịch hẹn không?',
    content:
      'Có, bạn có thể hủy lịch hẹn trong mục "Lịch hẹn của tôi". Lưu ý rằng việc hủy cần được thực hiện trước 24 giờ để được hoàn tiền.',
  },
  {
    type: AppTermsType.APP_FAQ,
    title: 'Làm thế nào để thêm hồ sơ bệnh nhân?',
    content:
      'Vào mục "Hồ sơ", chọn "Thêm hồ sơ bệnh nhân" và điền đầy đủ thông tin cần thiết. Bạn có thể thêm hồ sơ cho người thân để dễ dàng đặt lịch cho họ.',
  },
  {
    type: AppTermsType.APP_FAQ,
    title: 'Tôi có thể xem kết quả khám bệnh ở đâu?',
    content:
      'Kết quả khám bệnh sẽ được cập nhật trong mục "Lịch hẹn của tôi". Sau khi bác sĩ hoàn thành khám, bạn có thể xem chi tiết kết quả và đơn thuốc.',
  },
];

async function main() {
  console.log('--- BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU ---');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ---- BƯỚC 1: XÓA DỮ LIỆU CŨ ----
  console.log('\n--- Bước 1: Xóa dữ liệu cũ...');
  await prisma.answerVote.deleteMany({});
  await prisma.questionVote.deleteMany({});
  await prisma.questionTag.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.appTerms.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.billing.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.doctorService.deleteMany({});
  await prisma.doctorSpecialty.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.receptionistProfile.deleteMany({});
  await prisma.adminProfile.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.clinic.deleteMany({});
  console.log('✅ Đã xóa dữ liệu cũ');

  // ---- BƯỚC 2: TẠO PHÒNG KHÁM ----
  console.log('\n--- Bước 2: Tạo phòng khám...');
  await prisma.clinic.createMany({
    data: clinics,
  });
  console.log(`✅ Đã tạo ${clinics.length} phòng khám`);

  // ---- BƯỚC 3: TẠO CHUYÊN KHOA ----
  console.log('\n--- Bước 3: Tạo chuyên khoa...');
  await prisma.specialty.createMany({
    data: specialties,
  });
  console.log(`✅ Đã tạo ${specialties.length} chuyên khoa`);

  // Get specialty IDs
  const specialtyRecords = await prisma.specialty.findMany({
    orderBy: { id: 'asc' },
  });

  // ---- BƯỚC 4: TẠO DỊCH VỤ ----
  console.log('\n--- Bước 4: Tạo dịch vụ...');
  const servicesWithSpecialty = servicesData.map((service) => {
    const specialtyId = specialtyRecords[service.specialtyIndex].id;
    return {
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      specialtyId,
    };
  });

  await prisma.service.createMany({
    data: servicesWithSpecialty,
  });
  console.log(`✅ Đã tạo ${servicesData.length} dịch vụ`);

  // Get all services
  const serviceRecords = await prisma.service.findMany({
    orderBy: { id: 'asc' },
    include: { specialty: true },
  });

  // ---- BƯỚC 5: TẠO BÁC SĨ ----
  console.log('\n--- Bước 5: Tạo bác sĩ...');
  console.log('Mỗi chuyên khoa tại mỗi clinic có 3-5 bác sĩ');

  let doctorCount = 0;
  const allDoctors: any[] = [];

  // Tạo bác sĩ cho mỗi chuyên khoa tại mỗi clinic
  for (let clinicId = 1; clinicId <= NUMBER_OF_CLINICS; clinicId++) {
    for (const specialty of specialtyRecords) {
      const numDoctors = faker.number.int({
        min: MIN_DOCTORS_PER_SPECIALTY_PER_CLINIC,
        max: MAX_DOCTORS_PER_SPECIALTY_PER_CLINIC,
      });

      console.log(
        `\n--> Tạo ${numDoctors} bác sĩ cho [${specialty.name}] tại [Clinic #${clinicId}]`,
      );

      for (let i = 0; i < numDoctors; i++) {
        doctorCount++;
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = `doctor${doctorCount}@sepolia.vn`;
        const phone = faker.helpers.fromRegExp(/0[3-9][0-9]{8}/);

        // Tạo user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            phone,
            role: 'DOCTOR',
            status: UserStatus.ACTIVE,
          },
        });

        // Tạo doctor profile
        const gender = faker.helpers.arrayElement(genders);
        const dateOfBirth = faker.date.birthdate({
          min: 30,
          max: 60,
          mode: 'age',
        });
        const experienceYear = faker.number.int({ min: 2005, max: 2020 });

        const doctorProfile = await prisma.doctorProfile.create({
          data: {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            experience: experienceYear.toString(),
            contactInfo: phone,
            avatar: faker.image.avatar(),
            userId: user.id,
            clinicId,
          },
        });

        allDoctors.push(doctorProfile);

        // Gán chuyên khoa cho bác sĩ (CHỈ 1 chuyên khoa)
        await prisma.doctorSpecialty.create({
          data: {
            doctorId: doctorProfile.id,
            specialtyId: specialty.id,
          },
        });

        // Gán TẤT CẢ dịch vụ của chuyên khoa đó cho bác sĩ
        const specialtyServices = serviceRecords.filter(
          (s) => s.specialtyId === specialty.id,
        );

        await prisma.doctorService.createMany({
          data: specialtyServices.map((s) => ({
            doctorId: doctorProfile.id,
            serviceId: s.id,
          })),
        });

        // Tạo lịch làm việc (Ít nhất 5 ngày/tuần)
        const workDaysCount = faker.number.int({ min: 5, max: 6 });
        const workDays = faker.helpers
          .shuffle(daysOfWeek)
          .slice(0, workDaysCount);

        const availabilityData = workDays.map((day) => {
          const shift = faker.helpers.arrayElement(workShifts);
          return {
            doctorId: doctorProfile.id,
            dayOfWeek: day,
            startTime: shift.startTime,
            endTime: shift.endTime,
          };
        });

        await prisma.doctorAvailability.createMany({
          data: availabilityData,
        });

        console.log(
          `   [${doctorCount}] Đã tạo: Dr. ${lastName} ${firstName} (${email})`,
        );
      }
    }
  }
  console.log(`✅ Đã tạo ${doctorCount} bác sĩ`);

  // ---- BƯỚC 6: TẠO ADMIN ----
  console.log('\n--- Bước 6: Tạo Admin...');
  for (let i = 1; i <= NUMBER_OF_ADMIN; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `admin${i}@sepolia.vn`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone: faker.helpers.fromRegExp(/0[3-9][0-9]{8}/),
        role: 'ADMIN',
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        avatar: faker.image.avatar(),
      },
    });

    console.log(`   [${i}] Đã tạo Admin: ${lastName} ${firstName} (${email})`);
  }
  console.log(`✅ Đã tạo ${NUMBER_OF_ADMIN} admin`);

  // ---- BƯỚC 7: TẠO LỄ TÂN ----
  console.log('\n--- Bước 7: Tạo Lễ tân...');
  for (let i = 1; i <= NUMBER_OF_RECEPTIONISTS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `receptionist${i}@sepolia.vn`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone: faker.helpers.fromRegExp(/0[3-9][0-9]{8}/),
        role: 'RECEPTIONIST',
        status: UserStatus.ACTIVE,
      },
    });

    // Random gán clinic cho lễ tân
    const clinicId = faker.number.int({ min: 1, max: NUMBER_OF_CLINICS });

    await prisma.receptionistProfile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        avatar: faker.image.avatar(),
        clinicId,
      },
    });

    console.log(
      `   [${i}] Đã tạo Receptionist: ${lastName} ${firstName} (${email})`,
    );
  }
  console.log(`✅ Đã tạo ${NUMBER_OF_RECEPTIONISTS} lễ tân`);

  // ---- BƯỚC 8: TẠO BỆNH NHÂN ----
  console.log('\n--- Bước 8: Tạo Bệnh nhân (800 users)...');
  const createdPatientProfileIds: number[] = [];
  let totalProfilesCreated = 0;

  for (let i = 1; i <= NUMBER_OF_PATIENT_USERS; i++) {
    const managerFirstName = faker.person.firstName();
    const managerLastName = faker.person.lastName();
    const email = `user${i}@sepolia.vn`;
    const phone = faker.helpers.fromRegExp(/0[3-9][0-9]{8}/);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role: 'PATIENT',
        status: UserStatus.ACTIVE,
      },
    });

    // Mỗi user có từ 1-3 patient profiles
    const numProfiles = faker.number.int({ min: 1, max: 3 });

    for (let j = 0; j < numProfiles; j++) {
      let relationship: any;
      let firstName: string;
      let dateOfBirth: Date;

      if (j === 0) {
        // Profile đầu tiên luôn là SELF
        relationship = 'SELF';
        firstName = managerFirstName;
        dateOfBirth = faker.date.birthdate({ min: 18, max: 70, mode: 'age' });
      } else {
        // Các profile khác
        relationship = faker.helpers.arrayElement([
          'CHILD',
          'PARENT',
          'SPOUSE',
          'OTHER',
        ]);
        firstName = faker.person.firstName();

        if (relationship === 'CHILD') {
          dateOfBirth = faker.date.birthdate({ min: 1, max: 17, mode: 'age' });
        } else if (relationship === 'PARENT') {
          dateOfBirth = faker.date.birthdate({ min: 50, max: 80, mode: 'age' });
        } else {
          dateOfBirth = faker.date.birthdate({ min: 18, max: 70, mode: 'age' });
        }
      }

      const profile = await prisma.patientProfile.create({
        data: {
          managerId: user.id,
          firstName,
          lastName: managerLastName,
          dateOfBirth,
          gender: faker.helpers.arrayElement(genders),
          phone: j === 0 ? phone : faker.helpers.fromRegExp(/0[3-9][0-9]{8}/),
          relationship,
          avatar: faker.image.avatar(),
        },
      });

      createdPatientProfileIds.push(profile.id);
      totalProfilesCreated++;
    }

    if (i % 100 === 0) {
      console.log(`   ... đã tạo ${i}/${NUMBER_OF_PATIENT_USERS} users`);
    }
  }
  console.log(
    `✅ Đã tạo ${NUMBER_OF_PATIENT_USERS} user và ${totalProfilesCreated} patient profiles`,
  );

  // ---- BƯỚC 9: TẠO LỊCH HẸN, HÓA ĐƠN, FEEDBACK ----
  console.log('\n--- Bước 9: Tạo Lịch hẹn từ 01/01/2024 - 31/12/2025...');
  const today = new Date();

  let appointmentsCreated = 0;
  let billingsCreated = 0;
  let feedbacksCreated = 0;

  // Lặp qua từng bác sĩ để tạo appointments
  console.log('Tạo appointments cho từng bác sĩ...');

  for (const doctor of allDoctors) {
    // Lấy availabilities và services của bác sĩ
    const availabilities = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id },
    });

    const doctorServices = await prisma.doctorService.findMany({
      where: { doctorId: doctor.id },
      include: { service: true },
    });

    if (availabilities.length === 0 || doctorServices.length === 0) {
      continue;
    }

    // Tạo appointments cho mỗi ngày làm việc từ START_DATE đến END_DATE
    const currentDate = new Date(APPOINTMENT_START_DATE);

    while (currentDate <= APPOINTMENT_END_DATE) {
      const dayOfWeek = currentDate.getDay();

      // Kiểm tra xem bác sĩ có làm việc ngày này không
      const availability = availabilities.find(
        (a) => a.dayOfWeek === dayOfWeek,
      );

      if (availability) {
        // Tạo vài cuộc hẹn trong ngày (2-4 appointments)
        const numAppointments = faker.number.int({ min: 2, max: 4 });

        for (let i = 0; i < numAppointments; i++) {
          try {
            // Chọn service ngẫu nhiên từ các service của bác sĩ
            const doctorService = faker.helpers.arrayElement(doctorServices);
            const service = doctorService.service;

            // Chọn patient ngẫu nhiên
            const patientProfileId = faker.helpers.arrayElement(
              createdPatientProfileIds,
            );

            // Tạo thời gian appointment
            const [startHour, startMin] = availability.startTime
              .split(':')
              .map(Number);
            const [endHour, endMin] = availability.endTime
              .split(':')
              .map(Number);

            const shiftStart = new Date(currentDate);
            shiftStart.setHours(startHour, startMin, 0, 0);

            const shiftEnd = new Date(currentDate);
            shiftEnd.setHours(endHour, endMin, 0, 0);

            const totalMinutes =
              (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
            const maxSlots = Math.floor(totalMinutes / service.duration);

            if (maxSlots <= 0) continue;

            const randomSlot = faker.number.int({ min: 0, max: maxSlots - 1 });
            const appointmentStart = new Date(
              shiftStart.getTime() + randomSlot * service.duration * 60000,
            );
            const appointmentEnd = new Date(
              appointmentStart.getTime() + service.duration * 60000,
            );

            // Xác định trạng thái
            let status: AppointmentStatus;
            if (appointmentEnd < today) {
              // Random COMPLETED hoặc CANCELLED cho quá khứ
              status = faker.helpers.arrayElement([
                'COMPLETED',
                'COMPLETED',
                'COMPLETED',
                'CANCELLED',
              ]) as AppointmentStatus;
            } else if (appointmentStart <= today && appointmentEnd > today) {
              status = 'ON_GOING';
            } else {
              // Random UPCOMING hoặc CANCELLED cho tương lai
              status = faker.helpers.arrayElement([
                'UPCOMING',
                'UPCOMING',
                'UPCOMING',
                'CANCELLED',
              ]) as AppointmentStatus;
            }

            // Tạo appointment
            const appointment = await prisma.appointment.create({
              data: {
                startTime: appointmentStart,
                endTime: appointmentEnd,
                status,
                notes: faker.lorem.sentence(),
                type: 'OFFLINE',
                patientProfileId,
                doctorId: doctor.id,
                serviceId: service.id,
                clinicId: doctor.clinicId,
              },
            });
            appointmentsCreated++;

            // Tạo billing
            const billingStatus = status === 'CANCELLED' ? 'REFUNDED' : 'PAID';
            await prisma.billing.create({
              data: {
                appointmentId: appointment.id,
                amount: service.price,
                status: billingStatus,
                paymentMethod: faker.helpers.arrayElement([
                  'ONLINE',
                  'OFFLINE',
                ]),
              },
            });
            billingsCreated++;

            // Tạo feedback nếu COMPLETED
            if (status === 'COMPLETED') {
              await prisma.feedback.create({
                data: {
                  appointmentId: appointment.id,
                  rating: faker.number.int({ min: 3, max: 5 }),
                  comment: faker.lorem.sentence(),
                },
              });
              feedbacksCreated++;
            }
          } catch {
            // Bỏ qua lỗi (có thể do trùng thời gian)
          }
        }
      }

      // Chuyển sang ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (appointmentsCreated % 500 === 0 && appointmentsCreated > 0) {
      console.log(`   ... đã tạo ${appointmentsCreated} appointments`);
    }
  }

  console.log(
    `✅ Đã tạo ${appointmentsCreated} appointments, ${billingsCreated} billings, ${feedbacksCreated} feedbacks`,
  );

  // ---- BƯỚC 10: TẠO TAGS CHO Q&A ----
  console.log('\n--- Bước 10: Tạo Tags cho Q&A...');
  await prisma.tag.createMany({
    data: tagsData,
  });
  console.log(`✅ Đã tạo ${tagsData.length} tags`);

  // Get created tags
  const tags = await prisma.tag.findMany();

  // ---- BƯỚC 11: TẠO QUESTIONS & ANSWERS ----
  console.log('\n--- Bước 11: Tạo Questions & Answers...');

  // Lấy một số user để làm tác giả
  const users = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    take: 50,
  });

  // Lấy một số bác sĩ để trả lời
  const doctorUsers = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    take: 20,
  });

  let questionsCreated = 0;
  let answersCreated = 0;
  let votesCreated = 0;

  for (let i = 0; i < NUMBER_OF_POSTS; i++) {
    try {
      const author = faker.helpers.arrayElement(users);

      // Tạo question
      const question = await prisma.question.create({
        data: {
          title: faker.lorem.sentence({ min: 5, max: 10 }),
          content: faker.lorem.paragraphs(2),
          views: faker.number.int({ min: 10, max: 500 }),
          upvotes: faker.number.int({ min: 0, max: 50 }),
          downvotes: faker.number.int({ min: 0, max: 5 }),
          authorId: author.id,
        },
      });
      questionsCreated++;

      // Gán tags cho question (1-3 tags)
      const numTags = faker.number.int({ min: 1, max: 3 });
      const selectedTags = faker.helpers.arrayElements(tags, numTags);

      for (const tag of selectedTags) {
        await prisma.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tag.id,
          },
        });
      }

      // Tạo answers (1-5 answers)
      const numAnswers = faker.number.int({ min: 1, max: 5 });

      for (let j = 0; j < numAnswers; j++) {
        // Một số answer từ bác sĩ, một số từ user khác
        const answerAuthor =
          j === 0
            ? faker.helpers.arrayElement(doctorUsers)
            : faker.helpers.arrayElement([...users, ...doctorUsers]);

        const answer = await prisma.answer.create({
          data: {
            content: faker.lorem.paragraphs(1),
            upvotes: faker.number.int({ min: 0, max: 30 }),
            downvotes: faker.number.int({ min: 0, max: 3 }),
            questionId: question.id,
            authorId: answerAuthor.id,
          },
        });
        answersCreated++;

        // Đặt best answer cho câu trả lời đầu tiên có thể
        if (j === 0 && faker.datatype.boolean()) {
          await prisma.question.update({
            where: { id: question.id },
            data: { bestAnswerId: answer.id },
          });
        }
      }

      // Tạo votes cho question
      const numVoters = faker.number.int({ min: 2, max: 10 });
      const voters = faker.helpers.arrayElements(users, numVoters);

      for (const voter of voters) {
        try {
          await prisma.questionVote.create({
            data: {
              questionId: question.id,
              userId: voter.id,
              voteType: faker.helpers.arrayElement(['UP', 'DOWN']),
            },
          });
          votesCreated++;
        } catch {
          // Bỏ qua nếu user đã vote
        }
      }
    } catch {
      // Bỏ qua lỗi
    }
  }

  console.log(
    `✅ Đã tạo ${questionsCreated} questions, ${answersCreated} answers, ${votesCreated} votes`,
  );

  // ---- BƯỚC 12: TẠO FAQs ----
  console.log('\n--- Bước 12: Tạo FAQs...');
  await prisma.appTerms.createMany({
    data: faqsData,
  });
  console.log(`✅ Đã tạo ${faqsData.length} FAQs`);

  // ---- SUMMARY ----
  console.log(
    `\n✅ HOÀN THÀNH! Đã tạo thành công:
     - ${specialties.length} chuyên khoa
     - ${servicesData.length} dịch vụ
     - ${clinics.length} phòng khám
     - ${doctorCount} bác sĩ
     - ${NUMBER_OF_ADMIN} admin
     - ${NUMBER_OF_RECEPTIONISTS} lễ tân
     - ${NUMBER_OF_PATIENT_USERS} user bệnh nhân
     - ${totalProfilesCreated} hồ sơ bệnh nhân
     - ${appointmentsCreated} lịch hẹn
     - ${billingsCreated} hóa đơn
     - ${feedbacksCreated} feedbacks
     - ${tagsData.length} tags
     - ${questionsCreated} questions
     - ${answersCreated} answers
     - ${faqsData.length} FAQs`,
  );
}

main()
  .catch((e) => {
    console.error('Lỗi nghiêm trọng trong quá trình seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(() => {
    // Ignore disconnect errors
  });
