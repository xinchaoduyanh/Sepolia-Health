import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Image } from 'react-native';
import { useMessageContext, useChannelContext, MessageSimple } from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import Markdown from 'react-native-markdown-display';
import { ChatbotAPI } from '@/lib/api/chatbot';
import { getUserInfoFromChannel } from '@/lib/chat-utils';

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
    fontWeight: '700',
    color: isMyMessage ? '#FFFFFF' : '#1F2937',
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
    flexDirection: 'row',
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
    textDecorationLine: 'underline',
  },
});

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

  // Get user info using shared function for consistency
  const getUserInfo = () => {
    const userId = message.user?.id;

    // For AI bot messages, use bot user ID
    const isBotMessage = userId === ChatbotAPI.getAIBotUserId();
    const targetUserId = isBotMessage ? ChatbotAPI.getAIBotUserId() : userId;

    // Use shared function to get user info from channel state
    const channelUserInfo = getUserInfoFromChannel(channel, targetUserId);

    // Prioritize message.user data as it's the most recent/accurate
    if (message.user?.name || message.user?.image) {
      return {
        name: message.user.name || channelUserInfo.name,
        image: message.user.image || channelUserInfo.image,
      };
    }

    // Fallback to channel-based info
    return channelUserInfo;
  };

  const { name: userName, image: userImage } = getUserInfo();

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
            {userImage ? (
              <Image
                source={{ uri: userImage as string }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={20} color="#0284C7" />
            )}
          </View>
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
                color: '#64748B',
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
              backgroundColor: isMyMessage ? '#2563EB' : '#FFFFFF',
              borderRadius: 20,
              borderBottomLeftRadius: isMyMessage ? 20 : 4,
              borderBottomRightRadius: isMyMessage ? 4 : 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              shadowColor: isMyMessage ? '#2563EB' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isMyMessage ? 0.2 : 0.05,
              shadowRadius: isMyMessage ? 4 : 2,
              elevation: isMyMessage ? 2 : 1,
              borderWidth: isMyMessage ? 0 : 1,
              borderColor: '#E2E8F0',
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
          {userImage ? (
            <Image
              source={{ uri: userImage as string }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={20} color="#0284C7" />
          )}
        </View>
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
              color: '#64748B',
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
            backgroundColor: isMyMessage ? '#2563EB' : '#FFFFFF',
            borderRadius: 20,
            borderBottomLeftRadius: isMyMessage ? 20 : 4,
            borderBottomRightRadius: isMyMessage ? 4 : 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            shadowColor: isMyMessage ? '#2563EB' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isMyMessage ? 0.2 : 0.05,
            shadowRadius: isMyMessage ? 4 : 2,
            elevation: isMyMessage ? 2 : 1,
            borderWidth: isMyMessage ? 0 : 1,
            borderColor: '#E2E8F0',
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
