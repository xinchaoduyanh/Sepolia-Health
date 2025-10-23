/**
 * Query keys factory for consistent query key management
 * This helps avoid typos and ensures consistent query invalidation
 */

export const queryKeys = {
    // Auth related queries
    auth: {
        all: ['auth'] as const,
        me: () => [...queryKeys.auth.all, 'me'] as const,
        profile: () => [...queryKeys.auth.all, 'profile'] as const,
    },

    // Admin related queries
    admin: {
        all: ['admin'] as const,
        users: {
            all: () => [...queryKeys.admin.all, 'users'] as const,
            lists: () => [...queryKeys.admin.users.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.users.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.users.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.users.details(), id] as const,
        },
        doctors: {
            all: () => [...queryKeys.admin.all, 'doctors'] as const,
            lists: () => [...queryKeys.admin.doctors.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.doctors.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.doctors.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.doctors.details(), id] as const,
        },
        appointments: {
            all: () => [...queryKeys.admin.all, 'appointments'] as const,
            lists: () => [...queryKeys.admin.appointments.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.appointments.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.appointments.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.appointments.details(), id] as const,
        },
        statistics: {
            all: () => [...queryKeys.admin.all, 'statistics'] as const,
            dashboard: () => [...queryKeys.admin.statistics.all(), 'dashboard'] as const,
            overview: () => [...queryKeys.admin.statistics.all(), 'overview'] as const,
        },
    },

    // General queries
    general: {
        all: ['general'] as const,
        health: () => [...queryKeys.general.all, 'health'] as const,
    },
} as const

export type QueryKeys = typeof queryKeys
