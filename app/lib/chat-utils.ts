import { Channel } from 'stream-chat';
import { ChatbotAPI } from '@/lib/api/chatbot';

/**
 * Helper function to get user info from StreamChat data
 * Used by both header and message components to ensure consistency
 */
export const getUserInfoFromChannel = (
  channel: Channel | null | undefined,
  targetUserId?: string | null,
  currentUserId?: string | null
) => {
  if (!channel) {
    return {
      name: 'Unknown',
      image: null,
    };
  }

  // Determine if this is an AI channel
  const isAIChannel =
    channel.id?.startsWith('ai-consult-') ||
    channel.data?.ai_channel === true ||
    channel.data?.consultation_type === 'ai_assistant';

  // For AI channels, get bot user info
  if (isAIChannel) {
    const botUserId = ChatbotAPI.getAIBotUserId();

    // Try to get bot user from channel state members first
    if (channel.state?.members?.[botUserId]?.user) {
      const botUser = channel.state.members[botUserId].user;
      return {
        name: botUser.name || 'Trợ lý Y tế Thông minh',
        image: botUser.image || null,
      };
    }

    // Fallback: try to query members if available
    // Note: This might be async, so we return fallback for now
    return {
      name: 'Trợ lý Y tế Thông minh',
      image: null,
    };
  }

  // For regular channels, get other user info
  if (targetUserId && channel.state?.members?.[targetUserId]?.user) {
    const memberUser = channel.state.members[targetUserId].user;
    return {
      name: memberUser.name || 'Unknown',
      image: memberUser.image || null,
    };
  }

  // If no target user specified, try to find the other member (not current user)
  if (currentUserId && channel.state?.members) {
    const otherMember = Object.values(channel.state.members).find(
      (member) => member.user_id !== currentUserId
    );

    if (otherMember?.user) {
      return {
        name: otherMember.user.name || 'Unknown',
        image: otherMember.user.image || null,
      };
    }
  }

  // Fallback: try to get from channel data
  if (channel.data?.name) {
    return {
      name: channel.data.name,
      image: null,
    };
  }

  // Final fallback
  return {
    name: 'Tư vấn y tế',
    image: null,
  };
};

/**
 * Get the most recent user info from messages in the channel
 * This ensures we get the latest avatar/user data
 */
export const getLatestUserInfoFromMessages = (
  channel: Channel | null | undefined,
  currentUserId?: string | null
) => {
  if (!channel) {
    return {
      name: 'Unknown',
      image: null,
    };
  }

  // Determine if this is an AI channel
  const isAIChannel =
    channel.id?.startsWith('ai-consult-') ||
    channel.data?.ai_channel === true ||
    channel.data?.consultation_type === 'ai_assistant';

  const messages = channel.state?.messages || [];

  // Find the latest message from the other user (not current user)
  const latestOtherMessage = messages.find(
    (msg) => msg.user?.id && msg.user.id !== currentUserId
  );

  if (latestOtherMessage?.user) {
    return {
      name: latestOtherMessage.user.name || (isAIChannel ? 'Trợ lý Y tế Thông minh' : 'Unknown'),
      image: latestOtherMessage.user.image || null,
    };
  }

  // Fallback to channel-based lookup
  return getUserInfoFromChannel(channel, undefined, currentUserId);
};