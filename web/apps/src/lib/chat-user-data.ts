import type { Channel as StreamChannel, MessageResponse, UserResponse } from 'stream-chat'

export interface ChatUserInfo {
  name: string
  image?: string | null
  userId: string
}

/**
 * Get user information from message data with fallback to channel members
 * Prioritizes actual message sender data from patientProfile
 */
export async function getWebChatUserInfo(
  channel: StreamChannel,
  currentUserId: string,
  targetUserId?: string,
  messageUser?: any
): Promise<ChatUserInfo> {
  console.log('getWebChatUserInfo:', { currentUserId, targetUserId, hasMessageUser: !!messageUser })

  // 1. Priority: Use message user data if provided (from actual message)
  if (messageUser?.name) {
    console.log('✅ Using message user data:', messageUser.name)
    return {
      name: messageUser.name,
      image: messageUser.image,
      userId: messageUser.id || targetUserId || ''
    }
  }

  // 2. If no message user, try to find from the last message in channel
  if (!targetUserId && channel.state?.messages?.length > 0) {
    const lastMessage = channel.state.messages[channel.state.messages.length - 1]
    if (lastMessage?.user?.id && lastMessage.user.id !== currentUserId && lastMessage.user?.name) {
      console.log('✅ Using last message user data:', lastMessage.user.name)
      return {
        name: lastMessage.user.name,
        image: lastMessage.user.image,
        userId: lastMessage.user.id
      }
    }
  }

  // 3. If no targetUserId specified, find the other member
  if (!targetUserId) {
    const members = channel.state.members ? Object.values(channel.state.members) : []
    const otherMember = members.find(member => member.user_id !== currentUserId)
    targetUserId = otherMember?.user_id || ''
  }

  if (!targetUserId) {
    console.warn('No target user ID found')
    return {
      name: 'Cuộc trò chuyện',
      image: null,
      userId: ''
    }
  }

  // 4. Try fresh channel query as fallback
  try {
    const members = await channel.queryMembers({})
    const member = members.members.find(m => m.user_id === targetUserId)
    if (member?.user?.name) {
      console.log('⚡ Using fresh channel query data:', member.user.name)
      return {
        name: member.user.name,
        image: member.user.image,
        userId: targetUserId
      }
    }
  } catch (error) {
    console.warn('Failed to query channel members:', error)
  }

  // 2. Try cached channel state
  const cachedMember = channel.state.members?.[targetUserId]
  if (cachedMember?.user?.name) {
    console.log('⚡ Using cached channel state data:', cachedMember.user.name)
    return {
      name: cachedMember.user.name,
      image: cachedMember.user.image,
      userId: targetUserId
    }
  }

  // 3. Try channel state members array
  const members = channel.state.members ? Object.values(channel.state.members) : []
  const otherMember = members.find(member => member.user_id === targetUserId)
  if (otherMember?.user?.name) {
    console.log('🔄 Using channel state members array:', otherMember.user.name)
    return {
      name: otherMember.user.name,
      image: otherMember.user.image,
      userId: targetUserId
    }
  }

  // 4. Fallback
  console.warn('⚠️ Using fallback for user:', targetUserId)
  return {
    name: `Người dùng ${targetUserId}`,
    image: null,
    userId: targetUserId
  }
}

/**
 * Get user information synchronously (fallback for immediate display)
 */
export function getWebChatUserInfoSync(
  channel: StreamChannel,
  currentUserId: string,
  targetUserId?: string
): ChatUserInfo {
  // If no targetUserId specified, find the other member
  if (!targetUserId) {
    const members = channel.state.members ? Object.values(channel.state.members) : []
    const otherMember = members.find(member => member.user_id !== currentUserId)
    targetUserId = otherMember?.user_id || ''
  }

  if (!targetUserId) {
    return {
      name: 'Cuộc trò chuyện',
      image: null,
      userId: ''
    }
  }

  // Try cached channel state first
  const cachedMember = channel.state.members?.[targetUserId]
  if (cachedMember?.user?.name) {
    return {
      name: cachedMember.user.name,
      image: cachedMember.user.image,
      userId: targetUserId
    }
  }

  // Try channel state members array
  const members = channel.state.members ? Object.values(channel.state.members) : []
  const otherMember = members.find(member => member.user_id === targetUserId)
  if (otherMember?.user?.name) {
    return {
      name: otherMember.user.name,
      image: otherMember.user.image,
      userId: targetUserId
    }
  }

  // Fallback
  return {
    name: `Người dùng ${targetUserId}`,
    image: null,
    userId: targetUserId
  }
}

/**
 * Get message sender information from actual message data
 */
export function getMessageSenderInfo(message: MessageResponse): ChatUserInfo {
  const userId = message.user?.id || ''
  const userName = message.user?.name || `Người dùng ${userId}`
  const userImage = message.user?.image || null

  console.log('✅ getMessageSenderInfo from message:', userName)

  return {
    name: userName,
    image: userImage,
    userId
  }
}

/**
 * Get chat channel name from last message (prioritizes message sender data)
 */
export async function getChatChannelNameFromLastMessage(
  channel: StreamChannel,
  currentUserId: string
): Promise<string> {
  const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1]

  if (lastMessage?.user?.id && lastMessage.user.id !== currentUserId && lastMessage.user?.name) {
    console.log('✅ Using last message sender name:', lastMessage.user.name)
    return lastMessage.user.name
  }

  // Fallback to channel member data
  const userInfo = await getWebChatUserInfo(channel, currentUserId)
  return userInfo.name
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(name: string): string {
  if (!name || name === 'Unknown' || name === 'Người dùng') return '?'

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}