import { PrismaClient } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Sample articles data
const sampleArticles = [
  {
    title: "5 Mẹo Chăm Sóc Sức Khỏe Mùa Đông",
    excerpt: "Khám phá những cách đơn giản để bảo vệ sức khỏe của bạn trong những ngày lạnh giá.",
    content: `Với thời tiết lạnh giá, việc chăm sóc sức khỏe trở nên quan trọng hơn bao giờ hết. Dưới đây là 5 mẹo giúp bạn giữ khỏe mạnh mùa đông:

1. **Uống đủ nước**: Mặc dù không khát, cơ thể vẫn cần đủ nước để hoạt động tốt.

2. **Ăn uống cân bằng**: Tăng cường vitamin C từ cam, chanh, bưởi để tăng đề kháng.

3. **Vận động đều đặn**: Duy trì tập thể dục 30 phút mỗi ngày để tăng cường miễn dịch.

4. **Ngủ đủ giấc**: Giữ ấm cơ thể và ngủ 7-8 tiếng mỗi đêm.

5. **Giữ vệ sinh**: Rửa tay thường xuyên để tránh vi khuẩn gây bệnh.

Chúc bạn có một mùa đông khỏe mạnh!`,
    contentMarkdown: `Với thời tiết lạnh giá, việc chăm sóc sức khỏe trở nên quan trọng hơn bao giờ hết. Dưới đây là 5 mẹo giúp bạn giữ khỏe mạnh mùa đông:

1. **Uống đủ nước**: Mặc dù không khát, cơ thể vẫn cần đủ nước để hoạt động tốt.

2. **Ăn uống cân bằng**: Tăng cường vitamin C từ cam, chanh, bưởi để tăng đề kháng.

3. **Vận động đều đặn**: Duy trì tập thể dục 30 phút mỗi ngày để tăng cường miễn dịch.

4. **Ngủ đủ giấc**: Giữ ấm cơ thể và ngủ 7-8 tiếng mỗi đêm.

5. **Giữ vệ sinh**: Rửa tay thường xuyên để tránh vi khuẩn gây bệnh.

Chúc bạn có một mùa đông khỏe mạnh!`,
    isPublished: true,
    image: null,
  },
  {
    title: "Lợi Ích Của Việc Khám Sức Khỏe Định Kỳ",
    excerpt: "Tại sao việc khám sức khỏe định kỳ lại quan trọng đối với mỗi người?",
    content: `Khám sức khỏe định kỳ là một trong những cách tốt nhất để phòng ngừa bệnh tật và duy trì sức khỏe tốt.

**Những lợi ích chính:**

1. **Phát hiện sớm**: Nhiều bệnh lý nếu phát hiện sớm có thể điều trị hiệu quả hơn.

2. **Tiết kiệm chi phí**: Phòng bệnh hơn chữa bệnh, chi phí khám định kỳ thấp hơn nhiều so với điều trị bệnh nặng.

3. **An tâm**: Biết rằng sức khỏe của bạn đang trong tình trạng tốt giúp bạn yên tâm hơn.

4. **Lối sống lành mạnh**: Bác sĩ sẽ tư vấn để bạn cải thiện lối sống nếu cần.

**Tần suất khám nên:**
- Người trẻ: 1-2 năm/lần
- Người trung niên: 1 năm/lần
- Người cao tuổi: 2-3 lần/năm

Đừng chờ đến khi có triệu chứng mới đi khám!`,
    contentMarkdown: `Khám sức khỏe định kỳ là một trong những cách tốt nhất để phòng ngừa bệnh tật và duy trì sức khỏe tốt.

**Những lợi ích chính:**

1. **Phát hiện sớm**: Nhiều bệnh lý nếu phát hiện sớm có thể điều trị hiệu quả hơn.

2. **Tiết kiệm chi phí**: Phòng bệnh hơn chữa bệnh, chi phí khám định kỳ thấp hơn nhiều so với điều trị bệnh nặng.

3. **An tâm**: Biết rằng sức khỏe của bạn đang trong tình trạng tốt giúp bạn yên tâm hơn.

4. **Lối sống lành mạnh**: Bác sĩ sẽ tư vấn để bạn cải thiện lối sống nếu cần.

**Tần suất khám nên:**
- Người trẻ: 1-2 năm/lần
- Người trung niên: 1 năm/lần
- Người cao tuổi: 2-3 lần/năm

Đừng chờ đến khi có triệu chứng mới đi khám!`,
    isPublished: true,
    image: null,
  },
  {
    title: "Dinh Dưỡng Cho Bà Bầu",
    excerpt: "Hướng dẫn dinh dưỡng cần thiết cho mẹ và bé trong thai kỳ.",
    content: `Dinh dưỡng trong thai kỳ đóng vai trò quan trọng cho sự phát triển của thai nhi và sức khỏe của mẹ.

**Nhóm thực phẩm cần thiết:**

1. **Protein**: Thịt nạc, cá, trứng, đậu phụ
2. **Sắt**: Thịt bò, gan, lòng đỏ trứng, rau xanh đậm
3. **Canxi**: Sữa, phô mai, sữa chua, rau bina
4. **Axit folic**: Rau lá xanh, ngũ cốc, đậu
5. **Vitamin C**: Cam, chanh, dâu tây, kiwi

**Lưu ý quan trọng:**
- Uống đủ 2-3 lít nước mỗi ngày
- Tránh rượu, bia, thuốc lá
- Hạn chế đồ ăn nhanh, nhiều đường
- Ăn chín uống sôi

Hãy tham khảo ý kiến bác sĩ để có chế độ dinh dưỡng phù hợp nhất!`,
    contentMarkdown: `Dinh dưỡng trong thai kỳ đóng vai trò quan trọng cho sự phát triển của thai nhi và sức khỏe của mẹ.

**Nhóm thực phẩm cần thiết:**

1. **Protein**: Thịt nạc, cá, trứng, đậu phụ
2. **Sắt**: Thịt bò, gan, lòng đỏ trứng, rau xanh đậm
3. **Canxi**: Sữa, phô mai, sữa chua, rau bina
4. **Axit folic**: Rau lá xanh, ngũ cốc, đậu
5. **Vitamin C**: Cam, chanh, dâu tây, kiwi

**Lưu ý quan trọng:**
- Uống đủ 2-3 lít nước mỗi ngày
- Tránh rượu, bia, thuốc lá
- Hạn chế đồ ăn nhanh, nhiều đường
- Ăn chín uống sôi

Hãy tham khảo ý kiến bác sĩ để có chế độ dinh dưỡng phù hợp nhất!`,
    isPublished: true,
    image: null,
  },
  {
    title: "Triệu Chứng Covid-19 Mới Nhất",
    excerpt: "Cập nhật các triệu chứng Covid-19 và cách phòng tránh hiệu quả.",
    content: `Biến thể mới của Covid-19 có了一些 khác biệt về triệu chứng. Cần biết để phòng tránh và điều trị kịp thời.

**Triệu chứng phổ biến nhất:**
- Sốt hoặc ớn lạnh
- Ho khan
- Mệt mỏi
- Đau cơ
- Đau đầu
- Mất vị giác hoặc khứu giác
- Đau họng

**Triệu chứng ít phổ biến hơn:**
- Tiêu chảy
- Viêm kết mạc
- Phát ban

**Khi nào cần đi khám:**
- Khó thở
- Đau ngực dữ dội
- Lẫn lộn
- Không thể thức dậy

**Cách phòng tránh:**
- Đeo khẩu trang
- Rửa tay thường xuyên
- Giữ khoảng cách
- Tiêm vacxin đầy đủ

Hãy bảo vệ bản thân và cộng đồng!`,
    contentMarkdown: `Biến thể mới của Covid-19 có了一些 khác biệt về triệu chứng. Cần biết để phòng tránh và điều trị kịp thời.

**Triệu chứng phổ biến nhất:**
- Sốt hoặc ớn lạnh
- Ho khan
- Mệt mỏi
- Đau cơ
- Đau đầu
- Mất vị giác hoặc khứu giác
- Đau họng

**Triệu chứng ít phổ biến hơn:**
- Tiêu chảy
- Viêm kết mạc
- Phát ban

**Khi nào cần đi khám:**
- Khó thở
- Đau ngực dữ dội
- Lẫn lộn
- Không thể thức dậy

**Cách phòng tránh:**
- Đeo khẩu trang
- Rửa tay thường xuyên
- Giữ khoảng cách
- Tiêm vacxin đầy đủ

Hãy bảo vệ bản thân và cộng đồng!`,
    isPublished: true,
    image: null,
  },
  {
    title: "Y Tế Tế Hóa: Lựa Chọn Thông Minh",
    excerpt: "Tìm hiểu về y tế tế hóa và cách tiếp cận thông minh cho sức khỏe của bạn.",
    content: `Y tế tế hóa đang là xu hướng chăm sóc sức khỏe hiện đại, kết hợp công nghệ để tối ưu hóa trải nghiệm bệnh nhân.

**Y tế tế hóa là gì?**
- Sử dụng công nghệ số trong y tế
- Khám bệnh từ xa qua video
- Theo dõi sức khỏe qua ứng dụng
- Quản lý bệnh án điện tử

**Lợi ích:**
- Tiết kiệm thời gian và chi phí
- Dễ dàng tiếp cận bác sĩ
- Theo dõi sức khỏe liên tục
- Giảm nguy cơ lây nhiễm chéo

**Khi nào nên dùng:**
- Tái khám bệnh mạn tính
- Tư vấn sức khỏe ban đầu
- Theo dõi sau điều trị
- Khám tâm lý

**Lưu ý:**
- Không适用于 cấp cứu
- Cần kết nối internet tốt
- Chuẩn bị thông tin sức khỏe trước buổi khám

Y tế tế hóa không thay đổi hoàn toàn khám truyền thống, mà bổ trợ để chăm sóc sức khỏe hiệu quả hơn!`,
    contentMarkdown: `Y tế tế hóa đang là xu hướng chăm sóc sức khỏe hiện đại, kết hợp công nghệ để tối ưu hóa trải nghiệm bệnh nhân.

**Y tế tế hóa là gì?**
- Sử dụng công nghệ số trong y tế
- Khám bệnh từ xa qua video
- Theo dõi sức khỏe qua ứng dụng
- Quản lý bệnh án điện tử

**Lợi ích:**
- Tiết kiệm thời gian và chi phí
- Dễ dàng tiếp cận bác sĩ
- Theo dõi sức khỏe liên tục
- Giảm nguy cơ lây nhiễm chéo

**Khi nào nên dùng:**
- Tái khám bệnh mạn tính
- Tư vấn sức khỏe ban đầu
- Theo dõi sau điều trị
- Khám tâm lý

**Lưu ý:**
- Không适用于 cấp cứu
- Cần kết nối internet tốt
- Chuẩn bị thông tin sức khỏe trước buổi khám

Y tế tế hóa không thay đổi hoàn toàn khám truyền thống, mà bổ trợ để chăm sóc sức khỏe hiệu quả hơn!`,
    isPublished: true,
    image: null,
  },
  {
    title: "Bí Quyết Ngủ Sâu Giấc",
    excerpt: "Cải thiện chất lượng giấc ngủ với những phương pháp đơn giản hiệu quả.",
    content: `Giấc ngủ chất lượng ảnh hưởng trực tiếp đến sức khỏe tinh thần và thể chất. Dưới đây là bí quyết ngủ sâu hơn.

**Thói quen trước khi ngủ:**
- Điện thoại cách xa giường 1 tiếng
- Đọc sách hoặc nghe nhạc nhẹ
- Tắm nước ấm
- Tránh caffeine sau 2 giờ chiều

**Môi trường ngủ lý tưởng:**
- Phòng tối, yên tĩnh
- Nhiệt độ 18-22°C
- Nệm và gối phù hợp
- Không thiết bị điện tử

**Thực đơn hỗ trợ giấc ngủ:**
- Sữa ấm trước ngủ
- Chuối
- Hạnh nhân
- Trà hoa cúc
- Tránh bữa ăn nặng 2-3 tiếng trước ngủ

**Kỹ thuật thư giãn:**
- Hít thở sâu 4-7-8
- Meditation 10 phút
- Cơ thể quét逐一检查

Hãy thử những phương pháp này để có giấc ngủ ngon hơn!`,
    contentMarkdown: `Giấc ngủ chất lượng ảnh hưởng trực tiếp đến sức khỏe tinh thần và thể chất. Dưới đây là bí quyết ngủ sâu hơn.

**Thói quen trước khi ngủ:**
- Điện thoại cách xa giường 1 tiếng
- Đọc sách hoặc nghe nhạc nhẹ
- Tắm nước ấm
- Tránh caffeine sau 2 giờ chiều

**Môi trường ngủ lý tưởng:**
- Phòng tối, yên tĩnh
- Nhiệt độ 18-22°C
- Nệm và gối phù hợp
- Không thiết bị điện tử

**Thực đơn hỗ trợ giấc ngủ:**
- Sữa ấm trước ngủ
- Chuối
- Hạnh nhân
- Trà hoa cúc
- Tránh bữa ăn nặng 2-3 tiếng trước ngủ

**Kỹ thuật thư giãn:**
- Hít thở sâu 4-7-8
- Meditation 10 phút
- Cơ thể quét逐一检查

Hãy thử những phương pháp này để có giấc ngủ ngon hơn!`,
    isPublished: false, // Draft
    image: null,
  },
  {
    title: "Tác Dụng Của Việc Đi Bộ Hàng Ngày",
    excerpt: "Một hoạt động đơn giản nhưng mang lại nhiều lợi ích bất ngờ cho sức khỏe.",
    content: `Đi bộ là một trong những hình thức tập thể dục đơn giản nhất nhưng lại mang lại nhiều lợi ích tuyệt vời.

**Lợi ích sức khỏe:**
1. **Tim mạch**: Giảm nguy cơ bệnh tim, huyết áp cao
2. **Cân nặng**: Đốt cháy calo, kiểm soát weight
3. **Xương khớp**: Tăng mật độ xương, giảm loãng xương
4. **Tinh thần**: Giảm stress, cải thiện tâm trạng
5. **Tiểu đường**: Hồi tụ insulin tốt hơn

**Cách đi bộ hiệu quả:**
- Đi nhanh 30 phút/ngày, 5 ngày/tuần
- Giữ dáng thẳng, vai mở
- Đặt gót xuống trước, mũi sau
- Vung tay tự nhiên
- Hít thở đều đặn

**Thời điểm đi bộ tốt nhất:**
- Sáng sớm: Không khí trong lành
- Chiều tà: Giảm stress sau ngày làm việc
- Sau ăn 30 phút: Hỗ trợ tiêu hóa

Bắt đầu từ 10-15 phút mỗi ngày và tăng dần!`,
    contentMarkdown: `Đi bộ là một trong những hình thức tập thể dục đơn giản nhất nhưng lại mang lại nhiều lợi ích tuyệt vời.

**Lợi ích sức khỏe:**
1. **Tim mạch**: Giảm nguy cơ bệnh tim, huyết áp cao
2. **Cân nặng**: Đốt cháy calo, kiểm soát weight
3. **Xương khớp**: Tăng mật độ xương, giảm loãng xương
4. **Tinh thần**: Giảm stress, cải thiện tâm trạng
5. **Tiểu đường**: Hồi tụ insulin tốt hơn

**Cách đi bộ hiệu quả:**
- Đi nhanh 30 phút/ngày, 5 ngày/tuần
- Giữ dáng thẳng, vai mở
- Đặt gót xuống trước, mũi sau
- Vung tay tự nhiên
- Hít thở đều đặn

**Thời điểm đi bộ tốt nhất:**
- Sáng sớm: Không khí trong lành
- Chiều tà: Giảm stress sau ngày làm việc
- Sau ăn 30 phút: Hỗ trợ tiêu hóa

Bắt đầu từ 10-15 phút mỗi ngày và tăng dần!`,
    isPublished: true,
    image: null,
  },
];

async function seedArticles() {
  try {
    console.log('🌱 Seeding articles...');

    // Clean existing articles
    await prisma.article.deleteMany();
    console.log('✅ Deleted existing articles');

    // Create articles
    for (const articleData of sampleArticles) {
      const slug = articleData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const article = await prisma.article.create({
        data: {
          ...articleData,
          slug,
          publishedAt: articleData.isPublished ? new Date() : null,
          authorId: 1, // Assuming admin user with ID 1 exists
        },
      });

      console.log(`✅ Created article: ${article.title}`);
    }

    console.log('🎉 Articles seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding articles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedArticles();
}

export default seedArticles;