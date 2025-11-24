// Export all hooks
export * from './useAuth'
export * from './useMounted'
export * from './usePatients'
export * from './useDoctors'
export * from './useDoctorSchedule'
export * from './useReceptionists'
export * from './useArticles'
export * from './useServices'
export * from './useClinics'
export * from './useTags'
export * from './useAppTerms'
export * from './useAppointment'
export * from './usePromotions'
export * from './usePromotionDisplays'
// Export QNA hooks (excluding useTags to avoid conflict with admin useTags)
export {
    useQuestions,
    useQuestion,
    usePopularTags,
    useCreateAnswer,
    useVoteQuestion,
    useVoteAnswer,
    useSetBestAnswer,
    useDeleteAnswer,
    useDeleteQuestion,
} from './useQna'
