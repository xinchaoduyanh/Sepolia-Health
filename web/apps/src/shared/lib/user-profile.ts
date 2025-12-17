export interface UserProfile {
    name: string
    image?: string
}

export interface ClinicInfo {
    name: string
    address?: string
    phone?: string
}

/**
 * Get clinic information for receptionist
 */
export function getClinicInfo(user: any): ClinicInfo | null {
    if (user.role === 'RECEPTIONIST' && user.receptionistProfile?.clinic) {
        return {
            name: user.receptionistProfile.clinic.name,
            address: user.receptionistProfile.clinic.address,
            phone: user.receptionistProfile.clinic.phone,
        }
    }
    return null
}

/**
 * Get user profile info (name and avatar) based on user role
 */
export function getUserProfile(user: any): UserProfile {
    switch (user.role) {
        case 'PATIENT': {
            // Find SELF relationship profile for patient
            const selfProfile = user.patientProfiles?.find((profile: any) => profile.relationship === 'SELF')
            return {
                name: selfProfile ? `${selfProfile.firstName} ${selfProfile.lastName}` : 'Patient',
                image: selfProfile?.avatar,
            }
        }
        case 'DOCTOR':
            return {
                name: user.doctorProfile ? `${user.doctorProfile.firstName} ${user.doctorProfile.lastName}` : 'Doctor',
                image: user.doctorProfile?.avatar,
            }
        case 'RECEPTIONIST':
            return {
                name: user.receptionistProfile
                    ? `${user.receptionistProfile.firstName} ${user.receptionistProfile.lastName}`
                    : 'Receptionist',
                image: user.receptionistProfile?.avatar,
            }
        case 'ADMIN':
            return {
                name: user.adminProfile ? `${user.adminProfile.firstName} ${user.adminProfile.lastName}` : 'Admin',
                image: user.adminProfile?.avatar,
            }
        default:
            return {
                name: 'User',
                image: undefined,
            }
    }
}
