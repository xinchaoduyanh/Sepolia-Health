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
    if (member.user?.name) {
      console.log('Using channel state member data:', member.user.name);
      return {
        name: member.user.name,
        image: member.user.image,
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
          name: member.user.name,
          image: member.user.image,
        };
      }
    } catch (error) {
      console.warn('Failed to query channel members:', error);
    }
  }

  // 4. Bot message specific handling
  if (isBotMessage && channel) {
    const botMember = channel.state?.members?.[botUserId];
    if (botMember?.user?.image) {
      console.log('Using bot member data:', botMember.user.name);
      return {
        name: botMember.user.name,
        image: botMember.user.image,
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
  return {
    name: messageUser?.name || 'Người dùng',
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
    if (member.user?.name) {
      return {
        name: member.user.name,
        image: member.user.image,
      };
    }
  }

  // 3. Bot message handling
  if (isBotMessage && channel) {
    const botMember = channel.state?.members?.[botUserId];
    if (botMember?.user?.name) {
      return {
        name: botMember.user.name,
        image: botMember.user.image,
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

  return {
    name: messageUser?.name || 'Người dùng',
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
