import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Start Chat Schema
const StartChatSchema = z.object({
  clinicId: z.number().positive('Clinic ID phải là số dương'),
});

// Chat Channel Response Schema
const ChatChannelResponseSchema = z.object({
  channelId: z.string().min(1, 'Channel ID không được để trống'),
  clinicName: z.string().min(1, 'Tên clinic không được để trống'),
  members: z.number().min(1, 'Phải có ít nhất 1 member'),
  streamToken: z.string().min(1, 'Stream token không được để trống'),
});

// Chat Channel Schema
const ChatChannelSchema = z.object({
  channelId: z.string().min(1, 'Channel ID không được để trống'),
  name: z.string().min(1, 'Tên channel không được để trống'),
  lastMessage: z.any().optional(),
  unreadCount: z.number().min(0, 'Số tin nhắn chưa đọc phải >= 0'),
  lastMessageAt: z.string().optional(),
  members: z.array(z.string()),
});

// Stream Token Response Schema
const StreamTokenResponseSchema = z.object({
  token: z.string().min(1, 'Token không được để trống'),
  userId: z.string().min(1, 'User ID không được để trống'),
});

// Clinic Schema
const ClinicSchema = z.object({
  id: z.number().positive('Clinic ID phải là số dương'),
  name: z.string().min(1, 'Tên clinic không được để trống'),
  address: z.string().min(1, 'Địa chỉ clinic không được để trống'),
  phone: z.string().optional(),
});

// Search User Schema
const SearchUserSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ')
    .min(1, 'Email không được để trống'),
});

// User Search Result Schema
const UserSearchResultSchema = z.object({
  id: z.number().positive('User ID phải là số dương'),
  email: z.string().email('Email không hợp lệ'),
  name: z.string().min(1, 'Tên không được để trống'),
  avatar: z.string().optional(),
  role: z.string(),
});

// Start Direct Chat Schema
const StartDirectChatSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ')
    .min(1, 'Email không được để trống'),
});

// Direct Chat Channel Response Schema
const DirectChatChannelResponseSchema = z.object({
  channelId: z.string().min(1, 'Channel ID không được để trống'),
  targetUserName: z.string().min(1, 'Tên người dùng không được để trống'),
  members: z.number().min(2, 'Phải có ít nhất 2 members'),
  streamToken: z.string().min(1, 'Stream token không được để trống'),
});

// Export DTO classes
export class StartChatDto extends createZodDto(StartChatSchema) {}
export class ChatChannelResponseDto extends createZodDto(
  ChatChannelResponseSchema,
) {}
export class ChatChannelDto extends createZodDto(ChatChannelSchema) {}
export class StreamTokenResponseDto extends createZodDto(
  StreamTokenResponseSchema,
) {}
export class ClinicDto extends createZodDto(ClinicSchema) {}
export class SearchUserDto extends createZodDto(SearchUserSchema) {}
export class UserSearchResultDto extends createZodDto(UserSearchResultSchema) {}
export class StartDirectChatDto extends createZodDto(StartDirectChatSchema) {}
export class DirectChatChannelResponseDto extends createZodDto(
  DirectChatChannelResponseSchema,
) {}
