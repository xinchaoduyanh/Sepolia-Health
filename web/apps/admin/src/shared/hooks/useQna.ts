import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@workspace/ui/components/Sonner'
import {
    qnaService,
    type QuestionFilters,
    type QuestionsListResponse,
    type QuestionDetail,
    type CreateAnswerRequest,
    type VoteRequest,
    type SetBestAnswerRequest,
} from '../lib/api-services'
import { queryKeys } from '../lib/query-keys'

/**
 * Hook to get questions list with pagination and filters
 */
export function useQuestions(params: QuestionFilters = {}) {
    return useQuery<QuestionsListResponse>({
        queryKey: queryKeys.qna.questions.list(params),
        queryFn: () => qnaService.getQuestions(params),
        staleTime: 30 * 1000, // 30 seconds
        retry: 1,
    })
}

/**
 * Hook to get single question by ID with answers
 */
export function useQuestion(id: number) {
    return useQuery<QuestionDetail>({
        queryKey: queryKeys.qna.questions.detail(id.toString()),
        queryFn: () => qnaService.getQuestion(id),
        enabled: !!id,
        staleTime: 30 * 1000,
        retry: 2,
    })
}

/**
 * Hook to get popular tags
 */
export function usePopularTags() {
    return useQuery({
        queryKey: queryKeys.qna.tags.popular(),
        queryFn: () => qnaService.getPopularTags(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to get all tags
 */
export function useTags() {
    return useQuery({
        queryKey: queryKeys.qna.tags.allTags(),
        queryFn: () => qnaService.getTags(),
        staleTime: 5 * 60 * 1000,
    })
}

/**
 * Hook to create answer
 */
export function useCreateAnswer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ questionId, data }: { questionId: number; data: CreateAnswerRequest }) =>
            qnaService.createAnswer(questionId, data),
        onSuccess: (_response, { questionId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.detail(questionId.toString()),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Đã trả lời câu hỏi',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi trả lời câu hỏi'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to vote on question
 */
export function useVoteQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: VoteRequest }) => qnaService.voteQuestion(id, data),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.detail(id.toString()),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.lists(),
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi vote'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to vote on answer
 */
export function useVoteAnswer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: VoteRequest }) => qnaService.voteAnswer(id, data),
        onSuccess: (_response, variables) => {
            // Invalidate the question detail to refresh the answers
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.details(),
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi vote'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to set best answer
 */
export function useSetBestAnswer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ questionId, data }: { questionId: number; data: SetBestAnswerRequest }) =>
            qnaService.setBestAnswer(questionId, data),
        onSuccess: (_response, { questionId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.detail(questionId.toString()),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Đã chọn câu trả lời tốt nhất',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi chọn best answer'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete answer
 */
export function useDeleteAnswer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => qnaService.deleteAnswer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.details(),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Đã xóa câu trả lời',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa câu trả lời'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}

/**
 * Hook to delete question
 */
export function useDeleteQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => qnaService.deleteQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.qna.questions.lists(),
            })

            toast.success({
                title: 'Thành công',
                description: 'Đã xóa câu hỏi',
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa câu hỏi'
            toast.error({
                title: 'Lỗi',
                description: message,
            })
        },
    })
}
