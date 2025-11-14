import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { VoteType, Role } from '@prisma/client';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateAnswerDto,
  UpdateAnswerDto,
  VoteDto,
  SetBestAnswerDto,
  GetQuestionsQueryDto,
  QuestionResponseDto,
  QuestionDetailResponseDto,
  QuestionsListResponseDto,
  AnswerResponseDto,
  AnswersListResponseDto,
  CreateQuestionResponseDto,
  UpdateQuestionResponseDto,
  CreateAnswerResponseDto,
  UpdateAnswerResponseDto,
  TagResponseDto,
  TagsListResponseDto,
  EditHistoryItemDto,
} from './qna.dto';

@Injectable()
export class QnaService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== HELPER METHODS ==========

  getAuthorInfo(user: any, profile: any) {
    if (!user) {
      return {
        id: 0,
        fullName: 'Unknown',
        role: 'UNKNOWN',
        avatar: undefined,
      };
    }
    return {
      id: user.id,
      fullName: profile
        ? `${profile.firstName} ${profile.lastName}`
        : user.email,
      role: user.role,
      avatar: profile?.avatar || undefined,
    };
  }

  async getUserProfile(userId: number, role: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: role === Role.DOCTOR,
        receptionistProfile: role === Role.RECEPTIONIST,
        adminProfile: role === Role.ADMIN,
        patientProfiles: role === Role.PATIENT ? { take: 1 } : false,
      },
    });

    if (!user) {
      return { user: null, profile: null };
    }

    let profile: any = null;
    if (role === Role.DOCTOR) profile = user.doctorProfile;
    else if (role === Role.RECEPTIONIST) profile = user.receptionistProfile;
    else if (role === Role.ADMIN) profile = user.adminProfile;
    else if (role === Role.PATIENT && user.patientProfiles.length > 0)
      profile = user.patientProfiles[0];

    return { user, profile };
  }

  private async findOrCreateTags(tagIds: number[]): Promise<number[]> {
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    const foundIds = tags.map((t) => t.id);
    const missingIds = tagIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Không tìm thấy tags với IDs: ${missingIds.join(', ')}`,
      );
    }

    return foundIds;
  }

  private async createSlug(name: string): Promise<string> {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ========== QUESTION METHODS ==========

  async createQuestion(
    createQuestionDto: CreateQuestionDto,
    userId: number,
  ): Promise<CreateQuestionResponseDto> {
    const { title, content, tagIds } = createQuestionDto;

    // Validate tags
    const validTagIds = await this.findOrCreateTags(tagIds);

    // Create question
    const question = await this.prisma.question.create({
      data: {
        title,
        content,
        authorId: userId,
        tags: {
          create: validTagIds.map((tagId) => ({
            tagId,
          })),
        },
      },
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
    });

    // Update tag usage counts
    await this.prisma.tag.updateMany({
      where: { id: { in: validTagIds } },
      data: {
        usageCount: { increment: 1 },
      },
    });

    const { user, profile } = await this.getUserProfile(
      question.authorId,
      question.author.role,
    );

    return {
      id: question.id,
      title: question.title,
      content: question.content,
      views: question.views,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      voteScore: question.upvotes - question.downvotes,
      answerCount: question._count.answers,
      hasBestAnswer: question.bestAnswerId !== null,
      author: this.getAuthorInfo(user, profile),
      tags: question.tags.map((qt) => ({
        id: qt.tag.id,
        name: qt.tag.name,
        slug: qt.tag.slug,
      })),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  async getQuestions(
    query: GetQuestionsQueryDto,
  ): Promise<QuestionsListResponseDto> {
    const { page, limit, search, tagIds, sortBy } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

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

    let orderBy: any = {};
    switch (sortBy) {
      case 'mostVoted':
        orderBy = [
          { upvotes: 'desc' },
          { downvotes: 'asc' },
          { createdAt: 'desc' },
        ];
        break;
      case 'mostAnswered':
        orderBy = [
          {
            answers: {
              _count: 'desc',
            },
          },
          { createdAt: 'desc' },
        ];
        break;
      case 'unanswered':
        where.answers = {
          none: {},
        };
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
        const { user, profile } = await this.getUserProfile(
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
          author: this.getAuthorInfo(user, profile),
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

  async getQuestionById(
    id: number,
    userId?: number,
  ): Promise<QuestionDetailResponseDto> {
    const question = await this.prisma.question.findUnique({
      where: { id, deletedAt: null },
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
        answers: {
          where: { deletedAt: null },
          include: {
            author: {
              include: {
                doctorProfile: true,
                receptionistProfile: true,
                adminProfile: true,
                patientProfiles: { take: 1 },
              },
            },
            votes: true,
          },
          orderBy: [
            { isBestAnswer: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'asc' },
          ],
        },
        votes: true,
        editHistory: {
          include: {
            editor: {
              include: {
                doctorProfile: true,
                receptionistProfile: true,
                adminProfile: true,
                patientProfiles: { take: 1 },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    // Increment views (only if not the author)
    if (userId && userId !== question.authorId) {
      await this.prisma.question.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      question.views += 1;
    }

    const { user, profile } = await this.getUserProfile(
      question.authorId,
      question.author.role,
    );

    const answers = await Promise.all(
      question.answers.map(async (answer) => {
        const { user: answerUser, profile: answerProfile } =
          await this.getUserProfile(answer.authorId, answer.author.role);

        return {
          id: answer.id,
          content: answer.content,
          upvotes: answer.upvotes,
          downvotes: answer.downvotes,
          voteScore: answer.upvotes - answer.downvotes,
          isBestAnswer: answer.isBestAnswer,
          author: this.getAuthorInfo(answerUser, answerProfile),
          createdAt: answer.createdAt,
          updatedAt: answer.updatedAt,
        };
      }),
    );

    const editHistory = await Promise.all(
      question.editHistory.map(async (history) => {
        const { user: editorUser, profile: editorProfile } =
          await this.getUserProfile(history.editedBy, history.editor.role);

        return {
          id: history.id,
          oldTitle: history.oldTitle || undefined,
          newTitle: history.newTitle || undefined,
          oldContent: history.oldContent || undefined,
          newContent: history.newContent || undefined,
          reason: history.reason || undefined,
          editor: this.getAuthorInfo(editorUser, editorProfile),
          createdAt: history.createdAt,
        };
      }),
    );

    return {
      id: question.id,
      title: question.title,
      content: question.content,
      views: question.views,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      voteScore: question.upvotes - question.downvotes,
      answerCount: question.answers.length,
      hasBestAnswer: question.bestAnswerId !== null,
      author: this.getAuthorInfo(user, profile),
      tags: question.tags.map((qt) => ({
        id: qt.tag.id,
        name: qt.tag.name,
        slug: qt.tag.slug,
      })),
      answers,
      editHistory,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  async updateQuestion(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    userId: number,
  ): Promise<UpdateQuestionResponseDto> {
    const question = await this.prisma.question.findUnique({
      where: { id, deletedAt: null },
      include: {
        tags: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    // Check permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (question.authorId !== userId && user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa câu hỏi này');
    }

    const { title, content, tagIds, reason } = updateQuestionDto;

    // Prepare update data
    const updateData: any = {};
    const historyData: any = {};

    if (title !== undefined && title !== question.title) {
      updateData.title = title;
      historyData.oldTitle = question.title;
      historyData.newTitle = title;
    }

    if (content !== undefined && content !== question.content) {
      updateData.content = content;
      historyData.oldContent = question.content;
      historyData.newContent = content;
    }

    if (tagIds !== undefined) {
      const validTagIds = await this.findOrCreateTags(tagIds);

      // Remove old tags
      await this.prisma.questionTag.deleteMany({
        where: { questionId: id },
      });

      // Decrement old tag usage counts
      const oldTagIds = question.tags.map((qt) => qt.tagId);
      await this.prisma.tag.updateMany({
        where: { id: { in: oldTagIds } },
        data: {
          usageCount: { decrement: 1 },
        },
      });

      // Add new tags
      updateData.tags = {
        create: validTagIds.map((tagId) => ({
          tagId,
        })),
      };

      // Increment new tag usage counts
      await this.prisma.tag.updateMany({
        where: { id: { in: validTagIds } },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      // Create edit history
      if (Object.keys(historyData).length > 0) {
        historyData.questionId = id;
        historyData.editedBy = userId;
        historyData.reason = reason || null;

        await this.prisma.questionEditHistory.create({
          data: historyData,
        });
      }

      await this.prisma.question.update({
        where: { id },
        data: updateData,
      });
    }

    return this.getQuestionById(id);
  }

  async deleteQuestion(
    id: number,
    userId: number,
  ): Promise<{ message: string }> {
    const question = await this.prisma.question.findUnique({
      where: { id, deletedAt: null },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    // Check permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (question.authorId !== userId && user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xóa câu hỏi này');
    }

    // Soft delete
    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
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

  async voteQuestion(
    id: number,
    voteDto: VoteDto,
    userId: number,
  ): Promise<{ message: string; upvotes: number; downvotes: number }> {
    const question = await this.prisma.question.findUnique({
      where: { id, deletedAt: null },
      include: {
        votes: {
          where: { userId },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const existingVote = question.votes[0];

    if (existingVote) {
      if (existingVote.voteType === voteDto.voteType) {
        // Remove vote if clicking same vote type
        await this.prisma.questionVote.delete({
          where: { id: existingVote.id },
        });

        await this.prisma.question.update({
          where: { id },
          data: {
            upvotes:
              voteDto.voteType === VoteType.UP
                ? { decrement: 1 }
                : question.upvotes,
            downvotes:
              voteDto.voteType === VoteType.DOWN
                ? { decrement: 1 }
                : question.downvotes,
          },
        });
      } else {
        // Change vote type
        await this.prisma.questionVote.update({
          where: { id: existingVote.id },
          data: { voteType: voteDto.voteType },
        });

        await this.prisma.question.update({
          where: { id },
          data: {
            upvotes:
              voteDto.voteType === VoteType.UP
                ? { increment: 1 }
                : { decrement: 1 },
            downvotes:
              voteDto.voteType === VoteType.DOWN
                ? { increment: 1 }
                : { decrement: 1 },
          },
        });
      }
    } else {
      // Create new vote
      await this.prisma.questionVote.create({
        data: {
          questionId: id,
          userId,
          voteType: voteDto.voteType,
        },
      });

      await this.prisma.question.update({
        where: { id },
        data: {
          upvotes:
            voteDto.voteType === VoteType.UP
              ? { increment: 1 }
              : question.upvotes,
          downvotes:
            voteDto.voteType === VoteType.DOWN
              ? { increment: 1 }
              : question.downvotes,
        },
      });
    }

    const updated = await this.prisma.question.findUnique({
      where: { id },
      select: { upvotes: true, downvotes: true },
    });

    return {
      message: 'Vote thành công',
      upvotes: updated!.upvotes,
      downvotes: updated!.downvotes,
    };
  }

  async setBestAnswer(
    questionId: number,
    setBestAnswerDto: SetBestAnswerDto,
    userId: number,
  ): Promise<{ message: string }> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId, deletedAt: null },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    if (question.authorId !== userId) {
      throw new ForbiddenException(
        'Chỉ người đặt câu hỏi mới có thể chọn best answer',
      );
    }

    const answer = await this.prisma.answer.findUnique({
      where: { id: setBestAnswerDto.answerId, deletedAt: null },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    if (answer.questionId !== questionId) {
      throw new BadRequestException('Câu trả lời không thuộc về câu hỏi này');
    }

    // Unset previous best answer if exists
    if (question.bestAnswerId) {
      await this.prisma.answer.update({
        where: { id: question.bestAnswerId },
        data: { isBestAnswer: false },
      });
    }

    // Set new best answer
    await Promise.all([
      this.prisma.answer.update({
        where: { id: setBestAnswerDto.answerId },
        data: { isBestAnswer: true },
      }),
      this.prisma.question.update({
        where: { id: questionId },
        data: { bestAnswerId: setBestAnswerDto.answerId },
      }),
    ]);

    return { message: 'Đã chọn best answer thành công' };
  }

  // ========== ANSWER METHODS ==========

  async createAnswer(
    questionId: number,
    createAnswerDto: CreateAnswerDto,
    userId: number,
  ): Promise<CreateAnswerResponseDto> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId, deletedAt: null },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const answer = await this.prisma.answer.create({
      data: {
        content: createAnswerDto.content,
        questionId,
        authorId: userId,
      },
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

    const { user, profile } = await this.getUserProfile(
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
      author: this.getAuthorInfo(user, profile),
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    };
  }

  async getAnswers(questionId: number): Promise<AnswersListResponseDto> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId, deletedAt: null },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const answers = await this.prisma.answer.findMany({
      where: {
        questionId,
        deletedAt: null,
      },
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
      orderBy: [
        { isBestAnswer: 'desc' },
        { upvotes: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    const formattedAnswers = await Promise.all(
      answers.map(async (answer) => {
        const { user, profile } = await this.getUserProfile(
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
          author: this.getAuthorInfo(user, profile),
          createdAt: answer.createdAt,
          updatedAt: answer.updatedAt,
        };
      }),
    );

    return {
      answers: formattedAnswers,
      total: formattedAnswers.length,
    };
  }

  async updateAnswer(
    id: number,
    updateAnswerDto: UpdateAnswerDto,
    userId: number,
  ): Promise<UpdateAnswerResponseDto> {
    const answer = await this.prisma.answer.findUnique({
      where: { id, deletedAt: null },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    // Check permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (answer.authorId !== userId && user?.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa câu trả lời này',
      );
    }

    const { content, reason } = updateAnswerDto;

    if (content !== undefined && content !== answer.content) {
      // Create edit history
      await this.prisma.answerEditHistory.create({
        data: {
          answerId: id,
          editedBy: userId,
          oldContent: answer.content,
          newContent: content,
          reason: reason || null,
        },
      });

      await this.prisma.answer.update({
        where: { id },
        data: { content },
      });
    }

    const updated = await this.prisma.answer.findUnique({
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

    const { user: answerUser, profile: answerProfile } =
      await this.getUserProfile(updated!.authorId, updated!.author.role);

    return {
      id: updated!.id,
      content: updated!.content,
      upvotes: updated!.upvotes,
      downvotes: updated!.downvotes,
      voteScore: updated!.upvotes - updated!.downvotes,
      isBestAnswer: updated!.isBestAnswer,
      author: this.getAuthorInfo(answerUser, answerProfile),
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    };
  }

  async deleteAnswer(id: number, userId: number): Promise<{ message: string }> {
    const answer = await this.prisma.answer.findUnique({
      where: { id, deletedAt: null },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    // Check permission
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (answer.authorId !== userId && user?.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xóa câu trả lời này');
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

    // Soft delete
    await this.prisma.answer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Xóa câu trả lời thành công' };
  }

  async voteAnswer(
    id: number,
    voteDto: VoteDto,
    userId: number,
  ): Promise<{ message: string; upvotes: number; downvotes: number }> {
    const answer = await this.prisma.answer.findUnique({
      where: { id, deletedAt: null },
      include: {
        votes: {
          where: { userId },
        },
      },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    const existingVote = answer.votes[0];

    if (existingVote) {
      if (existingVote.voteType === voteDto.voteType) {
        // Remove vote
        await this.prisma.answerVote.delete({
          where: { id: existingVote.id },
        });

        await this.prisma.answer.update({
          where: { id },
          data: {
            upvotes:
              voteDto.voteType === VoteType.UP
                ? { decrement: 1 }
                : answer.upvotes,
            downvotes:
              voteDto.voteType === VoteType.DOWN
                ? { decrement: 1 }
                : answer.downvotes,
          },
        });
      } else {
        // Change vote type
        await this.prisma.answerVote.update({
          where: { id: existingVote.id },
          data: { voteType: voteDto.voteType },
        });

        await this.prisma.answer.update({
          where: { id },
          data: {
            upvotes:
              voteDto.voteType === VoteType.UP
                ? { increment: 1 }
                : { decrement: 1 },
            downvotes:
              voteDto.voteType === VoteType.DOWN
                ? { increment: 1 }
                : { decrement: 1 },
          },
        });
      }
    } else {
      // Create new vote
      await this.prisma.answerVote.create({
        data: {
          answerId: id,
          userId,
          voteType: voteDto.voteType,
        },
      });

      await this.prisma.answer.update({
        where: { id },
        data: {
          upvotes:
            voteDto.voteType === VoteType.UP
              ? { increment: 1 }
              : answer.upvotes,
          downvotes:
            voteDto.voteType === VoteType.DOWN
              ? { increment: 1 }
              : answer.downvotes,
        },
      });
    }

    const updated = await this.prisma.answer.findUnique({
      where: { id },
      select: { upvotes: true, downvotes: true },
    });

    return {
      message: 'Vote thành công',
      upvotes: updated!.upvotes,
      downvotes: updated!.downvotes,
    };
  }

  // ========== TAG METHODS ==========

  async getTags(): Promise<TagsListResponseDto> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { usageCount: 'desc' },
    });

    return {
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description || undefined,
        usageCount: tag.usageCount,
      })),
    };
  }

  async getPopularTags(limit: number = 10): Promise<TagsListResponseDto> {
    const tags = await this.prisma.tag.findMany({
      take: limit,
      orderBy: { usageCount: 'desc' },
    });

    return {
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description || undefined,
        usageCount: tag.usageCount,
      })),
    };
  }

  // ========== EDIT HISTORY METHODS ==========

  async getQuestionEditHistory(
    questionId: number,
  ): Promise<EditHistoryItemDto[]> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId, deletedAt: null },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const history = await this.prisma.questionEditHistory.findMany({
      where: { questionId },
      include: {
        editor: {
          include: {
            doctorProfile: true,
            receptionistProfile: true,
            adminProfile: true,
            patientProfiles: { take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      history.map(async (h) => {
        const { user, profile } = await this.getUserProfile(
          h.editedBy,
          h.editor.role,
        );

        return {
          id: h.id,
          oldTitle: h.oldTitle || undefined,
          newTitle: h.newTitle || undefined,
          oldContent: h.oldContent || undefined,
          newContent: h.newContent || undefined,
          reason: h.reason || undefined,
          editor: this.getAuthorInfo(user, profile),
          createdAt: h.createdAt,
        };
      }),
    );
  }

  async getAnswerEditHistory(answerId: number): Promise<EditHistoryItemDto[]> {
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId, deletedAt: null },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    const history = await this.prisma.answerEditHistory.findMany({
      where: { answerId },
      include: {
        editor: {
          include: {
            doctorProfile: true,
            receptionistProfile: true,
            adminProfile: true,
            patientProfiles: { take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      history.map(async (h) => {
        const { user, profile } = await this.getUserProfile(
          h.editedBy,
          h.editor.role,
        );

        return {
          id: h.id,
          oldContent: h.oldContent || undefined,
          newContent: h.newContent || undefined,
          reason: h.reason || undefined,
          editor: this.getAuthorInfo(user, profile),
          createdAt: h.createdAt,
        };
      }),
    );
  }
}
