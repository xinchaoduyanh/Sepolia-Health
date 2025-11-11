import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  StartChatDto,
  ChatChannelResponseDto,
  ChatChannelDto,
  StreamTokenResponseDto,
  ClinicDto,
  SearchUserDto,
  UserSearchResultDto,
  StartDirectChatDto,
  DirectChatChannelResponseDto,
} from './chat.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  @ApiOperation({ summary: 'Bắt đầu cuộc chat mới với clinic' })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully',
    type: ChatChannelResponseDto,
  })
  async startChat(
    @Body() dto: StartChatDto,
    @Request() req,
  ): Promise<ChatChannelResponseDto> {
    const patientUserId = req.user.userId;
    const result = await this.chatService.createChatChannel(
      patientUserId,
      dto.clinicId,
    );
    const token = this.chatService.generateStreamToken(patientUserId);
    return {
      ...result,
      streamToken: token,
    };
  }

  @Get('channels')
  @ApiOperation({ summary: 'Lấy danh sách channels của user' })
  @ApiResponse({
    status: 200,
    description: 'Channels retrieved successfully',
    type: [ChatChannelDto],
  })
  async getChannels(@Request() req): Promise<ChatChannelDto[]> {
    const userId = req.user.userId;
    return this.chatService.getUserChannels(userId);
  }

  @Get('token')
  @ApiOperation({ summary: 'Lấy Stream Chat token cho user' })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    type: StreamTokenResponseDto,
  })
  getToken(@Request() req) {
    const userId = req.user.userId;
    const token = this.chatService.generateStreamToken(userId);
    return {
      token,
      userId: userId.toString(),
    };
  }


  @Get('clinics')
  @ApiOperation({ summary: 'Lấy danh sách clinics có thể chat' })
  @ApiResponse({
    status: 200,
    description: 'Clinics retrieved successfully',
    type: [ClinicDto],
  })
  async getClinics(): Promise<ClinicDto[]> {
    return await this.chatService.getAvailableClinics();
  }

  @Get('video-token')
  @ApiOperation({ summary: 'Lấy Stream Video token cho user' })
  @ApiResponse({
    status: 200,
    description: 'Video token generated successfully',
  })
  getVideoToken(@Request() req) {
    const userId = req.user.userId;
    const token = this.chatService.generateVideoToken(userId);
    const apiKey = this.chatService.getVideoApiKey();
    return {
      token,
      apiKey,
      userId: userId.toString(),
    };
  }

  @Post('search-user')
  @ApiOperation({ summary: 'Tìm kiếm user theo email' })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: UserSearchResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async searchUser(@Body() dto: SearchUserDto): Promise<UserSearchResultDto> {
    return this.chatService.searchUserByEmail(dto.email);
  }

  @Post('start-direct')
  @ApiOperation({ summary: 'Bắt đầu cuộc chat trực tiếp với user theo email' })
  @ApiResponse({
    status: 201,
    description: 'Direct channel created successfully',
    type: DirectChatChannelResponseDto,
  })
  async startDirectChat(
    @Body() dto: StartDirectChatDto,
    @Request() req,
  ): Promise<DirectChatChannelResponseDto> {
    const currentUserId = req.user.userId;
    const result = await this.chatService.createDirectChatChannel(
      currentUserId,
      dto.email,
    );
    const token = this.chatService.generateStreamToken(currentUserId);
    return {
      ...result,
      streamToken: token,
    };
  }
}
