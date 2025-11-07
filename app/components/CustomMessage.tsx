import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useMessageContext, MessageSimple } from 'stream-chat-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

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

export const CustomMessage = () => {
  const { message, isMyMessage } = useMessageContext();
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

  // If message has attachments or complex content, use default component
  if (message.attachments?.length || message.quoted_message) {
    return <MessageSimple />;
  }

  const messageTime = message.created_at ? formatMessageTime(new Date(message.created_at)) : '';
  const userName = message.user?.name || 'Unknown';
  const userImage = message.user?.image;

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={{
        flexDirection: 'row',
        justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
        paddingHorizontal: 12,
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
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0EA5E9' }}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
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
          <Text
            style={{
              fontSize: 15,
              lineHeight: 20,
              color: isMyMessage ? '#FFFFFF' : '#1F2937',
            }}>
            {message.text}
          </Text>
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

      {/* Avatar space for my messages (right side) - invisible spacer */}
      {isMyMessage && <View style={{ width: 32, marginLeft: 8 }} />}

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
