import { User } from '@/types';

export interface UserProfile {
  name: string;
  image?: string;
}

/**
 * Get user profile info (name and avatar) based on user role
 */
export function getUserProfile(user: User): UserProfile {
  return {
    name: `${user.firstName} ${user.lastName}`,
    image: user.avatar || '',
  };
}
