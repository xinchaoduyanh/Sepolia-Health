import { apiClient } from '../api-client'

// Types for Q&A API based on BE schema
export type VoteType = 'UP' | 'DOWN'

export interface Author {
    id: number
    fullName: string
    role: string
    avatar?: string
}

export interface Tag {
    id: number
    name: string
    slug: string
    description?: string
    usageCount?: number
}

export interface Question {
    id: number
    title: string
    content: string
    views: number
    upvotes: number
    downvotes: number
    voteScore: number
    answerCount: number
    hasBestAnswer: boolean
    author: Author
    tags: Tag[]
    createdAt: string
    updatedAt: string
}

export interface Answer {
    id: number
    content: string
    upvotes: number
    downvotes: number
    voteScore: number
    isBestAnswer: boolean
    author: Author
    createdAt: string
    updatedAt: string
}

export interface EditHistoryItem {
    id: number
    oldTitle?: string
    newTitle?: string
    oldContent?: string
    newContent?: string
    reason?: string
    editor: Author
    createdAt: string
}

export interface QuestionDetail extends Question {
    answers: Answer[]
    editHistory: EditHistoryItem[]
}

// Request Types
export interface CreateQuestionRequest {
    title: string
    content: string
    tagIds: number[]
}

export interface UpdateQuestionRequest {
    title?: string
    content?: string
    tagIds?: number[]
    reason?: string
}

export interface CreateAnswerRequest {
    content: string
}

export interface UpdateAnswerRequest {
    content?: string
    reason?: string
}

export interface VoteRequest {
    voteType: VoteType
}

export interface SetBestAnswerRequest {
    answerId: number
}

// Query Parameters
export interface QuestionFilters {
    page?: number
    limit?: number
    search?: string
    tagIds?: number[]
    sortBy?: 'newest' | 'mostVoted' | 'mostAnswered' | 'unanswered'
}

// Response Types
export interface QuestionsListResponse {
    questions: Question[]
    total: number
    page: number
    limit: number
}

export interface AnswersListResponse {
    answers: Answer[]
    total: number
}

export interface TagsListResponse {
    tags: Tag[]
}

export interface VoteResponse {
    message: string
    upvotes: number
    downvotes: number
}

export class QnaService {
    // ========== QUESTION METHODS ==========

    /**
     * Get questions list with pagination and filters
     * GET /qna/questions
     */
    async getQuestions(params: QuestionFilters = {}): Promise<QuestionsListResponse> {
        const queryParams = {
            ...params,
            tagIds: params.tagIds ? params.tagIds.join(',') : undefined,
        }
        return apiClient.get<QuestionsListResponse>('/qna/questions', { params: queryParams })
    }

    /**
     * Get question by ID with answers
     * GET /qna/questions/{id}
     */
    async getQuestion(id: number): Promise<QuestionDetail> {
        return apiClient.get<QuestionDetail>(`/qna/questions/${id}`)
    }

    /**
     * Create new question
     * POST /qna/questions
     */
    async createQuestion(data: CreateQuestionRequest): Promise<Question> {
        return apiClient.post<Question>('/qna/questions', data)
    }

    /**
     * Update question
     * PUT /qna/questions/{id}
     */
    async updateQuestion(id: number, data: UpdateQuestionRequest): Promise<Question> {
        return apiClient.put<Question>(`/qna/questions/${id}`, data)
    }

    /**
     * Delete question
     * DELETE /qna/questions/{id}
     */
    async deleteQuestion(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/qna/questions/${id}`)
    }

    /**
     * Vote on question
     * POST /qna/questions/{id}/vote
     */
    async voteQuestion(id: number, data: VoteRequest): Promise<VoteResponse> {
        return apiClient.post<VoteResponse>(`/qna/questions/${id}/vote`, data)
    }

    /**
     * Set best answer for question
     * PUT /qna/questions/{id}/best-answer
     */
    async setBestAnswer(questionId: number, data: SetBestAnswerRequest): Promise<{ message: string }> {
        return apiClient.put<{ message: string }>(`/qna/questions/${questionId}/best-answer`, data)
    }

    /**
     * Get question edit history
     * GET /qna/questions/{id}/edit-history
     */
    async getQuestionEditHistory(questionId: number): Promise<EditHistoryItem[]> {
        return apiClient.get<EditHistoryItem[]>(`/qna/questions/${questionId}/edit-history`)
    }

    // ========== ANSWER METHODS ==========

    /**
     * Create answer for a question
     * POST /qna/questions/{questionId}/answers
     */
    async createAnswer(questionId: number, data: CreateAnswerRequest): Promise<Answer> {
        return apiClient.post<Answer>(`/qna/questions/${questionId}/answers`, data)
    }

    /**
     * Get answers for a question
     * GET /qna/questions/{questionId}/answers
     */
    async getAnswers(questionId: number): Promise<AnswersListResponse> {
        return apiClient.get<AnswersListResponse>(`/qna/questions/${questionId}/answers`)
    }

    /**
     * Update answer
     * PUT /qna/answers/{id}
     */
    async updateAnswer(id: number, data: UpdateAnswerRequest): Promise<Answer> {
        return apiClient.put<Answer>(`/qna/answers/${id}`, data)
    }

    /**
     * Delete answer
     * DELETE /qna/answers/{id}
     */
    async deleteAnswer(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/qna/answers/${id}`)
    }

    /**
     * Vote on answer
     * POST /qna/answers/{id}/vote
     */
    async voteAnswer(id: number, data: VoteRequest): Promise<VoteResponse> {
        return apiClient.post<VoteResponse>(`/qna/answers/${id}/vote`, data)
    }

    /**
     * Get answer edit history
     * GET /qna/answers/{id}/edit-history
     */
    async getAnswerEditHistory(answerId: number): Promise<EditHistoryItem[]> {
        return apiClient.get<EditHistoryItem[]>(`/qna/answers/${answerId}/edit-history`)
    }

    // ========== TAG METHODS ==========

    /**
     * Get all tags
     * GET /qna/tags
     */
    async getTags(): Promise<TagsListResponse> {
        return apiClient.get<TagsListResponse>('/qna/tags')
    }

    /**
     * Get popular tags
     * GET /qna/tags/popular
     */
    async getPopularTags(): Promise<TagsListResponse> {
        return apiClient.get<TagsListResponse>('/qna/tags/popular')
    }
}

export const qnaService = new QnaService()
