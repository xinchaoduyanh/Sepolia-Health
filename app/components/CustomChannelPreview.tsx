import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Channel } from 'stream-chat';

interface CustomChannelPreviewProps {
  channel: Channel;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const formatLastMessageTime = (date: Date) => {
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: vi });
  } else if (isYesterday(date)) {
    return 'Hôm qua';
  } else {
    return format(date, 'dd/MM', { locale: vi });
  }
};

const getReceptionistAvatar = async (channel: Channel): Promise<string | null> => {
  try {
    // Query members để lấy data mới nhất
    const membersResponse = await channel.queryMembers({});

    if (membersResponse.members && membersResponse.members.length > 0) {
      // Extract patient ID from channel ID: patient_{patientId}_VS_clinic_{clinicId}
      const channelIdParts = channel.id?.split('_VS_');
      const patientPart = channelIdParts?.[0]?.replace('patient_', '');
      const patientId = patientPart || channel.data?.created_by_id;

      const receptionists = membersResponse.members.filter(
        (member) => member.user_id !== patientId
      );

      if (receptionists.length > 0) {
        return (receptionists[0]?.user?.image as string) || null;
      }
    }

    return null;
  } catch {
    return null;
  }
};

export const CustomChannelPreview = ({
  channel,
  onPress,
  isActive = false,
  disabled = false,
}: CustomChannelPreviewProps) => {
  const [receptionistAvatar, setReceptionistAvatar] = React.useState<string | null>(null);

  // Safely get last message and time
  const lastMessage =
    channel.state?.messages?.length > 0
      ? channel.state.messages[channel.state.messages.length - 1]
      : null;

  const lastMessageText = lastMessage?.text || 'Chưa có tin nhắn';
  const lastMessageTime = lastMessage?.created_at
    ? formatLastMessageTime(new Date(lastMessage.created_at))
    : '';

  // Check if this is receptionist channel
  const isReceptionist = channel.id?.includes('patient_') || false;

  // Use channel name set by backend
  const displayName = channel.data?.name || 'Đang tải...';

  // Get unread count
  const unreadCount = channel.state?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  // Load receptionist avatar when component mounts and is receptionist channel
  React.useEffect(() => {
    if (isReceptionist && channel) {
      getReceptionistAvatar(channel).then(setReceptionistAvatar);
    } else {
      setReceptionistAvatar(null);
    }
  }, [channel, isReceptionist]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isActive ? '#EFF6FF' : hasUnread ? '#FEFCE8' : '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: hasUnread ? 0.08 : 0.04,
        shadowRadius: 4,
        elevation: hasUnread ? 3 : 2,
        borderWidth: isActive ? 2 : hasUnread ? 1 : 0,
        borderColor: isActive ? '#2563EB' : hasUnread ? '#FDE047' : 'transparent',
        opacity: disabled ? 0.5 : 1,
      }}>
      {/* Avatar Container */}
      <View style={{ marginRight: 12, position: 'relative' }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: isReceptionist ? '#DBEAFE' : '#E0F2FE',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: hasUnread ? 3 : 2,
            borderColor: hasUnread ? '#EAB308' : '#FFFFFF',
            shadowColor: isReceptionist ? '#2563EB' : '#0EA5E9',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}>
          {receptionistAvatar ? (
            <Image
              source={{ uri: receptionistAvatar }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
              }}
              resizeMode="cover"
            />
          ) : isReceptionist ? (
            <Ionicons name="person" size={26} color="#2563EB" />
          ) : (
            <Ionicons name="business" size={26} color="#0EA5E9" />
          )}
        </View>

        {/* Online indicator (optional - for future use) */}
        {isReceptionist && (
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#10B981',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          />
        )}

        {/* Unread badge */}
        {hasUnread && (
          <View
            style={{
              position: 'absolute',
              right: -4,
              top: -4,
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 3,
            }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#FFFFFF',
              }}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </View>

      {/* Channel Info */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Channel name and time */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: hasUnread ? '700' : '600',
              color: '#1F2937',
              flex: 1,
            }}
            numberOfLines={1}>
            {displayName}
          </Text>
          {lastMessageTime && (
            <Text
              style={{
                fontSize: 12,
                color: hasUnread ? '#EAB308' : '#94A3B8',
                fontWeight: hasUnread ? '600' : '400',
                marginLeft: 8,
              }}>
              {lastMessageTime}
            </Text>
          )}
        </View>

        {/* Last message */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Message sender indicator for my messages */}
          {!!lastMessage?.user?.id && (
            <Ionicons name="checkmark-done" size={14} color="#10B981" style={{ marginRight: 4 }} />
          )}
          <Text
            style={{
              fontSize: 14,
              color: hasUnread ? '#64748B' : '#94A3B8',
              fontWeight: hasUnread ? '500' : '400',
              flex: 1,
            }}
            numberOfLines={1}>
            {lastMessageText}
          </Text>
        </View>

        {/* Channel type indicator */}
        {isReceptionist && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 6,
            }}>
            <View
              style={{
                backgroundColor: '#DBEAFE',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
              <Text
                style={{
                  fontSize: 11,
                  color: '#2563EB',
                  fontWeight: '600',
                  marginLeft: 4,
                }}>
                Lễ tân
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Chevron indicator */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isActive ? '#2563EB' : '#CBD5E1'}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );
};
