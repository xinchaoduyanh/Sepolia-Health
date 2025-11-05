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
    this.logger.log(
      `Creating chat channel for patient ${patientUserId} with clinic ${clinicId}`,
    );

    try {
      // 1. Lấy danh sách receptionist của clinic
      this.logger.log(`Fetching receptionists for clinic ${clinicId}`);
      const receptionists = await this.prisma.receptionistProfile.findMany({
        where: { clinicId },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
        },
      });

      this.logger.log(
        `Found ${receptionists.length} receptionists for clinic ${clinicId}`,
      );
      receptionists.forEach((r) => {
        this.logger.log(
          `Receptionist: User ${r.userId} - ${r.firstName} ${r.lastName}`,
        );
      });

      if (receptionists.length === 0) {
        // For now, create a channel without receptionists but add a system admin
        this.logger.warn(
          `No receptionists found for clinic ${clinicId}, creating channel with patient only`,
        );

        // Create channel with just the patient for now
        const members = [patientUserId.toString()];
        this.logger.log(`Channel members: ${members.join(', ')}`);

        // 2. Tạo channel ID theo format: patient_{userId}_VS_clinic_{clinicId}
        const channelId = `patient_${patientUserId}_VS_clinic_${clinicId}`;
        this.logger.log(`Generated channel ID: ${channelId}`);

        // 4. Lấy thông tin clinic để đặt tên channel
        this.logger.log(`Fetching clinic info for ID ${clinicId}`);
        const clinic = await this.prisma.clinic.findUnique({
          where: { id: clinicId },
          select: { name: true },
        });

        if (!clinic) {
          throw new Error(`Clinic ${clinicId} not found`);
        }
        this.logger.log(`Clinic found: ${clinic.name}`);

        // 5. Tạo channel trên Stream Chat
        this.logger.log(`Creating Stream Chat channel: ${channelId}`);
        const channel = this.streamClient.channel('messaging', channelId, {
          created_by_id: patientUserId.toString(),
        });

        await channel.create();
        this.logger.log(`Stream Chat channel created successfully`);

        // 6. Gửi tin nhắn chào mừng từ hệ thống
        this.logger.log(`Sending welcome message`);
        await channel.sendMessage({
          text: `Chào bạn! Hiện tại cơ sở ${clinic.name} chưa có lễ tân trực tuyến. Vui lòng chờ hoặc liên hệ hotline để được hỗ trợ.`,
          user_id: 'system_admin',
        });
        this.logger.log(`Welcome message sent`);

        this.logger.log(
          `Created chat channel: ${channelId} for patient ${patientUserId} with clinic ${clinicId}`,
        );

        return {
          channelId,
          clinicName: clinic.name,
          members: members.length,
        };
      }

      // 2. Tạo channel ID theo format: patient_{userId}_VS_clinic_{clinicId}
      const channelId = `patient_${patientUserId}_VS_clinic_${clinicId}`;
      this.logger.log(`Generated channel ID: ${channelId}`);

      // 3. Tạo danh sách members (patient + tất cả receptionists)
      const members = [
        patientUserId.toString(),
        ...receptionists.map((r) => r.userId.toString()),
      ];
      this.logger.log(`Channel members: ${members.join(', ')}`);

      // 4. Lấy thông tin clinic để đặt tên channel
      this.logger.log(`Fetching clinic info for ID ${clinicId}`);
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true },
      });

      if (!clinic) {
        throw new Error(`Clinic ${clinicId} not found`);
      }
      this.logger.log(`Clinic found: ${clinic.name}`);

      // 5. Tạo channel trên Stream Chat
      this.logger.log(`Creating Stream Chat channel: ${channelId}`);
      const channel = this.streamClient.channel('messaging', channelId, {
        created_by_id: patientUserId.toString(),
      });

      await channel.create();
      this.logger.log(`Stream Chat channel created successfully`);

      // Ensure patient is added as member
      await channel.addMembers([patientUserId.toString()]);
      this.logger.log(`Patient ${patientUserId} added to channel`);

      // 6. Gửi tin nhắn chào mừng từ hệ thống
      this.logger.log(`Sending welcome message`);
      await channel.sendMessage({
        text: `Chào bạn! Lễ tân của ${clinic.name} sẽ trả lời bạn trong giây lát.`,
        user_id: 'system_admin',
      });
      this.logger.log(`Welcome message sent`);

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
