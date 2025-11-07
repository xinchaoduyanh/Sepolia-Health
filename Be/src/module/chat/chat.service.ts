import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '@/common/prisma/prisma.service';
import { appConfig } from '@/common/config';
import { ChatChannelDto, ClinicDto } from './chat.dto';

@Injectable()
export class ChatService {
  private streamClient: StreamChat;

  constructor(
    @Inject(appConfig.KEY)
    private readonly streamChatConf: ConfigType<typeof appConfig>,
    private prisma: PrismaService,
  ) {
    this.streamClient = StreamChat.getInstance(
      this.streamChatConf.streamChatApiKey,
      this.streamChatConf.streamChatSecret,
    );
    void this.ensureSystemUserExists();
  }

  /**
   * Ensure system user exists for sending system messages
   */
  private async ensureSystemUserExists() {
    await this.streamClient.upsertUser({
      id: 'system',
      name: 'Sepolia Health',
      role: 'user',
    });
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

    // 7. Add members vào channel
    if (receptionistUserIds.length > 0) {
      await channel.addMembers(receptionistUserIds);
    }

    // 8. Gửi tin nhắn chào mừng từ hệ thống
    const welcomeMessage =
      receptionists.length > 0
        ? `Chào bạn! Lễ tân của ${clinic.name} sẽ trả lời bạn trong giây lát.`
        : `Chào bạn! Hiện tại cơ sở ${clinic.name} chưa có lễ tân trực tuyến. Vui lòng chờ hoặc liên hệ hotline để được hỗ trợ.`;

    await channel.sendMessage({
      text: welcomeMessage,
      user_id: 'system',
    });

    return {
      channelId,
      clinicName: clinic.name,
      members: 1 + receptionistUserIds.length,
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
  generateStreamToken(userId: number): string {
    return this.streamClient.createToken(userId.toString());
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
}
