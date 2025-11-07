import { User } from '@/types';

export interface UserProfile {
  name: string;
  image?: string;
}

/**
 * Get user profile info (name and avatar) based on user role
 */
export function getUserProfile(user: User): UserProfile {
  switch (user.role) {
    case 'PATIENT': {
      // Find SELF relationship profile for patient
      const selfProfile = user.patientProfiles?.find((profile) => profile.relationship === 'SELF');
      return {
        name: selfProfile ? `${selfProfile.firstName} ${selfProfile.lastName}` : 'Patient',
        image: selfProfile?.avatar,
      };
    }
    case 'DOCTOR':
      return {
        name: user.doctorProfile
          ? `${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`
          : 'Doctor',
        image: user.doctorProfile?.avatar,
      };
    case 'RECEPTIONIST':
      return {
        name: user.receptionistProfile
          ? `${user.receptionistProfile.firstName} ${user.receptionistProfile.lastName}`
          : 'Receptionist',
        image: user.receptionistProfile?.avatar,
      };
    case 'ADMIN':
      return {
        name: user.adminProfile
          ? `${user.adminProfile.firstName} ${user.adminProfile.lastName}`
          : 'Admin',
        image: user.adminProfile?.avatar,
      };
    default:
      return {
        name: 'User',
        image: undefined,
      };
  }
}
