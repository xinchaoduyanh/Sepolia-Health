import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { PrismaService } from '@/common/prisma/prisma.service';
import { appConfig } from '@/common/config';
import { ChatChannelDto, ClinicDto } from './chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
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
    this.logger.log('Stream Chat client initialized');
  }

  /**
   * Tạo channel chat mới giữa patient và receptionists của clinic
   */
  async createChatChannel(
    patientUserId: number,
    clinicId: number,
  ): Promise<{ channelId: string; clinicName: string; members: number }> {
    try {
      // 1. Lấy danh sách receptionist của clinic
      const receptionists =
        await this.prisma.clinicReceptionistMapping.findMany({
          where: { clinicId },
          include: {
            receptionist: {
              include: {
                receptionistProfile: true,
              },
            },
          },
        });

      if (receptionists.length === 0) {
        throw new Error(`No receptionists found for clinic ${clinicId}`);
      }

      // 2. Tạo channel ID theo format: patient_{userId}_VS_clinic_{clinicId}
      const channelId = `patient_${patientUserId}_VS_clinic_${clinicId}`;

      // 3. Tạo danh sách members (patient + tất cả receptionists)
      const members = [
        patientUserId.toString(),
        ...receptionists.map((r) => r.receptionistUserId.toString()),
      ];

      // 4. Lấy thông tin clinic để đặt tên channel
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true },
      });

      if (!clinic) {
        throw new Error(`Clinic ${clinicId} not found`);
      }

      // 5. Tạo channel trên Stream Chat
      const channel = this.streamClient.channel('messaging', channelId, {
        created_by_id: patientUserId.toString(),
      });

      await channel.create();

      // 6. Gửi tin nhắn chào mừng từ hệ thống
      await channel.sendMessage({
        text: `Chào bạn! Lễ tân của ${clinic.name} sẽ trả lời bạn trong giây lát.`,
        user_id: 'system_admin',
      });

      this.logger.log(
        `Created chat channel: ${channelId} for patient ${patientUserId} with clinic ${clinicId}`,
      );

      return {
        channelId,
        clinicName: clinic.name,
        members: members.length,
      };
    } catch (error) {
      this.logger.error(`Failed to create chat channel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy danh sách channels của user
   */
  async getUserChannels(userId: number): Promise<ChatChannelDto[]> {
    try {
      // Query Stream Chat để lấy channels của user
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

      // Transform data để phù hợp với frontend
      return channels.map((channel) => ({
        channelId: channel.id || '',
        name: channel.data?.created_by_id
          ? `Chat với ${channel.data.created_by_id}`
          : '',
        lastMessage:
          channel.state?.messages?.[channel.state.messages.length - 1],
        unreadCount: channel.state?.unreadCount || 0,
        lastMessageAt: channel.data?.last_message_at,
        members: channel.data?.members?.map((member) => member.user_id) || [],
      })) as ChatChannelDto[];
    } catch (error) {
      this.logger.error(`Failed to get user channels: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tạo Stream Chat token cho user
   */
  generateStreamToken(userId: number): string {
    try {
      return this.streamClient.createToken(userId.toString());
    } catch (error) {
      this.logger.error(`Failed to generate stream token: ${error.message}`);
      throw error;
    }
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
