import { PrismaClient, Promotion } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU SEED VOUCHER DATA ---\n');

  // Lấy admin đầu tiên để làm createdBy
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.warn(
      '⚠️ Không có admin nào trong database. Vui lòng chạy seed chính trước.',
    );
    return;
  }

  // ---- BƯỚC 1: XÓA DỮ LIỆU CŨ (CHỈ VOUCHER DATA) ----
  console.log('--- Bước 1: Xóa dữ liệu voucher cũ...');
  await prisma.userPromotion.deleteMany({});
  await prisma.promotionDisplay.deleteMany({});
  await prisma.promotion.deleteMany({});
  console.log('✅ Đã xóa dữ liệu voucher cũ');

  // ---- BƯỚC 2: TẠO VOUCHERS ----
  console.log('\n--- Bước 2: Tạo Vouchers...');

  const now = new Date();
  const validFrom = new Date(now);
  validFrom.setDate(validFrom.getDate() - 7); // Bắt đầu từ 7 ngày trước

  const vouchersData = [
    {
      title: 'Giảm 20% cho lần khám đầu tiên',
      code: 'WELCOME20',
      description:
        'Áp dụng cho tất cả dịch vụ khám bệnh. Giảm tối đa 200.000 VNĐ.',
      discountPercent: 20,
      maxDiscountAmount: 200000,
      validFrom: validFrom,
      validTo: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 ngày sau
      createdBy: admin.id,
    },
    {
      title: 'Giảm 15% cho khám chuyên khoa',
      code: 'SPECIAL15',
      description:
        'Áp dụng cho các dịch vụ khám chuyên khoa. Giảm tối đa 300.000 VNĐ.',
      discountPercent: 15,
      maxDiscountAmount: 300000,
      validFrom: validFrom,
      validTo: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 ngày sau
      createdBy: admin.id,
    },
    {
      title: 'Giảm 10% cho khám định kỳ',
      code: 'CHECKUP10',
      description:
        'Áp dụng cho khám sức khỏe định kỳ. Giảm tối đa 150.000 VNĐ.',
      discountPercent: 10,
      maxDiscountAmount: 150000,
      validFrom: validFrom,
      validTo: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 ngày sau
      createdBy: admin.id,
    },
    {
      title: 'Giảm 25% cho khám online',
      code: 'ONLINE25',
      description:
        'Áp dụng cho các cuộc hẹn khám online. Giảm tối đa 250.000 VNĐ.',
      discountPercent: 25,
      maxDiscountAmount: 250000,
      validFrom: validFrom,
      validTo: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 ngày sau
      createdBy: admin.id,
    },
    {
      title: 'Giảm 30% cho tiêm chủng',
      code: 'VACCINE30',
      description:
        'Áp dụng cho các dịch vụ tiêm chủng. Giảm tối đa 400.000 VNĐ.',
      discountPercent: 30,
      maxDiscountAmount: 400000,
      validFrom: validFrom,
      validTo: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 ngày sau
      createdBy: admin.id,
    },
  ];

  const createdVouchers: Promotion[] = [];
  for (const voucherData of vouchersData) {
    try {
      const voucher = await prisma.promotion.create({
        data: voucherData,
      });
      createdVouchers.push(voucher);
      console.log(`   ✅ Đã tạo voucher: ${voucher.title} (${voucher.code})`);
    } catch (error) {
      console.error(`   ❌ Lỗi khi tạo voucher ${voucherData.code}:`, error);
    }
  }

  console.log(`✅ Đã tạo ${createdVouchers.length} vouchers`);

  // ---- BƯỚC 3: TẠO VOUCHER DISPLAYS ----
  console.log('\n--- Bước 3: Tạo Voucher Displays...');

  const displayConfigs = [
    {
      promotionId: createdVouchers[0].id, // WELCOME20 - voucher đầu tiên
      displayOrder: 1,
      isActive: true, // Hiển thị voucher này
      backgroundColor: JSON.stringify(['#FF6B6B', '#EE5A6F']), // Gradient đỏ
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#FF6B6B',
      buttonText: 'Nhận ngay',
      iconName: 'gift-outline',
      imageUrl: null,
      createdBy: admin.id,
    },
    {
      promotionId: createdVouchers[1].id, // SPECIAL15
      displayOrder: 2,
      isActive: false,
      backgroundColor: JSON.stringify(['#4ECDC4', '#44A08D']), // Gradient xanh lá
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#4ECDC4',
      buttonText: 'Áp dụng',
      iconName: 'star-outline',
      imageUrl: null,
      createdBy: admin.id,
    },
    {
      promotionId: createdVouchers[2].id, // CHECKUP10
      displayOrder: 3,
      isActive: false,
      backgroundColor: JSON.stringify(['#A8E6CF', '#88D8A3']), // Gradient xanh nhạt
      textColor: '#1F2937',
      buttonColor: '#1F2937',
      buttonTextColor: '#FFFFFF',
      buttonText: 'Sử dụng ngay',
      iconName: 'calendar-outline',
      imageUrl: null,
      createdBy: admin.id,
    },
    {
      promotionId: createdVouchers[3].id, // ONLINE25
      displayOrder: 4,
      isActive: false,
      backgroundColor: JSON.stringify(['#FFD93D', '#FFB347']), // Gradient vàng
      textColor: '#1F2937',
      buttonColor: '#1F2937',
      buttonTextColor: '#FFFFFF',
      buttonText: 'Nhận voucher',
      iconName: 'videocam-outline',
      imageUrl: null,
      createdBy: admin.id,
    },
    {
      promotionId: createdVouchers[4].id, // VACCINE30
      displayOrder: 5,
      isActive: false,
      backgroundColor: JSON.stringify(['#95E1D3', '#F38181']), // Gradient hồng xanh
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#F38181',
      buttonText: 'Lấy mã',
      iconName: 'medical-outline',
      imageUrl: null,
      createdBy: admin.id,
    },
  ];

  let displaysCreated = 0;
  for (const displayConfig of displayConfigs) {
    try {
      await prisma.promotionDisplay.create({
        data: displayConfig,
      });
      displaysCreated++;
      console.log(
        `   ✅ Đã tạo display cho voucher ID ${displayConfig.promotionId} (isActive: ${displayConfig.isActive})`,
      );
    } catch (error) {
      console.error(
        `   ❌ Lỗi khi tạo display cho voucher ID ${displayConfig.promotionId}:`,
        error,
      );
    }
  }

  console.log(`✅ Đã tạo ${displaysCreated} voucher displays`);

  // ---- SUMMARY ----
  console.log(
    `\n✅ HOÀN THÀNH! Đã tạo thành công:
     - ${createdVouchers.length} vouchers
     - ${displaysCreated} voucher displays
     - 1 voucher display đang được hiển thị (isActive: true)`,
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
