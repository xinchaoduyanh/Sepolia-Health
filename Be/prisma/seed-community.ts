import { PrismaClient, AppTermsType } from '@prisma/client';
import { fakerVI as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const NUMBER_OF_POSTS = 20; // 20 bài viết cộng đồng

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
  console.log('--- BẮT ĐẦU SEED COMMUNITY DATA ---\n');

  // ---- BƯỚC 1: XÓA DỮ LIỆU CŨ (CHỈ COMMUNITY DATA) ----
  console.log('--- Bước 1: Xóa dữ liệu community cũ...');
  await prisma.answerVote.deleteMany({});
  await prisma.questionVote.deleteMany({});
  await prisma.questionTag.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.appTerms.deleteMany({});
  console.log('✅ Đã xóa dữ liệu community cũ');

  // ---- BƯỚC 2: TẠO TAGS ----
  console.log('\n--- Bước 2: Tạo Tags...');
  await prisma.tag.createMany({
    data: tagsData,
  });
  console.log(`✅ Đã tạo ${tagsData.length} tags`);

  // Get created tags
  const tags = await prisma.tag.findMany();

  // ---- BƯỚC 3: TẠO QUESTIONS & ANSWERS ----
  console.log('\n--- Bước 3: Tạo Questions & Answers...');

  // Lấy một số user để làm tác giả
  const users = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    take: 50,
  });

  if (users.length === 0) {
    console.warn(
      '⚠️ Không có user nào trong database. Vui lòng chạy seed chính trước.',
    );
    return;
  }

  // Lấy một số bác sĩ để trả lời
  const doctorUsers = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    take: 20,
  });

  if (doctorUsers.length === 0) {
    console.warn(
      '⚠️ Không có bác sĩ nào trong database. Vui lòng chạy seed chính trước.',
    );
    return;
  }

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

      console.log(
        `   [${questionsCreated}/${NUMBER_OF_POSTS}] Đã tạo question: "${question.title.substring(0, 50)}..."`,
      );
    } catch {
      // Bỏ qua lỗi
    }
  }

  console.log(
    `✅ Đã tạo ${questionsCreated} questions, ${answersCreated} answers, ${votesCreated} votes`,
  );

  // ---- BƯỚC 4: TẠO FAQs ----
  console.log('\n--- Bước 4: Tạo FAQs...');
  await prisma.appTerms.createMany({
    data: faqsData,
  });
  console.log(`✅ Đã tạo ${faqsData.length} FAQs`);

  // ---- SUMMARY ----
  console.log(
    `\n✅ HOÀN THÀNH SEED COMMUNITY DATA!
     - ${tagsData.length} tags
     - ${questionsCreated} questions
     - ${answersCreated} answers
     - ${votesCreated} votes
     - ${faqsData.length} FAQs`,
  );
}

main()
  .catch((e) => {
    console.error('Lỗi nghiêm trọng trong quá trình seed community data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
