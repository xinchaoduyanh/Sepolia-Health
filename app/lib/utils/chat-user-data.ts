import { ChatbotAPI } from '@/lib/api/chatbot';
import type { Channel as StreamChannel } from 'stream-chat';

export interface ChatUserInfo {
  name: string;
  image?: string;
}

export interface ChatUserDataOptions {
  channel?: StreamChannel;
  currentUserId?: string;
}

/**
 * Get user information with robust fallback logic
 * Used by both chat header and message components for consistency
 */
export async function getChatUserInfo(
  userId: string,
  messageUser?: any,
  options: ChatUserDataOptions = {}
): Promise<ChatUserInfo> {
  const { channel, currentUserId } = options;
  const botUserId = ChatbotAPI.getAIBotUserId();
  const isBotMessage = userId === botUserId;
  const isMyMessage = currentUserId ? userId === currentUserId : false;

  console.log('getChatUserInfo:', {
    userId,
    isBotMessage,
    isMyMessage,
    hasMessageUser: !!messageUser,
  });

  // 1. First try to get from message.user (most immediate)
  if (messageUser?.name) {
    console.log('✅ Using message.user data:', messageUser.name, 'userId:', userId);
    return {
      name: messageUser.name,
      image: messageUser.image,
    };
  }

  // 2. Try channel state members (cached data)
  if (channel?.state?.members?.[userId]?.user) {
    const member = channel.state.members[userId];
    const memberName = member.user?.name as string | undefined;
    if (memberName && memberName !== 'Người dùng' && memberName !== userId) {
      console.log('Using channel state member data:', memberName);
      return {
        name: memberName,
        image: member.user?.image as string | undefined,
      };
    }
  }

  // 2.5 Try channel data name if this is a clinic/receptionist channel and we're looking for the non-patient user
  if (channel && channel.data?.name && !isMyMessage && !isBotMessage) {
    const channelName = channel.data.name as string;
    if (channelName && channelName !== 'Người dùng') {
      console.log('Using channel data name as fallback:', channelName);
      return {
        name: channelName,
        image: (channel.data?.image as string) || (channel.state?.members?.[userId]?.user?.image as string),
      };
    }
  }

  // 3. Try fresh channel query (for receptionist messages)
  if (channel && !isBotMessage) {
    try {
      const members = await channel.queryMembers({});
      const member = members.members.find((m) => m.user_id === userId && m.user?.name);
      if (member?.user?.name) {
        console.log('Using fresh channel query data:', member.user.name);
        return {
          name: member.user.name as string,
          image: member.user.image as string | undefined,
        };
      }
    } catch (error) {
      console.warn('Failed to query channel members:', error);
    }
  }

  // 4. Bot message specific handling
  if (isBotMessage && channel) {
    const botMember = channel.state?.members?.[botUserId];
    const botName = botMember?.user?.name as string | undefined;
    const botImage = botMember?.user?.image as string | undefined;
    if (botImage) {
      console.log('Using bot member data:', botName);
      return {
        name: botName || 'Trợ lý Y tế Thông minh',
        image: botImage,
      };
    }
  }

  // 5. Final fallbacks with better defaults
  if (isBotMessage) {
    console.log('Using AI bot fallback');
    return {
      name: 'Trợ lý Y tế Thông minh',
      image:
        'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
    };
  }

  if (isMyMessage) {
    console.log('Using my message fallback');
    return {
      name: 'Bạn',
      image: undefined,
    };
  }

  console.log('Using generic fallback for user:', userId);
  
  // Last resort: If we have a channel name and it's not our own message, use it
  if (channel?.data?.name && !isMyMessage) {
    return {
      name: channel.data.name as string,
      image: (channel.data?.image as string) || messageUser?.image,
    };
  }

  return {
    name: messageUser?.name || (userId?.includes('clinic') || userId?.includes('receptionist') ? 'Phòng khám/Lễ tân' : 'Người dùng'),
    image: messageUser?.image,
  };
}

/**
 * Get user information synchronously (for immediate display)
 * Falls back to cached data, then tries async fetch
 */
export function getChatUserInfoSync(
  userId: string,
  messageUser?: any,
  options: ChatUserDataOptions = {}
): ChatUserInfo {
  const { channel, currentUserId } = options;
  const botUserId = ChatbotAPI.getAIBotUserId();
  const isBotMessage = userId === botUserId;
  const isMyMessage = currentUserId ? userId === currentUserId : false;

  // 1. Try message.user (most immediate)
  if (messageUser?.name) {
    return {
      name: messageUser.name,
      image: messageUser.image,
    };
  }

  // 2. Try channel state members (cached data)
  if (channel?.state?.members?.[userId]?.user) {
    const member = channel.state.members[userId];
    const memberName = member.user?.name as string | undefined;
    if (memberName && memberName !== 'Người dùng' && memberName !== userId) {
      return {
        name: memberName,
        image: member.user?.image as string | undefined,
      };
    }
  }

  // 2.5 Try channel data name fallback
  if (channel && channel.data?.name && !isMyMessage && !isBotMessage) {
    const channelName = channel.data.name as string;
    if (channelName && channelName !== 'Người dùng') {
      return {
        name: channelName,
        image: (channel.data?.image as string) || (channel.state?.members?.[userId]?.user?.image as string),
      };
    }
  }

  // 3. Bot message handling
  if (isBotMessage && channel) {
    const botMember = channel.state?.members?.[botUserId];
    const botName = botMember?.user?.name as string | undefined;
    const botImage = botMember?.user?.image as string | undefined;
    if (botName) {
      return {
        name: botName,
        image: botImage,
      };
    }
  }

  // 4. Final fallbacks
  if (isBotMessage) {
    return {
      name: 'Trợ lý Y tế Thông minh',
      image:
        'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
    };
  }

  if (isMyMessage) {
    return {
      name: 'Bạn',
      image: undefined,
    };
  }

  // Last resort fallback
  if (channel?.data?.name && !isMyMessage) {
    return {
      name: channel.data.name as string,
      image: (channel.data?.image as string) || messageUser?.image,
    };
  }

  return {
    name: messageUser?.name || (userId?.includes('clinic') || userId?.includes('receptionist') ? 'Phòng khám/Lễ tân' : 'Người dùng'),
    image: messageUser?.image,
  };
}

/**
 * Validate user data and trigger refresh if needed
 */
export function validateChatUserData(userInfo: ChatUserInfo): boolean {
  return !!(userInfo && userInfo.name && userInfo.name !== 'Unknown');
}

/**
 * Get initials for user avatar fallback
 */
export function getUserInitials(name: string): string {
  if (!name || name === 'Unknown' || name === 'Người dùng') return '?';

  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
