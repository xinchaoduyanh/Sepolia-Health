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
    this.ensureSystemUserExists();
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
        image: 'https://via.placeholder.com/100x100/0284C7/FFFFFF?text=SH',
      });
      this.logger.log('System user ensured to exist');
    } catch (error) {
      this.logger.warn('Failed to ensure system user exists:', error);
    }
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
          avatar: true,
          clinic: {
            select: {
              name: true,
            },
          },
        },
      });

      this.logger.log(
        `Found ${receptionists.length} receptionists for clinic ${clinicId}`,
      );
      this.logger.log(
        `Receptionist user IDs: ${receptionists.map((r) => r.userId).join(', ')}`,
      );
      receptionists.forEach((r) => {
        this.logger.log(
          `Receptionist: User ${r.userId} - ${r.firstName} ${r.lastName} - Clinic: ${r.clinic?.name}`,
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

        // 5. Ensure patient user exists in Stream Chat
        try {
          // Get patient info
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

          if (patient) {
            await this.streamClient.upsertUser({
              id: patientUserId.toString(),
              name: `${patient.firstName} ${patient.lastName}`,
              role: 'user',
              image: patient.avatar || undefined,
            });
            this.logger.log(
              `Patient user ${patientUserId} upserted to Stream Chat`,
            );
          }
        } catch (error) {
          this.logger.warn(`Failed to upsert patient ${patientUserId}:`, error);
        }

        // 6. Tạo channel trên Stream Chat
        this.logger.log(`Creating Stream Chat channel: ${channelId}`);
        const channel = this.streamClient.channel('messaging', channelId, {
          created_by_id: patientUserId.toString(),
        });

        await channel.create();
        this.logger.log(`Stream Chat channel created successfully`);

        // Update channel with clinic name
        await channel.update({ name: clinic.name } as any);
        this.logger.log(`Channel name updated to: ${clinic.name}`);

        // Verify patient member exists
        try {
          const user = await this.streamClient.queryUsers({
            id: patientUserId.toString(),
          });
          if (!user.users || user.users.length === 0) {
            throw new Error(
              `Patient user ${patientUserId} does not exist in Stream Chat`,
            );
          }
          this.logger.log(
            `Verified patient user ${patientUserId} exists in Stream Chat`,
          );
        } catch (error) {
          this.logger.error(`Patient user verification failed:`, error);
          throw new Error(`Cannot add non-existent patient user to channel`);
        }

        // 6. Gửi tin nhắn chào mừng từ hệ thống
        this.logger.log(`Sending welcome message`);
        await channel.sendMessage({
          text: `Chào bạn! Hiện tại cơ sở ${clinic.name} chưa có lễ tân trực tuyến. Vui lòng chờ hoặc liên hệ hotline để được hỗ trợ.`,
          user_id: 'system', // Send as system user
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
      // Use clinic name from receptionist profile, fallback to clinic name
      const channelDisplayName =
        receptionists.length > 0
          ? receptionists[0].clinic?.name || clinic.name
          : clinic.name;

      const channel = this.streamClient.channel('messaging', channelId, {
        created_by_id: patientUserId.toString(),
      });

      // Ensure patient user exists in Stream Chat
      try {
        // Get patient info
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

        this.logger.log(
          `Patient lookup result for user ${patientUserId}:`,
          patient ? 'Found' : 'Not found',
        );

        if (patient) {
          this.logger.log(
            `Upserting patient user: ${patient.firstName} ${patient.lastName}`,
          );
          await this.streamClient.upsertUser({
            id: patientUserId.toString(),
            name: `${patient.firstName} ${patient.lastName}`,
            role: 'user',
            image: patient.avatar || undefined,
          });
          this.logger.log(
            `Patient user ${patientUserId} upserted to Stream Chat successfully`,
          );
        } else {
          // Fallback: create user with default name if no patient profile found
          this.logger.warn(
            `No patient profile found for user ${patientUserId}, creating with default name`,
          );
          await this.streamClient.upsertUser({
            id: patientUserId.toString(),
            name: `Patient ${patientUserId}`,
            role: 'user',
            image: undefined, // No avatar for fallback
          });
          this.logger.log(
            `Patient user ${patientUserId} upserted with default name`,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to upsert patient ${patientUserId}:`, error);
        // Don't throw here, continue with channel creation
      }

      // Ensure all receptionist users exist in Stream Chat before adding to channel
      for (const receptionist of receptionists) {
        try {
          this.logger.log(
            `Upserting receptionist user: ${receptionist.userId} - ${receptionist.firstName} ${receptionist.lastName}`,
          );
          await this.streamClient.upsertUser({
            id: receptionist.userId.toString(),
            name: `${receptionist.firstName} ${receptionist.lastName}`,
            role: 'user',
            image: receptionist.avatar || undefined,
          });
          this.logger.log(
            `Receptionist user ${receptionist.userId} upserted to Stream Chat successfully`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to upsert receptionist ${receptionist.userId}:`,
            error,
          );
          // Throw error to stop channel creation if receptionist upsert fails
          throw new Error(
            `Failed to create receptionist user ${receptionist.userId} in Stream Chat`,
          );
        }
      }

      await channel.create();
      this.logger.log(`Stream Chat channel created successfully`);

      // Update channel with display name
      if (channelDisplayName) {
        await channel.update({ name: channelDisplayName } as any);
        this.logger.log(`Channel name updated to: ${channelDisplayName}`);
      }

      // Verify all members exist before adding to channel
      for (const memberId of members) {
        try {
          const user = await this.streamClient.queryUsers({ id: memberId });
          if (!user.users || user.users.length === 0) {
            throw new Error(`User ${memberId} does not exist in Stream Chat`);
          }
          this.logger.log(`Verified user ${memberId} exists in Stream Chat`);
        } catch (error) {
          this.logger.error(`User ${memberId} verification failed:`, error);
          throw new Error(
            `Cannot add non-existent user ${memberId} to channel`,
          );
        }
      }

      // Add all members (patient + receptionists) to channel
      await channel.addMembers(members);
      this.logger.log(`All members added to channel: ${members.join(', ')}`);

      // 6. Gửi tin nhắn chào mừng từ hệ thống
      this.logger.log(`Sending welcome message`);
      await channel.sendMessage({
        text: `Chào bạn! Lễ tân của ${clinic.name} sẽ trả lời bạn trong giây lát.`,
        user_id: 'system', // Send as system user
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
