import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  GetAdminQuestionsQueryDto,
  AdminQuestionDetailResponseDto,
  AdminQuestionsListResponseDto,
  AdminAnswerResponseDto,
} from './admin-qna.dto';
import { QnaService } from '@/module/qna/qna.service';

@Injectable()
export class AdminQnaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qnaService: QnaService,
  ) {}

  async getQuestions(
    query: GetAdminQuestionsQueryDto,
  ): Promise<AdminQuestionsListResponseDto> {
    const { page, limit, search, tagIds, authorId, includeDeleted } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              doctorProfile: true,
              receptionistProfile: true,
              adminProfile: true,
              patientProfiles: { take: 1 },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              answers: true,
            },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    const formattedQuestions = await Promise.all(
      questions.map(async (q) => {
        const { user, profile } = await this.qnaService.getUserProfile(
          q.authorId,
          q.author.role,
        );

        return {
          id: q.id,
          title: q.title,
          content: q.content,
          views: q.views,
          upvotes: q.upvotes,
          downvotes: q.downvotes,
          voteScore: q.upvotes - q.downvotes,
          answerCount: q._count.answers,
          hasBestAnswer: q.bestAnswerId !== null,
          author: this.qnaService.getAuthorInfo(user, profile),
          tags: q.tags.map((qt) => ({
            id: qt.tag.id,
            name: qt.tag.name,
            slug: qt.tag.slug,
          })),
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        };
      }),
    );

    return {
      questions: formattedQuestions,
      total,
      page,
      limit,
    };
  }

  async getQuestionById(id: number): Promise<AdminQuestionDetailResponseDto> {
    return this.qnaService.getQuestionById(id);
  }

  async deleteQuestion(id: number): Promise<{ message: string }> {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    // Hard delete for admin
    await this.prisma.question.delete({
      where: { id },
    });

    // Decrement tag usage counts
    const questionTags = await this.prisma.questionTag.findMany({
      where: { questionId: id },
    });

    if (questionTags.length > 0) {
      const tagIds = questionTags.map((qt) => qt.tagId);
      await this.prisma.tag.updateMany({
        where: { id: { in: tagIds } },
        data: {
          usageCount: { decrement: 1 },
        },
      });
    }

    return { message: 'Xóa câu hỏi thành công' };
  }

  async getAnswerById(id: number): Promise<AdminAnswerResponseDto> {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
      include: {
        author: {
          include: {
            doctorProfile: true,
            receptionistProfile: true,
            adminProfile: true,
            patientProfiles: { take: 1 },
          },
        },
      },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    const { user, profile } = await this.qnaService.getUserProfile(
      answer.authorId,
      answer.author.role,
    );

    return {
      id: answer.id,
      content: answer.content,
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      voteScore: answer.upvotes - answer.downvotes,
      isBestAnswer: answer.isBestAnswer,
      author: this.qnaService.getAuthorInfo(user, profile),
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    };
  }

  async deleteAnswer(id: number): Promise<{ message: string }> {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    // If this is the best answer, unset it
    const question = await this.prisma.question.findFirst({
      where: { bestAnswerId: id },
    });

    if (question) {
      await this.prisma.question.update({
        where: { id: question.id },
        data: { bestAnswerId: null },
      });
    }

    // Hard delete for admin
    await this.prisma.answer.delete({
      where: { id },
    });

    return { message: 'Xóa câu trả lời thành công' };
  }
}
