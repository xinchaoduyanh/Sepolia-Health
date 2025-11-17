import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { AppointmentStatus } from '@prisma/client'; // Thêm import
const prisma = new PrismaClient();

// --- CẤU HÌNH ---
// Số lượng bác sĩ sẽ được tạo cho MỖI DỊCH VỤ tại MỖI CƠ SỞ (random từ 2-4)
const MIN_DOCTORS_PER_SERVICE_PER_CLINIC = 2;
const MAX_DOCTORS_PER_SERVICE_PER_CLINIC = 4;

const NUMBER_OF_CLINICS = 5; // ID từ 1 đến 5
const NUMBER_OF_SERVICES = 17; // ID từ 1 đến 17
const DEFAULT_PASSWORD = 'password123';

// Cấu hình cho dữ liệu mới
const NUMBER_OF_PATIENT_USERS = 350; // Số user bệnh nhân (mục tiêu 300-400)
const NUMBER_OF_STAFF_PER_ROLE = 5; // 5 admin, 5 lễ tân
const NUMBER_OF_APPOINTMENTS = 1500; // Số lịch hẹn
const APPOINTMENT_START_DATE = new Date('2024-01-01');
const APPOINTMENT_END_DATE = new Date('2025-10-26');
// -----------------

// Dữ liệu dịch vụ
const services = [
  {
    name: 'Nội tiết',
    description:
      'Khám và điều trị các bệnh như tiểu đường, rối loạn tuyến giáp, rối loạn cholesterol, các bệnh lý tuyến yên, tuyến thượng thận.',
    price: 300000,
    duration: 30,
  },
  {
    name: 'Nội Tiêu hoá',
    description:
      'Khám chữa tổng hợp các bệnh liên quan đến đường tiêu hóa và các cơ quan phụ trợ tiêu hóa như bệnh dạ dày, tá tràng, đại tràng, gan, mật.',
    price: 300000,
    duration: 30,
  },
  {
    name: 'Nội Tim mạch',
    description:
      'Khám và điều trị các bệnh như đau ngực, nặng ngực, đau ngực khi gắng sức, xúc động mạnh, tăng huyết áp, bệnh lý van tim.',
    price: 350000,
    duration: 30,
  },
  {
    name: 'Răng - Hàm - Mặt',
    description:
      'Khám và điều trị các bệnh như sâu răng, viêm tủy răng, viêm nướu, nứt răng, gãy chân răng, các bệnh lý vùng hàm mặt.',
    price: 200000,
    duration: 60,
  },
  {
    name: 'Sản phụ khoa',
    description:
      'Khám và điều trị các bệnh như viêm nhiễm phụ khoa, khí hư bất thường, rối loạn kinh nguyệt, khám thai, tư vấn kế hoạch hóa gia đình.',
    price: 300000,
    duration: 30,
  },
  {
    name: 'Tai - Mũi - Họng',
    description:
      'Khám và điều trị các bệnh như viêm đau họng, đau rát họng, ung thư cổ họng, ung thư thanh quản, viêm xoang, viêm tai giữa.',
    price: 250000,
    duration: 30,
  },
  {
    name: 'Tiêm chủng vắc xin',
    description:
      'Thực hiện tiêm vắc xin cho trẻ em và người lớn theo chương trình tiêm chủng mở rộng và tiêm chủng dịch vụ.',
    price: 150000,
    duration: 30,
  },
  {
    name: 'Truyền nhiễm',
    description:
      'Tiếp nhận khám, chẩn đoán, điều trị, hợp tác chống dịch bệnh và chăm sóc bệnh nhân bị bệnh truyền nhiễm.',
    price: 300000,
    duration: 30,
  },
  {
    name: 'Đa khoa',
    description:
      'Khám sàng lọc các bệnh lý cơ bản, chưa rõ nguyên nhân, chưa có định hướng chuyên khoa sâu để được tư vấn và điều trị ban đầu.',
    price: 250000,
    duration: 30,
  },
  {
    name: 'Da liễu',
    description:
      'Khoa Da liễu là khoa chuyên điều trị các bệnh về da và những phần phụ của da (tóc, móng, tuyến mồ hôi...).',
    price: 250000,
    duration: 30,
  },
  {
    name: 'Khám sàng lọc tiêu hóa',
    description:
      'Tầm soát và phát hiện sớm các bệnh lý đường tiêu hóa, đặc biệt là ung thư dạ dày, đại trực tràng.',
    price: 500000,
    duration: 60,
  },
  {
    name: 'Khám sàng lọc tim mạch',
    description:
      'Tầm soát, phát hiện sớm các yếu tố nguy cơ và bệnh lý tim mạch để có kế hoạch điều trị kịp thời.',
    price: 550000,
    duration: 60,
  },
  {
    name: 'Khám sức khỏe tổng quát - Trẻ em',
    description:
      'Chỉ khám cho khách hàng dưới 16 tuổi. Kiểm tra sức khỏe toàn diện, theo dõi sự phát triển thể chất và tinh thần của trẻ.',
    price: 400000,
    duration: 60,
  },
  {
    name: 'Mắt',
    description:
      'Khám và điều trị các bệnh lý nội khoa về mắt cũng như các phẫu thuật mắt như: mộng thịt, chắp, lẹo.',
    price: 200000,
    duration: 30,
  },
  {
    name: 'Ngoại chấn thương chỉnh hình',
    description:
      'Khám thực hiện phẫu thuật các vấn đề chấn thương và di chứng chấn thương xương khớp, thay khớp.',
    price: 350000,
    duration: 60,
  },
  {
    name: 'Ngoại Thận - Tiết niệu',
    description:
      'Thực hiện các phẫu thuật nội soi và phẫu thuật mở điều trị các bệnh ngoại khoa Tiết niệu: sỏi thận, sỏi niệu quản, u bàng quang.',
    price: 350000,
    duration: 60,
  },
  {
    name: 'Ngoại Tiêu hoá',
    description:
      'Phẫu thuật nội soi, phẫu thuật robot điều trị ung thư dạ dày, ung thư đại trực tràng, gan mật tụy, thoát vị bẹn.',
    price: 400000,
    duration: 60,
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
      'Phòng khám hiện đại tại Cầu Giấy, tập trung vào các chuyên khoa Tai - Mũi - Họng và Răng - Hàm - Mặt.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Đống Đa',
    address: '180 P. Xã Đàn, Phương Liên, Đống Đa, Hà Nội',
    phone: '02435729999',
    email: 'dongda@sepoliahealthcare.vn',
    description:
      'Chuyên khoa Nhi và Sản phụ khoa, cung cấp dịch vụ chăm sóc toàn diện cho mẹ và bé tại khu vực Đống Đa.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Ba Đình',
    address: '5 P. Đội Cấn, Đội Cấn, Ba Đình, Hà Nội',
    phone: '02437228686',
    email: 'badinh@sepoliahealthcare.vn',
    description:
      'Cơ sở chuyên về Nội khoa và Da liễu, với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị tiên tiến.',
    isActive: true,
  },
  {
    name: 'Sepolia Healthcare Hà Đông',
    address:
      'Tầng 1, Tòa nhà Hồ Gươm Plaza, 102 P. Trần Phú, Mộ Lao, Hà Đông, Hà Nội',
    phone: '02439968989',
    email: 'hadong@sepoliahealthcare.vn',
    description:
      'Cung cấp dịch vụ y tế đa dạng cho khu vực Hà Đông, bao gồm khám sức khỏe tổng quát và các gói tiêm chủng.',
    isActive: true,
  },
];

// Các ca làm việc mẫu
const workShifts = [
  { name: 'Sáng', startTime: '08:00', endTime: '12:00' },
  { name: 'Chiều', startTime: '13:30', endTime: '17:30' },
  { name: 'Cả ngày', startTime: '08:00', endTime: '17:00' },
];

// Thứ trong tuần: 1 = Monday, 2 = Tuesday, ..., 6 = Saturday (không bao gồm Sunday = 0)
const daysOfWeek = [1, 2, 3, 4, 5, 6];

// Gender options
const genders = ['MALE', 'FEMALE'] as const;

async function main() {
  console.log('--- BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU ---');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ---- BƯỚC 1: XÓA DỮ LIỆU CŨ (TÙY CHỌN) ----
  console.log('\n--- Bước 1: Xóa dữ liệu cũ...');
  // Xóa theo thứ tự quan hệ
  await prisma.feedback.deleteMany({});
  await prisma.billing.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.doctorService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.receptionistProfile.deleteMany({});
  await prisma.adminProfile.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.clinic.deleteMany({});
  console.log('✅ Đã xóa dữ liệu cũ');

  // ---- BƯỚC 2: TẠO DỊCH VỤ (SERVICE) ----
  console.log('\n--- Bước 2: Tạo dịch vụ...');
  await prisma.service.createMany({
    data: services,
  });
  console.log(`✅ Đã tạo ${services.length} dịch vụ`);

  // ---- BƯỚC 3: TẠO PHÒNG KHÁM (CLINIC) ----
  console.log('\n--- Bước 3: Tạo phòng khám...');
  await prisma.clinic.createMany({
    data: clinics,
  });
  console.log(`✅ Đã tạo ${clinics.length} phòng khám`);

  // ---- BƯỚC 4: TẠO BÁC SĨ ----
  console.log('\n--- Bước 4: Tạo bác sĩ...');
  console.log(
    `- Mục tiêu: Mỗi Clinic và mỗi Service có random ${MIN_DOCTORS_PER_SERVICE_PER_CLINIC}-${MAX_DOCTORS_PER_SERVICE_PER_CLINIC} bác sĩ.`,
  );
  console.log(
    `- Tổng số bác sĩ ước tính: ${
      (NUMBER_OF_CLINICS *
        NUMBER_OF_SERVICES *
        (MIN_DOCTORS_PER_SERVICE_PER_CLINIC +
          MAX_DOCTORS_PER_SERVICE_PER_CLINIC)) /
      2
    }`,
  );

  let createdDoctorsCount = 0;

  // Vòng lặp chính để đảm bảo độ phủ
  for (let clinicId = 1; clinicId <= NUMBER_OF_CLINICS; clinicId++) {
    for (let serviceId = 1; serviceId <= NUMBER_OF_SERVICES; serviceId++) {
      // Random số lượng bác sĩ từ 2-4
      const doctorsCount = faker.number.int({
        min: MIN_DOCTORS_PER_SERVICE_PER_CLINIC,
        max: MAX_DOCTORS_PER_SERVICE_PER_CLINIC,
      });

      console.log(
        `\n--> Đang tạo ${doctorsCount} bác sĩ cho [Clinic #${clinicId}] - [Service #${serviceId}]...`,
      );
      for (let i = 0; i < doctorsCount; i++) {
        // ---- B1: TẠO USER ----
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        // Email: firstnamelastname + 3 số + @sepoliahealthcare.vn
        const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${faker.number.int(
          { min: 100, max: 999 },
        )}@sepoliahealthcare.vn`;
        const phone = faker.helpers.fromRegExp(/0[3-9][0-9]{8}/); // Số điện thoại Việt Nam

        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            phone,
            role: 'DOCTOR',
            status: UserStatus.ACTIVE,
          },
        });

        // ---- B2: TẠO DOCTOR PROFILE ----
        const gender = faker.helpers.arrayElement(genders);
        const dateOfBirth = faker.date.birthdate({
          min: 25,
          max: 65,
          mode: 'age',
        });

        const service = services[serviceId - 1];
        // SĐT liên hệ ngẫu nhiên
        const contactInfo = faker.helpers.fromRegExp(/0[3-9][0-9]{8}/);
        // Năm kinh nghiệm (2000-2019)
        const experienceYear = faker.number.int({ min: 2000, max: 2019 });

        const doctorProfile = await prisma.doctorProfile.create({
          data: {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            // YÊU CẦU MỚI: Chỉ lưu năm
            experience: experienceYear.toString(),
            // YÊU CẦU MỚI: SĐT ngẫu nhiên
            contactInfo: contactInfo,
            avatar: faker.image.avatar(),
            userId: user.id,
            clinicId: clinicId, // Gán bác sĩ vào clinic hiện tại
          },
        });

        // ---- B3: GÁN DỊCH VỤ CHO BÁC SĨ (DOCTORSERVICE) ----
        const assignedServiceIds = new Set<number>();
        // Dịch vụ được đảm bảo
        assignedServiceIds.add(serviceId);
        // Thêm ngẫu nhiên 1-2 dịch vụ khác để dữ liệu đa dạng hơn
        const extraServices = faker.number.int({ min: 1, max: 2 });
        for (let j = 0; j < extraServices; j++) {
          assignedServiceIds.add(
            faker.number.int({ min: 1, max: NUMBER_OF_SERVICES }),
          );
        }

        await prisma.doctorService.createMany({
          data: Array.from(assignedServiceIds).map((sId) => ({
            doctorId: doctorProfile.id,
            serviceId: sId,
          })),
        });

        // ---- B4: TẠO LỊCH LÀM VIỆC (DOCTORAVAILABILITY) ----
        const workDaysCount = faker.number.int({ min: 4, max: 6 }); // Làm việc 4-6 ngày/tuần
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

        createdDoctorsCount++;
        console.log(
          `   [${createdDoctorsCount}] Đã tạo: Dr. ${lastName} ${firstName} (${gender}, ${phone})`,
        );
      }
    }
  }
  console.log(`✅ Đã tạo ${createdDoctorsCount} bác sĩ.`);

  // ---- BƯỚC 5 (MỚI): TẠO STAFF (ADMIN & LỄ TÂN) ----
  console.log('\n--- Bước 5: Tạo Staff (Admin & Lễ tân)...');
  let staffCount = 0;
  const staffRoles: Role[] = ['ADMIN', 'RECEPTIONIST'];

  for (const role of staffRoles) {
    for (let i = 0; i < NUMBER_OF_STAFF_PER_ROLE; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `${role.toLowerCase()}${i + 1}@sepolia.vn`;
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone: faker.helpers.fromRegExp(/0[3-9][0-9]{8}/),
          role: role,
          status: UserStatus.ACTIVE,
        },
      });

      if (role === 'ADMIN') {
        await prisma.adminProfile.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            avatar: faker.image.avatar(),
          },
        });
      } else if (role === 'RECEPTIONIST') {
        await prisma.receptionistProfile.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            avatar: faker.image.avatar(),
          },
        });
      }
      staffCount++;
      console.log(
        `   [${staffCount}] Đã tạo ${role}: ${lastName} ${firstName} (${email})`,
      );
    }
  }
  console.log(`✅ Đã tạo ${staffCount} nhân viên (Admin & Lễ tân)`);

  // ---- BƯỚC 6 (MỚI): TẠO BỆNH NHÂN (USERS & PATIENTPROFILES) ----
  console.log('\n--- Bước 6: Tạo Bệnh nhân (Users & PatientProfiles)...');
  const createdPatientProfileIds: number[] = [];
  let totalProfilesCreated = 0;
  let patientUserCount = 0;

  for (let i = 0; i < NUMBER_OF_PATIENT_USERS; i++) {
    const managerFirstName = faker.person.firstName();
    const managerLastName = faker.person.lastName();
    const email = `patient${faker.number.int({
      min: 1000,
      max: 99999,
    })}@gmail.com`;
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
    patientUserCount++;

    // 1. Tạo hồ sơ SELF (Bắt buộc)
    const selfProfile = await prisma.patientProfile.create({
      data: {
        managerId: user.id,
        firstName: managerFirstName,
        lastName: managerLastName,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
        gender: faker.helpers.arrayElement(genders),
        phone: phone, // Dùng SĐT của user
        relationship: 'SELF',
        avatar: faker.image.avatar(),
      },
    });
    createdPatientProfileIds.push(selfProfile.id);
    totalProfilesCreated++;

    // 2. Tạo thêm 0-2 hồ sơ (random 1-3 total)
    const extraProfilesCount = faker.number.int({ min: 0, max: 2 });
    for (let j = 0; j < extraProfilesCount; j++) {
      const relationship = faker.helpers.arrayElement([
        'CHILD',
        'PARENT',
        'SPOUSE',
        'OTHER',
      ]);
      const extraProfile = await prisma.patientProfile.create({
        data: {
          managerId: user.id,
          firstName: faker.person.firstName(),
          lastName: managerLastName, // Thường chung họ
          dateOfBirth:
            relationship === 'CHILD'
              ? faker.date.birthdate({ min: 1, max: 17, mode: 'age' })
              : faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
          gender: faker.helpers.arrayElement(genders),
          phone: faker.helpers.fromRegExp(/0[3-9][0-9]{8}/),
          relationship: relationship,
          avatar: faker.image.avatar(),
        },
      });
      createdPatientProfileIds.push(extraProfile.id);
      totalProfilesCreated++;
    }
  }
  console.log(
    `✅ Đã tạo ${patientUserCount} user PATIENT và ${totalProfilesCreated} PatientProfiles.`,
  );

  // ---- BƯỚC 7 (MỚI): TẠO LỊCH HẸN, HÓA ĐƠN, FEEDBACK ----
  console.log('\n--- Bước 7: Tạo Lịch hẹn, Hóa đơn, Feedback...');
  const today = new Date();

  // Lấy tất cả các "cặp" dịch vụ-bác sĩ hợp lệ
  console.log('Đang lấy dữ liệu bác sĩ/dịch vụ/lịch làm việc...');
  const validDoctorServices = await prisma.doctorService.findMany({
    include: {
      service: true,
      doctor: {
        include: {
          availabilities: true,
          clinic: true,
        },
      },
    },
  });

  if (createdPatientProfileIds.length === 0) {
    console.warn('⚠️ Không có PatientProfile nào, bỏ qua tạo lịch hẹn.');
    return;
  }
  if (validDoctorServices.length === 0) {
    console.warn('⚠️ Không có DoctorService nào, bỏ qua tạo lịch hẹn.');
    return;
  }

  let appointmentsCreated = 0;
  let feedbacksCreated = 0;

  for (let i = 0; i < NUMBER_OF_APPOINTMENTS; i++) {
    try {
      // 1. Chọn ngẫu nhiên 1 Patient
      const patientProfileId = faker.helpers.arrayElement(
        createdPatientProfileIds,
      );
      // Lấy thông tin patient
      const patient = await prisma.patientProfile.findUnique({
        where: { id: patientProfileId },
      });
      if (!patient) continue;

      // 2. Chọn ngẫu nhiên 1 combo Bác sĩ - Dịch vụ - Phòng khám
      const combo = faker.helpers.arrayElement(validDoctorServices);
      const { doctor, service } = combo;
      const clinicId = doctor.clinicId;
      if (!clinicId) continue; // Bỏ qua nếu bác sĩ không thuộc clinic nào

      // 3. Tạo ngày hẹn ngẫu nhiên
      const appointmentDate = faker.date.between({
        from: APPOINTMENT_START_DATE,
        to: APPOINTMENT_END_DATE,
      });
      const dayOfWeek = appointmentDate.getDay(); // Sunday = 0, Monday = 1...

      // 4. Tìm ca làm việc
      const availability = doctor.availabilities.find(
        (a) => a.dayOfWeek === dayOfWeek,
      );
      if (!availability) {
        // Bác sĩ không làm việc hôm đó, thử lại với vòng lặp khác
        continue;
      }

      // 5. Tìm slot thời gian
      const [startHour, startMin] = availability.startTime
        .split(':')
        .map(Number);
      const [endHour, endMin] = availability.endTime.split(':').map(Number);

      const shiftStart = new Date(appointmentDate);
      shiftStart.setHours(startHour, startMin, 0, 0);

      const shiftEnd = new Date(appointmentDate);
      shiftEnd.setHours(endHour, endMin, 0, 0);

      const totalShiftMinutes =
        (shiftEnd.getTime() - shiftStart.getTime()) / 60000;
      const availableSlots = Math.floor(totalShiftMinutes / service.duration);

      if (availableSlots <= 0) {
        // Ca làm việc quá ngắn cho dịch vụ
        continue;
      }

      // Chọn 1 slot ngẫu nhiên
      const randomSlot = faker.number.int({ min: 0, max: availableSlots - 1 });
      const minutesOffset = randomSlot * service.duration;

      const appointmentStart = new Date(
        shiftStart.getTime() + minutesOffset * 60000,
      );
      const appointmentEnd = new Date(
        appointmentStart.getTime() + service.duration * 60000,
      );

      // 6. Xác định trạng thái
      let status: AppointmentStatus;
      if (appointmentEnd < today) {
        status = 'COMPLETED';
      } else if (appointmentStart <= today && appointmentEnd > today) {
        status = 'ON_GOING';
      } else {
        status = 'UPCOMING';
      }

      // 7. Tạo Appointment (schema mới: startTime và endTime là DateTime)
      const appointment = await prisma.appointment.create({
        data: {
          startTime: appointmentStart,
          endTime: appointmentEnd,
          status: status,
          notes: 'Lịch hẹn được tạo tự động (seed)',

          patientProfileId: patient.id,

          doctorId: doctor.id,
          serviceId: service.id,
          clinicId: clinicId,
        },
      });
      appointmentsCreated++;

      // 8. Tạo Billing
      await prisma.billing.create({
        data: {
          appointmentId: appointment.id,
          amount: service.price,
          status: 'PAID',
          paymentMethod: faker.helpers.arrayElement(['ONLINE', 'OFFLINE']),
        },
      });

      // 9. Tạo Feedback nếu đã COMPLETED
      if (status === 'COMPLETED') {
        await prisma.feedback.create({
          data: {
            patientProfileId: patient.id,
            doctorId: doctor.id,
            rating: faker.number.int({ min: 3, max: 5 }), // 3-5 sao
            comment: faker.lorem.sentence({ min: 5, max: 20 }),
          },
        });
        feedbacksCreated++;
      }

      if (appointmentsCreated % 100 === 0) {
        console.log(
          `   ... đã tạo ${appointmentsCreated}/${NUMBER_OF_APPOINTMENTS} lịch hẹn`,
        );
      }
    } catch (err) {
      console.warn(`Lỗi khi tạo lịch hẹn: ${err.message}. Bỏ qua...`);
    }
  }
  console.log(
    `✅ Đã tạo ${appointmentsCreated} lịch hẹn, ${appointmentsCreated} hóa đơn, và ${feedbacksCreated} feedbacks.`,
  );

  console.log(
    `\n✅ HOÀN THÀNH! Đã tạo thành công:
     - ${services.length} dịch vụ
     - ${clinics.length} phòng khám
     - ${createdDoctorsCount} bác sĩ
     - ${staffCount} nhân viên (Admin/Lễ tân)
     - ${patientUserCount} user bệnh nhân
     - ${totalProfilesCreated} hồ sơ bệnh nhân
     - ${appointmentsCreated} lịch hẹn (kèm hóa đơn)
     - ${feedbacksCreated} feedback`,
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
