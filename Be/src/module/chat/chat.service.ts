import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '@/common/prisma/prisma.service';
import { appConfig } from '@/common/config';
import { ChatChannelDto, ClinicDto, UserSearchResultDto } from './chat.dto';
import crypto from 'crypto';
@Injectable()
export class ChatService implements OnModuleInit {
  private streamClient: StreamChat;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly streamChatConf: ConfigType<typeof appConfig>,
    private prisma: PrismaService,
  ) {
    this.streamClient = StreamChat.getInstance(
      this.streamChatConf.streamChatApiKey,
      this.streamChatConf.streamChatSecret,
    );
  }

  async onModuleInit() {
    await this.ensureSystemUserExists();
  }

  /**
   * Ensure system user exists for sending system messages
   */
  private async ensureSystemUserExists() {
    try {
      await this.streamClient.upsertUser({
        id: 'system',
        name: 'Sepolia Health',
        role: 'user',
      });
      this.logger.log('System user initialized successfully');
    } catch (error) {
      this.logger.warn(
        'Failed to initialize system user in Stream.io. The application will continue but chat features may not work properly.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Tạo channel chat mới giữa patient và receptionists của clinic
   */
  async createChatChannel(
    patientUserId: number,
    clinicId: number,
  ): Promise<{ channelId: string; clinicName: string; members: number }> {
    // 1. Lấy thông tin clinic và receptionists
    const [clinic, receptionists] = await Promise.all([
      this.prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true },
      }),
      this.prisma.receptionistProfile.findMany({
        where: { clinicId },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      }),
    ]);

    if (!clinic) {
      throw new Error(`Clinic ${clinicId} not found`);
    }

    // 2. Lấy thông tin patient
    const patient = await this.prisma.patientProfile.findFirst({
      where: {
        managerId: patientUserId,
        relationship: 'SELF',
      },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    // 3. Tạo channel ID theo format: patient_{userId}_VS_clinic_{clinicId}
    const channelId = `patient_${patientUserId}_VS_clinic_${clinicId}`;

    // 4. Upsert patient user vào Stream Chat
    await this.streamClient.upsertUser({
      id: patientUserId.toString(),
      name: patient
        ? `${patient.firstName} ${patient.lastName}`
        : `Patient ${patientUserId}`,
      role: 'user',
      image: patient?.avatar || undefined,
    });

    // 5. Upsert receptionist users vào Stream Chat
    const receptionistUserIds: string[] = [];
    for (const receptionist of receptionists) {
      const userData = {
        id: receptionist.userId.toString(),
        name: `${receptionist.firstName} ${receptionist.lastName}`,
        role: 'user',
        // Temporarily use test avatar if no avatar in DB
        image:
          receptionist.avatar ||
          'https://via.placeholder.com/100x100/10B981/FFFFFF?text=R',
      };

      await this.streamClient.upsertUser(userData);

      // Force update user to ensure avatar is set
      await this.streamClient.upsertUser({
        id: receptionist.userId.toString(),
        image:
          receptionist.avatar ||
          'https://via.placeholder.com/100x100/10B981/FFFFFF?text=R',
      });

      receptionistUserIds.push(receptionist.userId.toString());
    }

    // 6. Tạo channel trên Stream Chat
    const channel = this.streamClient.channel('messaging', channelId, {
      created_by_id: patientUserId.toString(),
    });

    await channel.create();
    await channel.update({ name: clinic.name } as any);

    // 7. Add members vào channel (bao gồm AI bot)
    const aiBotUserId = this.streamChatConf.aiBotUserId;

    // Đảm bảo AI bot user tồn tại
    await this.streamClient.upsertUser({
      id: aiBotUserId,
      name: 'Trợ lý AI Sepolia',
      role: 'user',
      image: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
    });

    // Add AI bot vào channel
    const allMemberIds = [patientUserId.toString(), aiBotUserId];
    if (receptionistUserIds.length > 0) {
      allMemberIds.push(...receptionistUserIds);
    }

    await channel.addMembers(allMemberIds);

    // 8. Gửi tin nhắn chào mừng từ AI bot
    const welcomeMessage =
      'Xin chào bạn! Tôi là Chatbot Assistants của Sepolia. Xin hỏi bạn cần giúp đỡ gì nhỉ?';

    await channel.sendMessage({
      text: welcomeMessage,
      user_id: aiBotUserId,
    });

    return {
      channelId,
      clinicName: clinic.name,
      members: 1 + receptionistUserIds.length + 1, // +1 for AI bot
    };
  }

  /**
   * Lấy danh sách channels của user
   */
  async getUserChannels(userId: number): Promise<ChatChannelDto[]> {
    const channels = await this.streamClient.queryChannels(
      {
        members: { $in: [userId.toString()] },
      },
      { last_message_at: -1 }, // Sort by last message
      {
        limit: 20,
        state: true,
      },
    );

    return channels.map((channel) => ({
      channelId: channel.id || '',
      name: channel.data?.created_by_id
        ? `Chat với ${channel.data.created_by_id}`
        : '',
      lastMessage: channel.state?.messages?.[channel.state.messages.length - 1],
      unreadCount: channel.state?.unreadCount || 0,
      lastMessageAt: channel.data?.last_message_at,
      members: channel.data?.members?.map((member) => member.user_id) || [],
    })) as ChatChannelDto[];
  }

  /**
   * Tạo Stream Chat token cho user
   */
  async generateStreamToken(userId: number): Promise<string> {
    // Lấy thông tin user từ database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        adminProfile: true,
        patientProfiles: {
          where: { relationship: 'SELF' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Lấy tên và avatar dựa trên role
    let name = `User ${userId}`;
    let avatar: string | undefined = undefined;

    if (user.doctorProfile) {
      name = `${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`;
      avatar = user.doctorProfile.avatar || undefined;
    } else if (user.receptionistProfile) {
      name = `${user.receptionistProfile.firstName} ${user.receptionistProfile.lastName}`;
      avatar = user.receptionistProfile.avatar || undefined;
    } else if (user.adminProfile) {
      name = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
      avatar = user.adminProfile.avatar || undefined;
    } else if (user.patientProfiles.length > 0) {
      const patientProfile = user.patientProfiles[0];
      name = `${patientProfile.firstName} ${patientProfile.lastName}`;
      avatar = patientProfile.avatar || undefined;
    }

    // Upsert user vào Stream Chat với thông tin đầy đủ
    await this.streamClient.upsertUser({
      id: userId.toString(),
      name,
      role: 'user',
      image: avatar,
    });

    return this.streamClient.createToken(userId.toString());
  }

  /**
   * Tạo Stream Video token cho user
   * Note: Stream Video sử dụng cùng cơ chế token với Stream Chat
   */
  generateVideoToken(userId: number): string {
    // Stream Video có thể dùng chung token generation với Chat
    // hoặc tạo riêng nếu cần các claims khác nhau

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    // Subtract 10 seconds from iat to account for clock skew between server and Stream's servers
    // This prevents "token used before issue at (iat)" errors
    const clockSkewBuffer = 10; // seconds
    const now = Math.floor(Date.now() / 1000);
    const issuedAt = now - clockSkewBuffer;

    const payload = {
      user_id: userId.toString(),
      iat: issuedAt,
      exp: now + 3600 * 24, // 24 hours
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );

    const signature = crypto
      .createHmac('sha256', this.streamChatConf.streamVideoSecret)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  /**
   * Lấy Stream Video API Key (cho frontend)
   */
  getVideoApiKey(): string {
    return this.streamChatConf.streamVideoApiKey;
  }

  /**
   * Lấy danh sách clinics active để patient chọn
   */
  async getAvailableClinics(): Promise<ClinicDto[]> {
    const clinics = await this.prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });

    // Transform null to undefined for Zod compatibility
    return clinics.map((clinic) => ({
      ...clinic,
      phone: clinic.phone ?? undefined,
    }));
  }

  /**
   * Tìm kiếm user theo email
   */
  async searchUserByEmail(email: string): Promise<UserSearchResultDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        adminProfile: true,
        patientProfiles: {
          where: { relationship: 'SELF' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với email: ${email}`);
    }

    // Lấy tên và avatar dựa trên role
    let name = `User ${user.id}`;
    let avatar: string | undefined = undefined;

    if (user.doctorProfile) {
      name = `${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`;
      avatar = user.doctorProfile.avatar || undefined;
    } else if (user.receptionistProfile) {
      name = `${user.receptionistProfile.firstName} ${user.receptionistProfile.lastName}`;
      avatar = user.receptionistProfile.avatar || undefined;
    } else if (user.adminProfile) {
      name = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
      avatar = user.adminProfile.avatar || undefined;
    } else if (user.patientProfiles.length > 0) {
      const patientProfile = user.patientProfiles[0];
      name = `${patientProfile.firstName} ${patientProfile.lastName}`;
      avatar = patientProfile.avatar || undefined;
    }

    return {
      id: user.id,
      email: user.email,
      name,
      avatar,
      role: user.role,
    };
  }

  /**
   * Tạo direct chat channel giữa 2 users
   */
  async createDirectChatChannel(
    currentUserId: number,
    targetUserEmail: string,
  ): Promise<{ channelId: string; targetUserName: string; members: number }> {
    // Lấy thông tin target user theo email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: targetUserEmail },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        adminProfile: true,
        patientProfiles: {
          where: { relationship: 'SELF' },
          take: 1,
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `Không tìm thấy user với email: ${targetUserEmail}`,
      );
    }

    const targetUserId = targetUser.id;

    // Không cho phép tự chat với chính mình
    if (currentUserId === targetUserId) {
      throw new Error('Không thể tạo cuộc trò chuyện với chính mình');
    }

    // Lấy thông tin current user
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        adminProfile: true,
        patientProfiles: {
          where: { relationship: 'SELF' },
          take: 1,
        },
      },
    });

    if (!currentUser) {
      throw new NotFoundException(
        `Không tìm thấy user với ID: ${currentUserId}`,
      );
    }

    // Lấy tên và avatar của target user
    let targetUserName = `User ${targetUserId}`;
    let targetAvatar: string | undefined = undefined;

    if (targetUser.doctorProfile) {
      targetUserName = `${targetUser.doctorProfile.firstName} ${targetUser.doctorProfile.lastName}`;
      targetAvatar = targetUser.doctorProfile.avatar || undefined;
    } else if (targetUser.receptionistProfile) {
      targetUserName = `${targetUser.receptionistProfile.firstName} ${targetUser.receptionistProfile.lastName}`;
      targetAvatar = targetUser.receptionistProfile.avatar || undefined;
    } else if (targetUser.adminProfile) {
      targetUserName = `${targetUser.adminProfile.firstName} ${targetUser.adminProfile.lastName}`;
      targetAvatar = targetUser.adminProfile.avatar || undefined;
    } else if (targetUser.patientProfiles.length > 0) {
      const patientProfile = targetUser.patientProfiles[0];
      targetUserName = `${patientProfile.firstName} ${patientProfile.lastName}`;
      targetAvatar = patientProfile.avatar || undefined;
    }

    // Lấy tên và avatar của current user
    let currentUserName = `User ${currentUserId}`;
    let currentAvatar: string | undefined = undefined;

    if (currentUser.doctorProfile) {
      currentUserName = `${currentUser.doctorProfile.firstName} ${currentUser.doctorProfile.lastName}`;
      currentAvatar = currentUser.doctorProfile.avatar || undefined;
    } else if (currentUser.receptionistProfile) {
      currentUserName = `${currentUser.receptionistProfile.firstName} ${currentUser.receptionistProfile.lastName}`;
      currentAvatar = currentUser.receptionistProfile.avatar || undefined;
    } else if (currentUser.adminProfile) {
      currentUserName = `${currentUser.adminProfile.firstName} ${currentUser.adminProfile.lastName}`;
      currentAvatar = currentUser.adminProfile.avatar || undefined;
    } else if (currentUser.patientProfiles.length > 0) {
      const patientProfile = currentUser.patientProfiles[0];
      currentUserName = `${patientProfile.firstName} ${patientProfile.lastName}`;
      currentAvatar = patientProfile.avatar || undefined;
    }

    // Tạo channel ID với format: direct_{userId1}_{userId2} (sắp xếp để đảm bảo unique)
    const userIds = [currentUserId, targetUserId].sort((a, b) => a - b);
    const channelId = `direct_${userIds[0]}_${userIds[1]}`;

    // Kiểm tra xem channel đã tồn tại chưa
    try {
      const existingChannel = this.streamClient.channel('messaging', channelId);
      await existingChannel.watch();

      // Nếu channel đã tồn tại và có đủ members, trả về channel đó
      if (existingChannel.state && existingChannel.state.members) {
        const memberIds = Object.keys(existingChannel.state.members).map((id) =>
          parseInt(id),
        );
        if (
          memberIds.includes(currentUserId) &&
          memberIds.includes(targetUserId)
        ) {
          return {
            channelId,
            targetUserName,
            members: Object.keys(existingChannel.state.members).length,
          };
        }
      }
    } catch {
      // Channel chưa tồn tại, tiếp tục tạo mới
      console.log('Channel does not exist, creating new one');
    }

    // Upsert users vào Stream Chat
    await this.streamClient.upsertUser({
      id: currentUserId.toString(),
      name: currentUserName,
      role: 'user',
      image: currentAvatar || undefined,
    });

    await this.streamClient.upsertUser({
      id: targetUserId.toString(),
      name: targetUserName,
      role: 'user',
      image: targetAvatar || undefined,
    });

    // Tạo channel mới
    const channel = this.streamClient.channel('messaging', channelId, {
      created_by_id: currentUserId.toString(),
      members: [currentUserId.toString(), targetUserId.toString()],
    });

    await channel.create();
    await channel.addMembers([
      currentUserId.toString(),
      targetUserId.toString(),
    ]);

    // Gửi tin nhắn chào mừng
    await channel.sendMessage({
      text: `Cuộc trò chuyện giữa ${currentUserName} và ${targetUserName}`,
      user_id: 'system',
    });

    return {
      channelId,
      targetUserName,
      members: 2,
    };
  }
}
