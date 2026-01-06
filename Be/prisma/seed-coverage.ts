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

const DEFAULT_PASSWORD = '1';
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

  // 1. Clinics - Full data
  const clinicsData = [
    {
      name: 'Sepolia Hoàn Kiếm',
      address: '22 P. Lý Thường Kiệt, Phan Chu Trinh, Hoàn Kiếm, Hà Nội',
      phone: '02439748888',
      email: 'hoankiem@sepoliahealthcare.vn',
      description: 'Cơ sở trung tâm tại quận Hoàn Kiếm',
      isActive: true,
    },
    {
      name: 'Sepolia Cầu Giấy',
      address: 'Tầng 2, Tòa nhà Discovery Complex, 302 P. Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
      phone: '02438398685',
      email: 'caugiay@sepoliahealthcare.vn',
      description: 'Phòng khám hiện đại tại Cầu Giấy',
      isActive: true,
    },
    {
      name: 'Sepolia Đống Đa',
      address: '180 P. Xã Đàn, Phương Liên, Đống Đa, Hà Nội',
      phone: '02435729999',
      email: 'dongda@sepoliahealthcare.vn',
      description: 'Chuyên khoa Sản phụ khoa',
      isActive: true,
    },
    {
      name: 'Sepolia Ba Đình',
      address: '5 P. Đội Cấn, Đội Cấn, Ba Đình, Hà Nội',
      phone: '02437622888',
      email: 'badinh@sepoliahealthcare.vn',
      description: 'Chuyên khoa Nhi và Nội tổng quát',
      isActive: true,
    },
    {
      name: 'Sepolia Hà Đông',
      address: 'Tầng 1, Tòa nhà Hồ Gươm Plaza, 102 P. Trần Phú, Mộ Lao, Hà Đông, Hà Nội',
      phone: '02439969898',
      email: 'hadong@sepoliahealthcare.vn',
      description: 'Cung cấp dịch vụ y tế đa dạng',
      isActive: true,
    },
  ];
  const clinics = await Promise.all(
    clinicsData.map((data) => prisma.clinic.create({ data })),
  );

  // 2. Specialties
  const specs = await Promise.all(
    specialtiesData.map((name) => prisma.specialty.create({ data: { name } })),
  );

  // 3. Services (99) - Data from data.txt
  // Format: [specialty, serviceName, duration, price, type, targetAudience]
  const servicesFromData = [
    // I. Nội & Nam khoa
    ['Nội & Nam khoa', 'Khám nội đa khoa tổng quát', 30, 300000, 'Online/Offline', null],
    ['Nội & Nam khoa', 'Tư vấn quản lý huyết áp/tiểu đường', 30, 400000, 'Online/Offline', null],
    ['Nội & Nam khoa', 'Tầm soát nguy cơ tim mạch sớm', 30, 450000, 'Offline', null],
    ['Nội & Nam khoa', 'Khám tư vấn sức khỏe người cao tuổi', 60, 600000, 'Offline', null],
    ['Nội & Nam khoa', 'Kiểm tra sức khỏe hậu Covid (Tư vấn)', 30, 450000, 'Online/Offline', null],
    ['Nội & Nam khoa', 'Khám Nam khoa cơ bản', 30, 500000, 'Offline', 'MALE'],
    ['Nội & Nam khoa', 'Tư vấn rối loạn chức năng sinh lý', 30, 700000, 'Online/Offline', 'MALE'],
    ['Nội & Nam khoa', 'Gói tầm soát bệnh xã hội (STIs)', 30, 1000000, 'Offline', null],
    // II. Nhi khoa
    ['Nhi khoa', 'Khám Nhi nội tổng hợp', 30, 300000, 'Online/Offline', null],
    ['Nhi khoa', 'Khám sơ sinh & Tư vấn chăm sóc bé', 60, 500000, 'Offline', null],
    ['Nhi khoa', 'Tư vấn vaccine & Lập kế hoạch tiêm', 30, 200000, 'Online/Offline', null],
    ['Nhi khoa', 'Khám dậy thì sớm ở trẻ', 30, 450000, 'Offline', null],
    ['Nhi khoa', 'Khám đánh giá ngôn ngữ/vận động', 60, 600000, 'Offline', null],
    ['Nhi khoa', 'Tư vấn xử lý sốt và co giật (Khẩn cấp)', 30, 300000, 'Online', null],
    ['Nhi khoa', 'Khám nội soi Tai Mũi Họng nhi', 30, 300000, 'Offline', null],
    // III. Tai Mũi Họng
    ['Tai Mũi Họng', 'Khám & Nội soi TMH ống cứng', 30, 300000, 'Offline', null],
    ['Tai Mũi Họng', 'Nội soi TMH ống mềm (Không đau)', 30, 500000, 'Offline', null],
    ['Tai Mũi Họng', 'Lấy dáy tai nội soi chuyên sâu', 30, 150000, 'Offline', null],
    ['Tai Mũi Họng', 'Khí dung mũi họng trị viêm', 30, 150000, 'Offline', null],
    ['Tai Mũi Họng', 'Lấy dị vật tai/mũi/họng đơn giản', 30, 350000, 'Offline', null],
    ['Tai Mũi Họng', 'Hút xoang dưới áp lực', 30, 200000, 'Offline', null],
    ['Tai Mũi Họng', 'Đo thính lực đơn âm định lượng', 30, 250000, 'Offline', null],
    // IV. Da liễu & Thẩm mỹ
    ['Da liễu & Thẩm mỹ', 'Khám da liễu bệnh lý', 30, 300000, 'Online/Offline', null],
    ['Da liễu & Thẩm mỹ', 'Lấy nhân mụn y khoa chuyên sâu', 60, 400000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Điều trị mụn công nghệ cao IPL', 30, 800000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Chăm sóc da mụn phục hồi (Điện di)', 60, 600000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Peel da hóa học trị mụn/thâm', 60, 1200000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Laser Fractional CO2 trị sẹo rỗ', 60, 2500000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Laser trị nám/tàn nhang (Picosure)', 30, 2000000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Mesotherapy căng bóng (Skinboosters)', 60, 3500000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Mesotherapy trị mụn/kiểm soát nhờn', 60, 2500000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Tiêm Meso kích thích mọc tóc', 60, 2500000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Tẩy nốt ruồi/Mụn thịt bằng Laser', 30, 200000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Nâng cơ trẻ hóa Hifu toàn mặt', 60, 4000000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Trẻ hóa da công nghệ Tempsure Pro', 60, 5000000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Điện di tinh chất Vitamin C sáng da', 30, 500000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Phân tích da & Tư vấn Routine cá nhân', 30, 200000, 'Online/Offline', null],
    ['Da liễu & Thẩm mỹ', 'Chăm sóc da body phục hồi', 60, 1000000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Triệt lông công nghệ (Vùng mặt)', 30, 500000, 'Offline', null],
    ['Da liễu & Thẩm mỹ', 'Khám tầm soát các khối u lành dưới da', 30, 450000, 'Offline', null],
    // V. Sản Phụ khoa
    ['Sản Phụ khoa', 'Khám phụ khoa định kỳ (Soi CTC)', 30, 300000, 'Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Khám thai định kỳ (Không siêu âm)', 30, 360000, 'Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Soi cổ tử cung tầm soát ung thư', 30, 400000, 'Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Tư vấn kế hoạch hóa gia đình', 30, 300000, 'Online/Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Tư vấn sức khỏe tiền mãn kinh', 60, 600000, 'Online/Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Làm thuốc phụ khoa tại chỗ', 30, 150000, 'Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Gói xét nghiệm tầm soát ung thư CTC', 30, 900000, 'Offline', 'FEMALE'],
    ['Sản Phụ khoa', 'Khám và tư vấn bệnh lý tuyến vú', 30, 400000, 'Offline', 'FEMALE'],
    // VI. Nhãn khoa
    ['Nhãn khoa', 'Khám mắt & Đo thị lực máy KTS', 30, 250000, 'Offline', null],
    ['Nhãn khoa', 'Thử kính & Cấp đơn kính chuẩn', 30, 150000, 'Offline', null],
    ['Nhãn khoa', 'Tầm soát khô mắt chuyên sâu', 60, 500000, 'Offline', null],
    ['Nhãn khoa', 'Tư vấn kiểm soát cận thị trẻ em', 30, 300000, 'Online/Offline', null],
    ['Nhãn khoa', 'Chích chắp lẹo (Tiểu phẫu)', 30, 350000, 'Offline', null],
    ['Nhãn khoa', 'Theo dõi nhãn áp tầm soát Glocom', 30, 350000, 'Offline', null],
    ['Nhãn khoa', 'Khám tầm soát đục thủy tinh thể', 30, 400000, 'Offline', null],
    // VII. Răng Hàm Mặt
    ['Răng Hàm Mặt', 'Khám răng & Tư vấn thẩm mỹ', 30, 0, 'Offline', null],
    ['Răng Hàm Mặt', 'Lấy cao răng & Đánh bóng máy rung', 30, 300000, 'Offline', null],
    ['Răng Hàm Mặt', 'Hàn/Trám răng thẩm mỹ (Xoang nhỏ)', 30, 350000, 'Offline', null],
    ['Răng Hàm Mặt', 'Nhổ răng khôn (Mọc thẳng)', 60, 1000000, 'Offline', null],
    ['Răng Hàm Mặt', 'Tẩy trắng răng Laser tại phòng khám', 60, 2500000, 'Offline', null],
    ['Răng Hàm Mặt', 'Khám tư vấn niềng răng Invisalign', 60, 300000, 'Offline', null],
    ['Răng Hàm Mặt', 'Tư vấn cấy ghép Implant chuyên sâu', 30, 400000, 'Online/Offline', null],
    ['Răng Hàm Mặt', 'Trám răng sữa cho trẻ em', 30, 200000, 'Offline', null],
    ['Răng Hàm Mặt', 'Cắt lợi trùm răng khôn', 30, 500000, 'Offline', null],
    ['Răng Hàm Mặt', 'Chữa tủy răng cửa (Nội nha)', 60, 1500000, 'Offline', null],
    // VIII. Tiêu hóa & Nội soi
    ['Tiêu hóa & Nội soi', 'Khám chuyên khoa Tiêu hóa', 30, 350000, 'Online/Offline', null],
    ['Tiêu hóa & Nội soi', 'Nội soi dạ dày gây mê (Không đau)', 60, 2500000, 'Offline', null],
    ['Tiêu hóa & Nội soi', 'Nội soi đại tràng gây mê (Không đau)', 90, 3200000, 'Offline', null],
    ['Tiêu hóa & Nội soi', 'Nội soi dạ dày - đại tràng (Combo)', 120, 5500000, 'Offline', null],
    ['Tiêu hóa & Nội soi', 'Test vi khuẩn HP qua hơi thở (C13/C14)', 30, 600000, 'Offline', null],
    ['Tiêu hóa & Nội soi', 'Cắt Polyp dạ dày/đại tràng (Thủ thuật)', 60, 1500000, 'Offline', null],
    ['Tiêu hóa & Nội soi', 'Siêu âm ổ bụng tổng quát màu 4D', 30, 300000, 'Offline', null],
    // IX. Vật lý trị liệu & PHCN
    ['Vật lý trị liệu & PHCN', 'Khám & Tầm soát cột sống 4D', 30, 500000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Nắn chỉnh cột sống Chiropractic', 60, 1200000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Trị liệu bằng tay & Massage y khoa', 60, 450000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Châm cứu/Điện châm phục hồi', 30, 250000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Trị liệu sóng xung kích/Siêu âm', 30, 350000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Kéo giãn cột sống máy tự động', 30, 200000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Điện xung giảm đau chuyên sâu', 30, 250000, 'Offline', null],
    ['Vật lý trị liệu & PHCN', 'Tập phục hồi chức năng sau chấn thương', 60, 500000, 'Offline', null],
    // X. Tâm lý & Dinh dưỡng
    ['Tâm lý & Dinh dưỡng', 'Tham vấn tâm lý cá nhân (Stress/Lo âu)', 60, 800000, 'Online/Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Tham vấn tâm lý trẻ em & Vị thành niên', 60, 900000, 'Online/Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Tư vấn tâm lý cặp đôi/gia đình', 90, 1200000, 'Online/Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Thực hiện trắc nghiệm tâm lý Beck/MMSE', 30, 200000, 'Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Tư vấn rối loạn giấc ngủ chuyên sâu', 30, 500000, 'Online/Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Khám & Tư vấn dinh dưỡng cho trẻ', 60, 500000, 'Online/Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Tư vấn thực đơn cho người béo phì', 60, 600000, 'Online/Offline', null],
    ['Tâm lý & Dinh dưỡng', 'Xây dựng chế độ ăn bệnh lý', 60, 800000, 'Online/Offline', null],
    // XI. Gói khám sức khỏe tổng quát
    ['Gói khám sức khỏe tổng quát', 'Gói khám sức khỏe Tổng quát Tiêu chuẩn', 120, 2500000, 'Offline', null],
    ['Gói khám sức khỏe tổng quát', 'Gói tầm soát Ung thư Nữ (Vú, CTC)', 150, 5500000, 'Offline', 'FEMALE'],
    ['Gói khám sức khỏe tổng quát', 'Gói tầm soát Ung thư Nam (Gan, TLT)', 120, 4800000, 'Offline', 'MALE'],
    ['Gói khám sức khỏe tổng quát', 'Gói kiểm tra sức khỏe Tiền hôn nhân', 180, 6000000, 'Offline', null],
    ['Gói khám sức khỏe tổng quát', 'Gói tầm soát Đột quỵ & Tim mạch', 150, 8500000, 'Offline', null],
    ['Gói khám sức khỏe tổng quát', 'Gói khám sức khỏe Nhi khoa định kỳ', 90, 1800000, 'Offline', null],
    // XII. Chẩn đoán & Ngoại khoa
    ['Chẩn đoán & Ngoại khoa', 'Chụp cộng hưởng từ MRI (1 vùng)', 60, 2500000, 'Offline', null],
    ['Chẩn đoán & Ngoại khoa', 'Chụp CT Scanner tầm soát phổi/ngực', 30, 1500000, 'Offline', null],
    ['Chẩn đoán & Ngoại khoa', 'Siêu âm tim màu 4D chuyên sâu', 30, 700000, 'Offline', null],
    ['Chẩn đoán & Ngoại khoa', 'Xử lý vết thương hở (Khâu da)', 60, 800000, 'Offline', null],
    ['Chẩn đoán & Ngoại khoa', 'Chích áp xe/Lấy u bã đậu nhỏ', 60, 1200000, 'Offline', null],
  ] as const;

  // Map specialty names from data.txt to our specialtiesData
  const specNameMap: Record<string, string> = {
    'Nội & Nam khoa': 'Nội & Nam khoa',
    'Nhi khoa': 'Nhi khoa',
    'Tai Mũi Họng': 'Tai Mũi Họng',
    'Da liễu & Thẩm mỹ': 'Da liễu & Thẩm mỹ',
    'Sản Phụ khoa': 'Sản Phụ khoa',
    'Nhãn khoa': 'Nhãn khoa',
    'Răng Hàm Mặt': 'Răng Hàm Mặt',
    'Tiêu hóa & Nội soi': 'Tiêu hóa & Nội soi',
    'Vật lý trị liệu & PHCN': 'Vật lý trị liệu & PHCN',
    'Tâm lý & Dinh dưỡng': 'Tâm lý & Dinh dưỡng',
    'Gói khám sức khỏe tổng quát': 'Gói khám sức khỏe tổng quát',
    'Chẩn đoán & Ngoại khoa': 'Chẩn đoán & Ngoại khoa',
  };

  const svcsData: any[] = [];
  for (const [specName, name, duration, price, type, targetGender] of servicesFromData) {
    const spec = specs.find((s) => s.name === specNameMap[specName]);
    if (!spec) {
      console.warn(`Specialty not found: ${specName}`);
      continue;
    }
    svcsData.push({
      name,
      price,
      duration,
      specialtyId: spec.id,
      isAvailableOnline: type === 'Online/Offline' || type === 'Online',
      isAvailableOffline: type === 'Online/Offline' || type === 'Offline',
      targetGender: targetGender ? Gender[targetGender as keyof typeof Gender] : null,
    });
  }
  await prisma.service.createMany({ data: svcsData });
  console.log(`✅ Created ${svcsData.length} services from data.txt`);
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
  // - Patients (5000) with random createdAt from 01/01/2025 to now
  const patientStartDate = new Date('2025-01-01T00:00:00');
  for (let i = 1; i <= 5000; i++) {
    allUsersData.push({
      email: `user${i}@sepolia.vn`,
      password: pass,
      role: 'PATIENT',
      status: 'ACTIVE',
      createdAt: faker.date.between({ from: patientStartDate, to: TODAY }),
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

  // 4b. Receptionist Profiles (with avatar)
  const clinicDistrictNames = ['Hoàn Kiếm', 'Cầu Giấy', 'Đống Đa', 'Ba Đình', 'Hà Đông'];
  for (let i = 0; i < 5; i++) {
    await prisma.receptionistProfile.create({
      data: {
        userId: dbReceptionistUsers[i].id,
        firstName: clinicDistrictNames[i],
        lastName: 'Sepolia',
        clinicId: clinics[i].id,
        gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
        avatar: faker.image.avatar(),
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
