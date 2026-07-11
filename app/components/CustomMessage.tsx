import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image, Animated, Easing } from 'react-native';
import { useMessageContext, useChannelContext, MessageSimple } from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import Markdown from 'react-native-markdown-display';
import { useQueryClient } from '@tanstack/react-query';
import { getChatUserInfoSync, type ChatUserInfo } from '@/lib/utils/chat-user-data';
import { ChatbotAPI } from '@/lib/api/chatbot';

// Avatar cho tin nhắn của người khác. AI dùng ảnh bot bundled local.
const MessageAvatar = ({ isAI, userImage }: { isAI: boolean; userImage?: string }) => {
  // AI bot: luôn dùng ảnh local (URL remote trong Stream đã chết).
  if (isAI) {
    return (
      <Image
        source={ChatbotAPI.getAIBotAvatar()}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          marginRight: 8,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
        resizeMode="cover"
      />
    );
  }

  if (userImage) {
    return (
      <Image
        source={{ uri: userImage }}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          marginRight: 8,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0F2FE',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }}>
      <Ionicons name="person" size={20} color="#0284C7" />
    </View>
  );
};



// Format timestamp for better readability
const formatMessageTime = (date: Date) => {
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: vi });
  } else if (isYesterday(date)) {
    return `Hôm qua ${format(date, 'HH:mm', { locale: vi })}`;
  } else {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  }
};

// Markdown styles for messages
const getMarkdownStyles = (isMyMessage: boolean) => ({
  body: {
    fontSize: 15,
    lineHeight: 20,
    color: isMyMessage ? '#FFFFFF' : '#1F2937',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 4,
    fontSize: 15,
    lineHeight: 20,
    color: isMyMessage ? '#FFFFFF' : '#1F2937',
  },
  strong: {
    // Chữ đậm ở tin nhắn của người khác/AI tô màu teal cho nổi thông tin quan trọng
    // (ngày giờ, giá...) kiểu Zalo. Tin của mình giữ trắng cho dễ đọc trên nền xanh.
    fontWeight: '700' as const,
    color: isMyMessage ? '#FFFFFF' : '#0D9488',
  },
  bullet_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  ordered_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  list_item: {
    marginTop: 2,
    marginBottom: 2,
    flexDirection: 'row' as const,
    fontSize: 15,
    lineHeight: 20,
    color: isMyMessage ? '#FFFFFF' : '#1F2937',
  },
  bullet_list_icon: {
    marginLeft: 8,
    marginRight: 8,
    color: isMyMessage ? '#FFFFFF' : '#1F2937',
  },
  code_inline: {
    backgroundColor: isMyMessage ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
    fontSize: 14,
    color: isMyMessage ? '#FFFFFF' : '#1F2937',
  },
  link: {
    color: isMyMessage ? '#BFDBFE' : '#2563EB',
    textDecorationLine: 'underline' as const,
  },
});

// Nút xác nhận chỉ sống 10 phút (khớp TTL draft ở BE ai-bridge và agent AI).
// Quá hạn thì thẻ đổi sang "Đã hết hạn" — bấm tin nhắn cũ không thực thi nữa.
const CONFIRM_TTL_MS = 10 * 60 * 1000;

// Thẻ "Tin nhắn xác nhận" kèm nút — user chỉ cần bấm, không phải chat lại.
const ConfirmationCard = ({
  text,
  kind,
  channelId,
  createdAt,
  resolved,
}: {
  text: string;
  kind?: string;
  channelId?: string;
  createdAt?: Date;
  resolved?: boolean;
}) => {
  const queryClient = useQueryClient();
  // resolved: BE đã đánh dấu thẻ này xử lý xong (extra.resolved trên message) —
  // bền qua việc rời/vào lại đoạn chat, khác state cục bộ chỉ sống trong 1 mount.
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>(
    resolved ? 'done' : 'idle'
  );
  const isCancel = kind === 'cancel_booking';
  const accent = isCancel ? '#DC2626' : '#059669'; // đỏ huỷ / xanh lá xác nhận

  const expiresAtMs = createdAt ? createdAt.getTime() + CONFIRM_TTL_MS : null;
  const [expired, setExpired] = React.useState(
    expiresAtMs !== null && Date.now() > expiresAtMs
  );
  // Thẻ đang mở trên màn hình mà vừa quá hạn -> tự chuyển trạng thái.
  React.useEffect(() => {
    if (expired || expiresAtMs === null) return;
    const timer = setTimeout(() => setExpired(true), expiresAtMs - Date.now());
    return () => clearTimeout(timer);
  }, [expired, expiresAtMs]);

  const handlePress = async () => {
    if (!channelId || expired || status === 'loading' || status === 'done') return;
    setStatus('loading');
    try {
      await ChatbotAPI.confirmBooking(channelId);
      // Lịch vừa được tạo/huỷ ở BE -> làm mới danh sách để Home "lịch sắp tới" cập nhật.
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
      }}>
      {/* Header màu */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: accent,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
        <Ionicons name={isCancel ? 'close-circle' : 'calendar'} size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 }}>
          {isCancel ? 'XÁC NHẬN HUỶ LỊCH' : 'XÁC NHẬN ĐẶT LỊCH'}
        </Text>
      </View>

      {/* Nội dung */}
      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>
        <Markdown style={getMarkdownStyles(false)}>{text}</Markdown>

        {status === 'done' ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 10,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: '#ECFDF5',
            }}>
            <Ionicons name="checkmark-circle" size={18} color={accent} />
            <Text style={{ color: accent, fontWeight: '700' }}>Đã xác nhận</Text>
          </View>
        ) : expired ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 10,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: '#F1F5F9',
            }}>
            <Ionicons name="time-outline" size={18} color="#94A3B8" />
            <Text style={{ color: '#94A3B8', fontWeight: '700' }}>
              Đã hết hạn — nhắn lại để đặt mới
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePress}
            disabled={status === 'loading'}
            activeOpacity={0.85}
            style={{
              marginTop: 10,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: accent,
              alignItems: 'center',
              opacity: status === 'loading' ? 0.7 : 1,
            }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
              {status === 'loading'
                ? 'Đang xử lý...'
                : isCancel
                  ? 'Xác nhận huỷ lịch'
                  : 'Xác nhận đặt lịch'}
            </Text>
          </TouchableOpacity>
        )}

        {status === 'error' && (
          <Text style={{ color: '#DC2626', marginTop: 8, fontSize: 13 }}>
            Có lỗi khi xử lý, anh/chị thử lại giúp em nhé.
          </Text>
        )}
      </View>
    </View>
  );
};

export const CustomMessage = () => {
  const { message, isMyMessage } = useMessageContext();
  const { channel } = useChannelContext();
  const [showActions, setShowActions] = React.useState(false);

  const handleCopyMessage = async () => {
    if (message.text) {
      await Clipboard.setStringAsync(message.text);
      setShowActions(false);
    }
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  // Get user info using standardized utility
  const userInfo: ChatUserInfo = getChatUserInfoSync(
    message.user?.id || '',
    message.user,
    {
      channel,
      // Note: We don't have currentUserId here, but the utility has fallbacks
    }
  );

  const { name: userName, image: userImage } = userInfo;

  // Tin nhắn từ Trợ lý AI -> dùng avatar gradient sparkles + bong bóng tông tím
  const isAIMessage = !isMyMessage && message.user?.id === ChatbotAPI.getAIBotUserId();

  // Tin nhắn cần xác nhận (đặt/huỷ lịch) -> render THẺ có nút, user chỉ cần bấm.
  // Stream có thể đặt custom field trong `.extra` HOẶC ở root -> đọc cả hai cho chắc.
  const meta: any = (message as any).extra ?? (message as any);
  if (isAIMessage && meta?.requiresConfirmation) {
    return (
      <Pressable
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 4,
          alignItems: 'flex-end',
        }}>
        <MessageAvatar isAI userImage={undefined} />
        <View style={{ maxWidth: '82%', flex: 1 }}>
          <ConfirmationCard
            text={message.text || ''}
            kind={meta?.proposedAction?.kind}
            channelId={channel?.id}
            createdAt={message.created_at ? new Date(message.created_at) : undefined}
            resolved={Boolean(meta?.resolved)}
          />
        </View>
      </Pressable>
    );
  }

  // Handle attachments
  if (message.attachments?.length) {
    const attachment = message.attachments[0];
    const attachmentType = attachment.type;

    // For images and videos, use default component
    if (attachmentType === 'image' || attachmentType === 'video') {
      return <MessageSimple />;
    }

    // For other attachments, show custom text
    const displayText: string = (attachment.title ||
      attachment.fallback ||
      attachment.name ||
      'Đã gửi tệp đính kèm') as string;
    const customMessage = { ...message, text: displayText };
    const messageTime = message.created_at ? formatMessageTime(new Date(message.created_at)) : '';

    return (
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={{
          flexDirection: 'row',
          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
          paddingHorizontal: isMyMessage ? 4 : 12,
          paddingVertical: 4,
          alignItems: 'flex-end',
        }}>
        {/* Avatar for other users (left side) */}
        {!isMyMessage && (
          <MessageAvatar isAI={isAIMessage} userImage={userImage as string | undefined} />
        )}

        {/* Message Content Container */}
        <View
          style={{
            maxWidth: '75%',
            flexDirection: 'column',
            alignItems: isMyMessage ? 'flex-end' : 'flex-start',
          }}>
          {/* Username for other users */}
          {!isMyMessage && (
            <Text
              style={{
                fontSize: 12,
                color: isAIMessage ? '#7C3AED' : '#64748B',
                fontWeight: '600',
                marginBottom: 4,
                marginLeft: 8,
              }}>
              {userName}
            </Text>
          )}

          {/* Message Bubble with attachment */}
          <View
            style={{
              backgroundColor: isMyMessage ? '#2563EB' : isAIMessage ? '#FFFFFF' : '#FFFFFF',
              borderRadius: 20,
              borderBottomLeftRadius: isMyMessage ? 20 : 4,
              borderBottomRightRadius: isMyMessage ? 4 : 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              shadowColor: isMyMessage ? '#2563EB' : isAIMessage ? '#A855F7' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isMyMessage ? 0.2 : isAIMessage ? 0.12 : 0.05,
              shadowRadius: isMyMessage ? 4 : isAIMessage ? 6 : 2,
              elevation: isMyMessage ? 2 : isAIMessage ? 2 : 1,
              borderWidth: isMyMessage ? 0 : 1,
              borderColor: isAIMessage ? '#E9D5FF' : '#E2E8F0',
            }}>
            {displayText && (
              <Markdown style={getMarkdownStyles(isMyMessage)}>{displayText}</Markdown>
            )}
          </View>

          {/* Timestamp and Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              marginHorizontal: 8,
            }}>
            <Text
              style={{
                fontSize: 11,
                color: '#94A3B8',
              }}>
              {messageTime}
            </Text>

            {/* Read/Delivered Status for my messages */}
            {isMyMessage && (
              <View style={{ marginLeft: 4 }}>
                {message.status === 'received' ? (
                  <Ionicons name="checkmark-done" size={14} color="#10B981" />
                ) : (
                  <Ionicons name="checkmark" size={14} color="#94A3B8" />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Action Menu (appears on long press) */}
        {showActions && (
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: isMyMessage ? 0 : undefined,
              left: !isMyMessage ? 0 : undefined,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
              padding: 8,
              flexDirection: 'row',
              gap: 8,
            }}>
            <TouchableOpacity
              onPress={handleCopyMessage}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#F1F5F9',
              }}>
              <Ionicons name="copy-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowActions(false)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#F1F5F9',
              }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    );
  }

  // If message has quoted content, use default component
  if (message.quoted_message) {
    return <MessageSimple />;
  }

  const messageTime = message.created_at ? formatMessageTime(new Date(message.created_at)) : '';

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={{
        flexDirection: 'row',
        justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
        paddingHorizontal: isMyMessage ? 4 : 12,
        paddingVertical: 4,
        alignItems: 'flex-end',
      }}>
      {/* Avatar for other users (left side) */}
      {!isMyMessage && (
        <MessageAvatar isAI={isAIMessage} userImage={userImage as string | undefined} />
      )}

      {/* Message Content Container */}
      <View
        style={{
          maxWidth: '75%',
          flexDirection: 'column',
          alignItems: isMyMessage ? 'flex-end' : 'flex-start',
        }}>
        {/* Username for other users */}
        {!isMyMessage && (
          <Text
            style={{
              fontSize: 12,
              color: isAIMessage ? '#7C3AED' : '#64748B',
              fontWeight: '600',
              marginBottom: 4,
              marginLeft: 8,
            }}>
            {userName}
          </Text>
        )}

        {/* Message Bubble */}
        <View
          style={{
            backgroundColor: isMyMessage ? '#2563EB' : isAIMessage ? '#FFFFFF' : '#FFFFFF',
            borderRadius: 20,
            borderBottomLeftRadius: isMyMessage ? 20 : 4,
            borderBottomRightRadius: isMyMessage ? 4 : 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            shadowColor: isMyMessage ? '#2563EB' : isAIMessage ? '#A855F7' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isMyMessage ? 0.2 : isAIMessage ? 0.12 : 0.05,
            shadowRadius: isMyMessage ? 4 : isAIMessage ? 6 : 2,
            elevation: isMyMessage ? 2 : isAIMessage ? 2 : 1,
            borderWidth: isMyMessage ? 0 : 1,
            borderColor: isAIMessage ? '#E9D5FF' : '#E2E8F0',
          }}>
          <Markdown style={getMarkdownStyles(isMyMessage)}>{message.text}</Markdown>
        </View>

        {/* Timestamp and Status */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            marginHorizontal: 8,
          }}>
          <Text
            style={{
              fontSize: 11,
              color: '#94A3B8',
            }}>
            {messageTime}
          </Text>

          {/* Read/Delivered Status for my messages */}
          {isMyMessage && (
            <View style={{ marginLeft: 4 }}>
              {message.status === 'received' ? (
                <Ionicons name="checkmark-done" size={14} color="#10B981" />
              ) : (
                <Ionicons name="checkmark" size={14} color="#94A3B8" />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Action Menu (appears on long press) */}
      {showActions && (
        <View
          style={{
            position: 'absolute',
            top: -40,
            right: isMyMessage ? 0 : undefined,
            left: !isMyMessage ? 0 : undefined,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
            padding: 8,
            flexDirection: 'row',
            gap: 8,
          }}>
          <TouchableOpacity
            onPress={handleCopyMessage}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
            }}>
            <Ionicons name="copy-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowActions(false)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
            }}>
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
};
