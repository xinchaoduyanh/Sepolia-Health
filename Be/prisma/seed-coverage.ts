import { PrismaClient, DayOfWeek } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';
const prisma = new PrismaClient();

// --- CẤU HÌNH ---
// Số lượng bác sĩ sẽ được tạo cho MỖI DỊCH VỤ tại MỖI CƠ SỞ (random từ 2-4)
const MIN_DOCTORS_PER_SERVICE_PER_CLINIC = 2;
const MAX_DOCTORS_PER_SERVICE_PER_CLINIC = 4;

const NUMBER_OF_CLINICS = 5; // ID từ 1 đến 5
const NUMBER_OF_SERVICES = 17; // ID từ 1 đến 17
const DEFAULT_PASSWORD = 'password123';
// -----------------

// Dữ liệu giả lập để làm phong phú thông tin
const specialties = [
  'Nội tiết',
  'Nội Tiêu hoá',
  'Nội Tim mạch',
  'Răng - Hàm - Mặt',
  'Sản phụ khoa',
  'Tai - Mũi - Họng',
  'Truyền nhiễm',
  'Đa khoa',
  'Da liễu',
  'Mắt',
  'Ngoại chấn thương chỉnh hình',
  'Ngoại Thận - Tiết niệu',
  'Ngoại Tiêu hoá',
  'Dinh dưỡng',
  'Cơ xương khớp',
  'Thần kinh',
  'Hô hấp',
];

// Các ca làm việc mẫu
const workShifts = [
  { name: 'Sáng', startTime: '08:00', endTime: '12:00' },
  { name: 'Chiều', startTime: '13:30', endTime: '17:30' },
  { name: 'Cả ngày', startTime: '08:00', endTime: '17:00' },
];

const daysOfWeek: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

// Gender options
const genders = ['MALE', 'FEMALE', 'OTHER'] as const;

async function main() {
  console.log('--- Bắt đầu quá trình SEED DỮ LIỆU BÁC SĨ THÔNG MINH ---');
  console.log(
    `- Mục tiêu: Mỗi Clinic và mỗi Service có random ${MIN_DOCTORS_PER_SERVICE_PER_CLINIC}-${MAX_DOCTORS_PER_SERVICE_PER_CLINIC} bác sĩ.`,
  );
  console.log(
    `- Tổng số bác sĩ ước tính: ${(NUMBER_OF_CLINICS * NUMBER_OF_SERVICES * (MIN_DOCTORS_PER_SERVICE_PER_CLINIC + MAX_DOCTORS_PER_SERVICE_PER_CLINIC)) / 2}`,
  );

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let createdCount = 0;

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
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${faker.string.alphanumeric(4)}@sepoliahealthcare.vn`;
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

        const doctorProfile = await prisma.doctorProfile.create({
          data: {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            specialty: faker.helpers.arrayElement(specialties),
            experience: faker.lorem.sentence({ min: 5, max: 10 }),
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

        createdCount++;
        console.log(
          `   [${createdCount}] Đã tạo: Dr. ${lastName} ${firstName} (${gender}, ${phone})`,
        );
      }
    }
  }

  console.log(
    `\n✅ HOÀN THÀNH! Đã tạo thành công ${createdCount} bác sĩ và lịch làm việc của họ.`,
  );
}

main()
  .catch((e) => {
    console.error('Lỗi nghiêm trọng trong quá trình seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
