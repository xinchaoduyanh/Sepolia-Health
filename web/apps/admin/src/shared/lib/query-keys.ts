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
            clinics: () => [...queryKeys.admin.doctors.all(), 'clinics'] as const,
            services: () => [...queryKeys.admin.doctors.all(), 'services'] as const,
        },
        articles: {
            all: () => [...queryKeys.admin.all, 'articles'] as const,
            lists: () => [...queryKeys.admin.articles.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.articles.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.articles.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.articles.details(), id] as const,
        },
        services: {
            all: () => [...queryKeys.admin.all, 'services'] as const,
            lists: () => [...queryKeys.admin.services.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.services.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.services.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.services.details(), id] as const,
        },
        clinics: {
            all: () => [...queryKeys.admin.all, 'clinics'] as const,
            lists: () => [...queryKeys.admin.clinics.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.clinics.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.clinics.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.clinics.details(), id] as const,
        },
        tags: {
            all: () => [...queryKeys.admin.all, 'tags'] as const,
            lists: () => [...queryKeys.admin.tags.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.tags.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.tags.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.tags.details(), id] as const,
        },
        receptionists: {
            all: () => [...queryKeys.admin.all, 'receptionists'] as const,
            lists: () => [...queryKeys.admin.receptionists.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.receptionists.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.receptionists.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.receptionists.details(), id] as const,
        },
        patients: {
            all: () => [...queryKeys.admin.all, 'patients'] as const,
            lists: () => [...queryKeys.admin.patients.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.patients.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.patients.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.admin.patients.details(), id] as const,
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
        appTerms: {
            all: () => [...queryKeys.admin.all, 'appTerms'] as const,
            lists: () => [...queryKeys.admin.appTerms.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.admin.appTerms.lists(), { filters }] as const,
            details: () => [...queryKeys.admin.appTerms.all(), 'detail'] as const,
            detail: (id: number) => [...queryKeys.admin.appTerms.details(), id] as const,
            byType: (type: string) => [...queryKeys.admin.appTerms.all(), 'type', type] as const,
        },
    },

    // QnA related queries
    qna: {
        all: ['qna'] as const,
        questions: {
            all: () => [...queryKeys.qna.all, 'questions'] as const,
            lists: () => [...queryKeys.qna.questions.all(), 'list'] as const,
            list: (filters: Record<string, any>) => [...queryKeys.qna.questions.lists(), { filters }] as const,
            details: () => [...queryKeys.qna.questions.all(), 'detail'] as const,
            detail: (id: string) => [...queryKeys.qna.questions.details(), id] as const,
        },
        tags: {
            all: () => [...queryKeys.qna.all, 'tags'] as const,
            popular: () => [...queryKeys.qna.tags.all(), 'popular'] as const,
            allTags: () => [...queryKeys.qna.tags.all(), 'all'] as const,
        },
    },

    // General queries
    general: {
        all: ['general'] as const,
        health: () => [...queryKeys.general.all, 'health'] as const,
    },
} as const

export type QueryKeys = typeof queryKeys
