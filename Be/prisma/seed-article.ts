import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi';

const prisma = new PrismaClient();

async function seedArticles() {
  console.log('🌱 Seeding articles...');

  try {
    // Xóa dữ liệu cũ trước khi tạo mới
    console.log('🗑️ Xóa dữ liệu Article cũ...');
    await prisma.articleTag.deleteMany({});
    await prisma.article.deleteMany({});
    console.log('✅ Đã xóa dữ liệu Article cũ');

    // Lấy admin đầu tiên để làm tác giả
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { adminProfile: true }
    });

    if (!admin) {
      console.log('❌ No admin found. Please create an admin first.');
      return;
    }

    // Tạo tags cho bài viết
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'tim-mach' },
        update: { name: 'Tim mạch', usageCount: { increment: 1 } },
        create: {
          name: 'Tim mạch',
          slug: 'tim-mach',
          description: 'Các bài viết về bệnh tim mạch',
          usageCount: 1
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'tieu-duong' },
        update: { name: 'Tiểu đường', usageCount: { increment: 1 } },
        create: {
          name: 'Tiểu đường',
          slug: 'tieu-duong',
          description: 'Các bài viết về bệnh tiểu đường',
          usageCount: 1
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'ho-hap' },
        update: { name: 'Hô hấp', usageCount: { increment: 1 } },
        create: {
          name: 'Hô hấp',
          slug: 'ho-hap',
          description: 'Các bài viết về bệnh hô hấp',
          usageCount: 1
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'tieu-hoa' },
        update: { name: 'Tiêu hóa', usageCount: { increment: 1 } },
        create: {
          name: 'Tiêu hóa',
          slug: 'tieu-hoa',
          description: 'Các bài viết về bệnh tiêu hóa',
          usageCount: 1
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'tam-than' },
        update: { name: 'Tâm thần', usageCount: { increment: 1 } },
        create: {
          name: 'Tâm thần',
          slug: 'tam-than',
          description: 'Các bài viết về sức khỏe tâm thần',
          usageCount: 1
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'thong-bao' },
        update: { name: 'Thông báo', usageCount: { increment: 1 } },
        create: {
          name: 'Thông báo',
          slug: 'thong-bao',
          description: 'Các thông báo từ hệ thống',
          usageCount: 1
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'suc-khoe' },
        update: { name: 'Sức khỏe', usageCount: { increment: 1 } },
        create: {
          name: 'Sức khỏe',
          slug: 'suc-khoe',
          description: 'Các bài viết về sức khỏe tổng quan',
          usageCount: 1
        }
      })
    ]);

    // Dữ liệu bài viết mẫu
    const articlesData = [
      {
        title: 'Sepolia Health - Kỷ niệm 1 năm hành trình chăm sóc sức khỏe cộng đồng',
        slug: 'sepolia-health-ky-niem-1-nam-thanh-lap',
        excerpt: 'Cùng nhìn lại chặng đường 1 năm của Sepolia Health và những cam kết phát triển trong tương lai.',
        content: `
# Sepolia Health - Kỷ niệm 1 năm hành trình chăm sóc sức khỏe cộng đồng

Ngày 17 tháng 12 năm 2024, Sepolia Health chính thức tròn 1 năm tuổi! Đây là cột mốc đặc biệt quan trọng, đánh dấu một chặng đường đầy tự hào trong việc mang đến các dịch vụ y tế chất lượng cao cho cộng đồng.

## Những con số ấn tượng

- **Hơn 10,000 người dùng** tin tưởng sử dụng dịch vụ
- **Hơn 500 bác sĩ** chuyên môn cao đồng hành
- **Hơn 20,000 cuộc hẹn** được thực hiện thành công
- **Đánh giá 4.8/5** từ người dùng

## Những thành tựu nổi bật

### 1. Nền tảng công nghệ y tế hiện đại
Sepolia Health đã xây dựng thành công hệ thống đặt lịch khám trực tuyến, tư vấn từ xa, và quản lý hồ sơ sức khỏe điện tử, giúp người dân tiếp cận dịch vụ y tế một cách thuận tiện nhất.

### 2. Đội ngũ y bác sĩ chuyên môn cao
Chúng tự hào với đội ngũ hơn 500 bác sĩ từ các bệnh viện lớn, chuyên sâu đa dạng các lĩnh vực: tim mạch, nội tiết, hô hấp, tiêu hóa, tâm thần...

### 3. Dịch vụ chăm sóc sức khỏe toàn diện
Từ khám bệnh thông thường đến tư vấn chuyên khoa, Sepolia Health mang đến giải pháp chăm sóc sức khỏe toàn diện cho mọi gia đình.

## Lời tri ân

Sepolia Health xin gửi lời cảm ơn chân thành đến:
- Quý bệnh nhân đã tin tưởng và đồng hành
- Đội ngũ bác sĩ, nhân viên y tế đã tận tâm cống hiến
- Các đối tác đã hỗ trợ phát triển

## Hướng tới tương lai

Trong năm tới, Sepolia Health cam kết:
- Mở rộng thêm các chuyên khoa mới
- Nâng cấp nền tảng công nghệ
- Tăng cường dịch vụ chăm sóc sức khỏe từ xa
- Mở rộng mạng lưới đối tác y tế

Hãy cùng Sepolia Health xây dựng một cộng đồng khỏe mạnh và hạnh phúc!

*Sepolia Health - Đồng hành cùng sức khỏe của bạn!*
        `.trim(),
        contentMarkdown: null,
        isPublished: true,
        publishedAt: new Date('2024-12-17T08:00:00Z'),
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
        tagSlugs: ['thong-bao', 'suc-khoe']
      },
      {
        title: 'Biến chứng tiểu đường: Dấu hiệu nhận biết và cách phòng ngừa',
        slug: 'bien-chung-tieu-duong-dau-hieu-nhan-biet-va-cach-phong-ngua',
        excerpt: 'Tiểu đường có thể gây ra nhiều biến chứng nguy hiểm nếu không được kiểm soát tốt. Hãy tìm hiểu về các dấu hiệu và cách phòng ngừa.',
        content: `
# Biến chứng tiểu đường: Dấu hiệu nhận biết và cách phòng ngừa

Tiểu đường là bệnh lý mãn tính có thể gây ra nhiều biến chứng nghiêm trọng ảnh hưởng đến chất lượng cuộc sống. Việc nhận biết sớm các dấu hiệu biến chứng và áp dụng biện pháp phòng ngừa là vô cùng quan trọng.

## Các biến chứng phổ biến của tiểu đường

### 1. Biến chứng tim mạch
- **Dấu hiệu**: Đau ngực, khó thở, mệt mỏi
- **Nguyên nhân**: Mạch máu bị tổn thương do đường huyết cao
- **Phòng ngừa**: Kiểm soát đường huyết, huyết áp, mỡ máu

### 2. Bệnh thận tiểu đường
- **Dấu hiệu**: Sưng phù ở chân, tăng huyết áp, tiểu nhiều về đêm
- **Nguyên nhân**: Các mạch máu nhỏ trong thận bị tổn thương
- **Phòng ngừa**: Kiểm soát đường huyết, hạn chế muối, khám thận định kỳ

### 3. Tổn thương thần kinh
- **Dấu hiệu**: Tê bì chân tay, đau rát, mất cảm giác
- **Nguyên nhân**: Đường huyết cao gây tổn thương dây thần kinh
- **Phòng ngừa**: Kiểm soát đường huyết tốt, chăm sóc chân định kỳ

### 4. Bệnh mắt tiểu đường
- **Dấu hiệu**: Mờ mắt, nhìn đôi, nhìn thấy các đốm đen
- **Nguyên nhân**: Mạch máu võng mạc bị tổn thương
- **Phòng ngừa**: Khám mắt định kỳ 6 tháng/lần

## Cách phòng ngừa biến chứng

### 1. Kiểm soát đường huyết
- Theo dõi đường huyết thường xuyên
- Tuân thủ điều trị thuốc theo chỉ định
- Ăn uống hợp lý, vận động đều đặn

### 2. Thay đổi lối sống
- Bỏ thuốc lá, hạn chế rượu bia
- Duy trì cân nặng hợp lý
- Vận động ít nhất 30 phút mỗi ngày

### 3. Khám sức khỏe định kỳ
- Khám tổng quát 3-6 tháng/lần
- Kiểm tra các chỉ số: HbA1c, lipid, chức năng thận
- Khám chuyên khoa (tim, mắt, thần kinh) định kỳ

## Khi nào cần gặp bác sĩ?

Hãy gặp bác sĩ ngay khi có các dấu hiệu:
- Đau ngực, khó thở
- Mờ视力 đột ngột
- Tê bì, yếu liệt chi
- Vết loét không lành

Kiểm soát tốt đường huyết và thăm khám định kỳ là chìa khóa để phòng ngừa biến chứng tiểu đường.
        `.trim(),
        contentMarkdown: null,
        isPublished: true,
        publishedAt: new Date('2024-12-10T07:00:00Z'),
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
        tagSlugs: ['tieu-duong', 'tim-mach']
      },
      {
        title: 'Bệnh hen suyễn: Nguyên nhân, triệu chứng và phương pháp điều trị hiện đại',
        slug: 'benh-hen-suyen-nguyen-nhan-trieu-chung-va-phuong-phap-dieu-trien',
        excerpt: 'Hen suyễn là bệnh mãn tính phổ biến. Tìm hiểu về nguyên nhân, triệu chứng và các phương pháp điều trị hiệu quả.',
        content: `
# Bệnh hen suyễn: Nguyên nhân, triệu chứng và phương pháp điều trị hiện đại

Hen suyễn là bệnh viêm mạn tính của đường hô hấp, gây co thắt cơ trơn phế quản, dẫn đến khó thở tái phát. Bệnh có thể kiểm soát tốt nếu được chẩn đoán và điều trị đúng cách.

## Nguyên nhân gây bệnh hen suyễn

### 1. Yếu tố di truyền
- Có người thân bị hen suyễn
- Tiền sử dị ứng trong gia đình
- Các bệnh dị ứng khác (chàm, viêm mũi dị ứng)

### 2. Yếu tố môi trường
- Bụi bẩn, ô nhiễm không khí
- Lông động vật, phấn hoa
- Nấm mốc, bọ ve bụi
- Hóa chất, khói thuốc lá

### 3. Yếu tố gây khởi phát
- Nhiễm virus đường hô hấp
- Thay đổi thời tiết
- Tập thể thao gắng sức
- Stress, cảm xúc mạnh

## Triệu chứng điển hình

### 1. Khó thở
- Xảy ra khi gắng sức hoặc về đêm
- Cảm giác thắt ngực, khó thở ra
- Có thể nghe thấy tiếng thở khò khè

### 2. Ho khan
- Ho kéo dài, không đờm
- Tăng lên về đêm hoặc sớm hôm
- Không đáp ứng với thuốc ho thông thường

### 3. Tiếng thở khò khè
- Nghe rõ khi thở ra
- Tăng lên khi gắng sức
- Có thể nghe bằng tai thường khi nặng

### 4. Cảm giác nặng ngực
- Như có vật nặng đè lên ngực
- Khô khó thở sâu
- Đi kèm với lo âu, sợ hãi

## Phân độ bệnh hen suyễn

### Hen suyễn nhẹ间歇
- Triệu chứng < 2 lần/tuần
- Không ảnh hưởng hoạt động hàng ngày
- PEF ≥ 80% dự đoán

### Hen suyễn nhẹ kéo dài
- Triệu chứng > 2 lần/tuần nhưng < 1 lần/ngày
- Ảnh hưởng nhẹ hoạt động
- PEF 60-80% dự đoán

### Hen suyễn trung bình
- Triệu chứng hàng ngày
- Ảnh hưởng hoạt động
- PEF 60-80% dự đoán

### Hen suyễn nặng
- Triệu chứng liên tục
- Giới hạn hoạt động rõ rệt
- PEF < 60% dự đoán

## Phương pháp điều trị

### 1. Thuốc kiểm soát dài hạn
- **Corticoid hít**: Thuốc kiểm soát chính
- **Thuốc giãn cơ trơn kéo dài**: LABA, LAMA
- **Thuốc chống leukotriene**: Montelukast

### 2. Thuốc cắt cơn cấp tính
- **Salbutamol hít**: Thuốc cứu cơn nhanh
- **Ipratropium**: Giãn cơ trơn phế quản
- **Corticoid đường uống**: Trong đợt cấp

### 3. Điều trị miễn dịch
- **Immunotherapy**: Khi rõ tác nhân gây dị ứng
- **Thuốc sinh học**: Cho hen suyễn nặng khó kiểm soát

## Phòng ngừa đợt cấp

### 1. Tránh yếu tố kích thích
- Giữ môi trường sống sạch sẽ
- Tránh tiếp xúc với tác nhân dị ứng
- Không hút thuốc lá, tránh khói thuốc

### 2. Vắc xin phòng ngừa
- Vắc xin cúm hàng năm
- Vắc xin phế球菌 5 năm/lần

### 3. Theo dõi và quản lý
- Sử dụng máy đo PEF tại nhà
- Lập kế hoạch hành động khi có đợt cấp
- Tuân thủ điều trị đều đặn

Hen suyễn là bệnh có thể kiểm soát tốt. Bệnh nhân cần tuân thủ điều trị, tránh yếu tố kích thích và tái khám định kỳ để kiểm soát bệnh hiệu quả.
        `.trim(),
        contentMarkdown: null,
        isPublished: true,
        publishedAt: new Date('2024-12-05T08:30:00Z'),
        image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=400&fit=crop',
        tagSlugs: ['ho-hap', 'suc-khoe']
      },
      {
        title: 'Viêm loét dạ dày - tá tràng: Chẩn đoán và điều trị theo phác đồ mới nhất',
        slug: 'viem-loet-da-day-ta-trang-chan-doan-va-dieu-trien-moi-nhat',
        excerpt: 'Viêm loét dạ dày tá tràng là bệnh lý phổ biến. Cập nhật phác đồ chẩn đoán và điều trị theo khuyến cáo mới nhất.',
        content: `
# Viêm loét dạ dày - tá tràng: Chẩn đoán và điều trị theo phác đồ mới nhất

Viêm loét dạ dày - tá tràng là tình trạng niêm mạc dạ dày hoặc tá tràng bị tổn thương sâu, tạo thành ổ loét. Bệnh có thể gây ra các biến chứng nguy hiểm nếu không được điều trị đúng cách.

## Nguyên nhân chính gây viêm loét

### 1. Nhiễm Helicobacter pylori (HP)
- Chiếm 70-80% trường hợp loét tá tràng
- Chiếm 30-60% trường hợp loét dạ dày
- Là vi khuẩn gram âm sống trong niêm mạc dạ dày

### 2. Sử dụng thuốc NSAIDs
- Aspirin, ibuprofen, diclofenac...
- Giảm sản xuất prostaglandin bảo vệ niêm mạc
- Nguy cơ tăng khi dùng liều cao, kéo dài

### 3. Yếu tố nguy cơ khác
- Hút thuốc lá
- Uống rượu bia
- Stress, căng thẳng
- Tiền sử gia đình bị loét

## Triệu chứng lâm sàng

### 1. Đau vùng thượng vị
- Vị trí: vùng rốn và mỏm ức
- Đặc điểm: âm ỉ, nóng rát, cồn cào
- Thời điểm: đói, về đêm, sau ăn 1-2 giờ (loét dạ dày)

### 2. Các triệu chứng khác
- Ế nóng, khó tiêu
- Nôn, buồn nôn
- Chán ăn, sụt cân
- Đầy bụng, trướng khí

### 3. Triệu chứng khi có biến chứng
- Đau dữ dội, cứng thành bụng (thủng)
- Nôn ra máu, đi ngoài phân đen (xuất huyết)
- Nôn liên tục, bụng chướng (hẹp môn vị)

## Phương pháp chẩn đoán

### 1. Nội soi tiêu hóa
- **Gold standard** để chẩn đoán
- Nhìn trực tiếp ổ loét
- Sinh thiết kiểm tra HP và ung thư
- Đánh giá mức độ tổn thương

### 2. Xét nghiệm phát hiện HP
- **Urease test (CLO test)**: Nhanh, dễ thực hiện
- **Test thở ure C13**: Chính xác, không xâm lấn
- **Sinh thiết histopathology**: Tiêu chuẩn vàng
- **Test kháng nguyên HP trong phân**: Nhạy cảm cao

### 3. Các xét nghiệm khác
- Công thức máu (mất máu kéo dài)
- Sinh hóa gan, thận
- X-quang bụng (nghi ngờ thủng)

## Phác đồ điều trị theo khuyến cáo mới nhất

### 1. Loét do HP dương tính

#### Phác đồ 3 thuốc (14 ngày)
- PPI liều cao 2 lần/ngày
- Amoxicillin 1g 2 lần/ngày
- Clarithromycin 500mg 2 lần/ngày
- Hoặc Metronidazole 500mg 3 lần/ngày

#### Phác đồ 4 thuốc (14 ngày)
- PPI liều cao 2 lần/ngày
- Bismuth subsalicylate 120mg 4 lần/ngày
- Tetracycline 500mg 4 lần/ngày
- Metronidazole 500mg 3 lần/ngày

### 2. Loét không do HP

#### Dùng NSAIDs
- Ngưng thuốc NSAIDs nếu có thể
- PPI 8 tuần
- Chuyển sang paracetamol nếu cần giảm đau

#### Loét Stress
- PPI liều cao
- Duy trì cho đến khi ổn định

### 3. Điều trị duy trì
- PPI liều thấp trong 4-8 tuần
- Đánh giá lại bằng nội soi
- Tiếp tục nếu có yếu tố nguy cơ

## Theo dõi và tái đánh giá

### 1. Kiểm tra tiêu diệt HP
- Test thở ure C13 sau 4-8 tuần
- Nội soi sinh thiết nếu cần
- Chuyển sang test kháng thể nếu không có test khác

### 2. Nội soi tái đánh giá
- Loét dạ dày: Bắt buộc (loại trừ ung thư)
- Loét tá tràng: Nếu không hết triệu chứng
- Thời điểm: Sau 8-12 tuần điều trị

## Phòng ngừa tái phát

### 1. Thay đổi lối sống
- Ngưng hút thuốc, hạn chế rượu bia
- Ăn uống điều độ, tránh đồ chua cay
- Giảm stress, căng thẳng

### 2. Sử dụng thuốc hợp lý
- Tránh lạm dụng NSAIDs
- Sử dụng PPI khi phải dùng NSAIDs kéo dài
- Tuân thủ chỉ định của bác sĩ

### 3. Tái khám định kỳ
- 6 tháng/lần nếu có yếu tố nguy cơ
- Ngay khi có triệu chứng bất thường
- Nội soi nếu có chỉ định

Viêm loét dạ dày tá tràng có thể điều trị hiệu quả nếu được chẩn đoán sớm và điều trị đúng phác đồ.
        `.trim(),
        contentMarkdown: null,
        isPublished: true,
        publishedAt: new Date('2024-11-28T09:00:00Z'),
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
        tagSlugs: ['tieu-hoa', 'suc-khoe']
      },
      {
        title: 'Rối loạn lo âu lan tỏa: Dấu hiệu nhận biết và phương pháp điều trị',
        slug: 'roi-loan-lo-an-lan-toa-dau-hieu-va-phuong-phap-dieu-trien',
        excerpt: 'Rối loạn lo âu lan tỏa là bệnh lý tâm thần phổ biến. Cùng tìm hiểu về dấu hiệu và các phương pháp điều trị hiệu quả.',
        content: `
# Rối loạn lo âu lan tỏa: Dấu hiệu nhận biết và phương pháp điều trị

Rối loạn lo âu lan tỏa (GAD) là bệnh lý tâm thần đặc trưng bởi sự lo lắng quá mức, dai dẳng và không tương xứng với nguyên nhân gây ra. Bệnh ảnh hưởng nghiêm trọng đến chất lượng cuộc sống nếu không được điều trị kịp thời.

## Dấu hiệu nhận biết GAD

### 1. Lo lắng quá mức
- Lo lắng về nhiều sự kiện khác nhau
- Khó kiểm soát nỗi lo âu
- Kéo dài ít nhất 6 tháng
- Ảnh hưởng đến hoạt động hàng ngày

### 2. Các triệu chứng thể chất
- **Cơ**: Căng cơ, đau mỏi, run tay
- **Thần kinh**: Mệt mỏi, khó tập trung, khó ngủ
- **Tự chủ**: Tim đập nhanh, ra nhiều mồ hôi, chóng mặt
- **Hô hấp**: Khó thở, cảm giác thắt ngực, thở nông

### 3. Triệu chứng nhận thức
- Lo sợ thường xuyên về tương lai
- Nghĩ đến điều tồi tệ nhất có thể xảy ra
- Khánh kiệt trong việc ra quyết định
- Cảm giác bất lực, mất kiểm soát

## Nguyên nhân gây bệnh

### 1. Yếu tố sinh học
- Rối lo cân bằng neurotransmitter (GABA, serotonin)
- Hoạt động bất thường của hạch hạch nền
- Di truyền (có người thân bị GAD)

### 2. Yếu tố tâm lý
- Tính cách hướng nội, hoàn hảo
- Kinh nghiệm sang chấn trong quá khứ
- Thiếu kỹ năng đối phó với stress

### 3. Yếu tố môi trường
- Stress kéo dài trong công việc, cuộc sống
- Môi trường gia đình không ổn định
- Các sự kiện sống tiêu cực

## Chẩn đoán GAD

### 1. Tiêu chuẩn chẩn đoán DSM-5
- Lo lắng quá mức kéo dài ≥ 6 tháng
- Khó kiểm soát nỗi lo âu
- Ít nhất 3 triệu chứng thể chất
- Gây suy giảm chức năng xã hội, nghề nghiệp
- Không do tác nhân sinh lý hoặc chất

### 2. Thang điểm đánh giá
- **GAD-7**: Sàng lọc và theo dõi mức độ
- **Hamilton Anxiety Scale**: Đánh giá nặng
- **Beck Anxiety Inventory**: Tự đánh giá

### 3. Khám sức khỏe
- Loại trừ các bệnh lý nội tiết (thyroid)
- Kiểm tra tác dụng của thuốc
- Đánh giá sử dụng chất kích thích

## Phương pháp điều trị

### 1. Điều trị bằng thuốc

#### Thuốc chống trầm cảm
- **SSRIs**: Sertraline, Escitalopram, Paroxetine
- **SNRIs**: Venlafaxine, Duloxetine
- Hiệu quả sau 4-6 tuần, ít tác dụng phụ

#### Thuốc chống lo âu
- **Buspirone**: An toàn, không gây nghiện
- **Pregabalin**: Hiệu quả với triệu chứng thể chất
- **Hydroxyzine**: Không gây sedation nặng

#### Benzodiazepines (ngắn hạn)
- Alprazolam, Lorazepam
- Chỉ dùng trong đợt cấp (< 4 tuần)
- Nguy cơ lạm dụng và phụ thuộc

### 2. Trị liệu tâm lý

#### Trị liệu nhận thức hành vi (CBT)
- Nhận diện và thay đổi suy nghĩ tiêu cực
- Thực hành các kỹ thưc đối phó
- Liệu pháp phơi nhiễm graded exposure
- 12-20 buổi, hiệu quả kéo dài

#### Liệu pháp thư giãn
- Biofeedback
- Thiền chánh niệm (Mindfulness)
- Yoga, thái cực quyền
- Kỹ thuật thở sâu

#### Liệu pháp nhóm
- Chia sẻ kinh nghiệm
- Học hỏi từ người khác
- Giảm cảm giác cô lập

### 3. Thay đổi lối sống

#### Dinh dưỡng
- Hạn chế caffeine, rượu bia
- Tăng cường thực phẩm giàu omega-3
- Bổ sung vitamin B complex
- Giữ đường huyết ổn định

#### Vận động
- Tập thể dục đều đặn (30 phút/ngày)
- Các môn thể dục nhẹ nhàng: đi bộ, yoga
- Tránh tập quá sức gần giờ ngủ

#### Giấc ngủ
- Giữ giấc ngủ đều đặn (7-8 tiếng/đêm)
- Tạo thói quen trước khi ngủ
- Tránh dùng thiết bị điện tử
- Môi trường ngủ mát mẻ, yên tĩnh

## Theo dõi và tái đánh giá

### 1. Đánh giá đáp ứng điều trị
- Sử dụng thang điểm GAD-7 hàng tháng
- Đánh giá chức năng hàng ngày
- Theo dõi tác dụng phụ thuốc

### 2. Thời gian điều trị
- Tối thiểu 12 tháng sau khi ổn định
- Giảm liều từ từ trong 3-6 tháng
- Tiếp tục trị liệu tâm lý

### 3. Phòng ngừa tái phát
- Duy trì kỹ thuật đối phó đã học
- Xây dựng mạng lưới hỗ trợ
- Kiểm tra sức khỏe định kỳ

GAD là bệnh có thể điều trị hiệu quả. Kết hợp điều trị thuốc và trị liệu tâm lý cho kết quả tốt nhất.
        `.trim(),
        contentMarkdown: null,
        isPublished: true,
        publishedAt: new Date('2024-11-20T10:00:00Z'),
        image: 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=800&h=400&fit=crop',
        tagSlugs: ['tam-than', 'suc-khoe']
      }
    ];

    // Tạo bài viết và gán tags
    for (const articleData of articlesData) {
      const { tagSlugs, ...articleFields } = articleData;

      const article = await prisma.article.create({
        data: {
          ...articleFields,
          authorId: admin.id
        }
      });

      // Gán tags cho bài viết
      const articleTags = await Promise.all(
        tagSlugs.map(async (slug) => {
          const tag = tags.find(t => t.slug === slug);
          if (tag) {
            return prisma.articleTag.create({
              data: {
                articleId: article.id,
                tagId: tag.id
              }
            });
          }
        })
      );

      console.log(`✅ Created article: ${article.title}`);
    }

    console.log(`🎉 Successfully seeded ${articlesData.length} articles!`);

  } catch (error) {
    console.error('❌ Error seeding articles:', error);
    throw error;
  }
}

async function main() {
  await seedArticles();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });