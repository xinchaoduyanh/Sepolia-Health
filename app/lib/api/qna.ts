import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  Question,
  QuestionDetail,
  Answer,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateAnswerRequest,
  UpdateAnswerRequest,
  VoteRequest,
  SetBestAnswerRequest,
  QuestionFilters,
  QuestionsListResponse,
  AnswersListResponse,
  TagsListResponse,
  EditHistoryItem,
} from '@/types/qna';

// Query Keys
export const qnaKeys = {
  all: ['qna'] as const,
  questions: () => [...qnaKeys.all, 'questions'] as const,
  question: (id: number) => [...qnaKeys.questions(), id] as const,
  questionList: (filters?: QuestionFilters) => [...qnaKeys.questions(), 'list', filters] as const,
  answers: (questionId: number) => [...qnaKeys.all, 'answers', questionId] as const,
  tags: () => [...qnaKeys.all, 'tags'] as const,
  popularTags: () => [...qnaKeys.all, 'tags', 'popular'] as const,
  editHistory: (type: 'question' | 'answer', id: number) =>
    [...qnaKeys.all, 'edit-history', type, id] as const,
};

// API Functions
export const qnaApi = {
  // Questions
  getQuestions: async (filters?: QuestionFilters): Promise<QuestionsListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tagIds' && Array.isArray(value)) {
            params.append('tagIds', value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiClient.get<QuestionsListResponse>(
      `${API_ENDPOINTS.QNA.QUESTIONS}?${params.toString()}`
    );
    return response.data;
  },

  getQuestion: async (id: number): Promise<QuestionDetail> => {
    const response = await apiClient.get<QuestionDetail>(`${API_ENDPOINTS.QNA.QUESTIONS}/${id}`);
    return response.data;
  },

  createQuestion: async (data: CreateQuestionRequest): Promise<Question> => {
    const response = await apiClient.post<Question>(API_ENDPOINTS.QNA.QUESTIONS, data);
    return response.data;
  },

  updateQuestion: async (id: number, data: UpdateQuestionRequest): Promise<Question> => {
    const response = await apiClient.put<Question>(`${API_ENDPOINTS.QNA.QUESTIONS}/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.QNA.QUESTIONS}/${id}`
    );
    return response.data;
  },

  voteQuestion: async (
    id: number,
    data: VoteRequest
  ): Promise<{ message: string; upvotes: number; downvotes: number }> => {
    const response = await apiClient.post<{ message: string; upvotes: number; downvotes: number }>(
      `${API_ENDPOINTS.QNA.QUESTIONS}/${id}/vote`,
      data
    );
    return response.data;
  },

  setBestAnswer: async (
    questionId: number,
    data: SetBestAnswerRequest
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(
      `${API_ENDPOINTS.QNA.QUESTIONS}/${questionId}/best-answer`,
      data
    );
    return response.data;
  },

  getQuestionEditHistory: async (id: number): Promise<EditHistoryItem[]> => {
    const response = await apiClient.get<EditHistoryItem[]>(
      `${API_ENDPOINTS.QNA.QUESTIONS}/${id}/edit-history`
    );
    return response.data;
  },

  // Answers
  getAnswers: async (questionId: number): Promise<AnswersListResponse> => {
    const response = await apiClient.get<AnswersListResponse>(
      `${API_ENDPOINTS.QNA.ANSWERS}/${questionId}/answers`
    );
    return response.data;
  },

  createAnswer: async (questionId: number, data: CreateAnswerRequest): Promise<Answer> => {
    const response = await apiClient.post<Answer>(
      `${API_ENDPOINTS.QNA.ANSWERS}/${questionId}/answers`,
      data
    );
    return response.data;
  },

  updateAnswer: async (id: number, data: UpdateAnswerRequest): Promise<Answer> => {
    const response = await apiClient.put<Answer>(`${API_ENDPOINTS.QNA.BASE}/answers/${id}`, data);
    return response.data;
  },

  deleteAnswer: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.QNA.BASE}/answers/${id}`
    );
    return response.data;
  },

  voteAnswer: async (
    id: number,
    data: VoteRequest
  ): Promise<{ message: string; upvotes: number; downvotes: number }> => {
    const response = await apiClient.post<{ message: string; upvotes: number; downvotes: number }>(
      `${API_ENDPOINTS.QNA.BASE}/answers/${id}/vote`,
      data
    );
    return response.data;
  },

  getAnswerEditHistory: async (id: number): Promise<EditHistoryItem[]> => {
    const response = await apiClient.get<EditHistoryItem[]>(
      `${API_ENDPOINTS.QNA.BASE}/answers/${id}/edit-history`
    );
    return response.data;
  },

  // Tags
  getTags: async (): Promise<TagsListResponse> => {
    const response = await apiClient.get<TagsListResponse>(API_ENDPOINTS.QNA.TAGS);
    return response.data;
  },

  getPopularTags: async (): Promise<TagsListResponse> => {
    const response = await apiClient.get<TagsListResponse>(API_ENDPOINTS.QNA.POPULAR_TAGS);
    return response.data;
  },
};

// React Query Hooks
export const useQuestions = (filters?: QuestionFilters) => {
  return useQuery({
    queryKey: qnaKeys.questionList(filters),
    queryFn: () => qnaApi.getQuestions(filters),
  });
};

export const useQuestion = (id: number) => {
  return useQuery({
    queryKey: qnaKeys.question(id),
    queryFn: () => qnaApi.getQuestion(id),
    enabled: !!id,
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => qnaApi.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.questions() });
      queryClient.invalidateQueries({ queryKey: qnaKeys.tags() });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateQuestionRequest }) =>
      qnaApi.updateQuestion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.question(variables.id) });
      queryClient.invalidateQueries({ queryKey: qnaKeys.questions() });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => qnaApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.questions() });
    },
  });
};

export const useVoteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VoteRequest }) => qnaApi.voteQuestion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.question(variables.id) });
      queryClient.invalidateQueries({ queryKey: qnaKeys.questions() });
    },
  });
};

export const useSetBestAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: SetBestAnswerRequest }) =>
      qnaApi.setBestAnswer(questionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.question(variables.questionId) });
      queryClient.invalidateQueries({ queryKey: qnaKeys.answers(variables.questionId) });
    },
  });
};

export const useQuestionEditHistory = (id: number) => {
  return useQuery({
    queryKey: qnaKeys.editHistory('question', id),
    queryFn: () => qnaApi.getQuestionEditHistory(id),
    enabled: !!id,
  });
};

export const useAnswers = (questionId: number) => {
  return useQuery({
    queryKey: qnaKeys.answers(questionId),
    queryFn: () => qnaApi.getAnswers(questionId),
    enabled: !!questionId,
  });
};

export const useCreateAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: CreateAnswerRequest }) =>
      qnaApi.createAnswer(questionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.answers(variables.questionId) });
      queryClient.invalidateQueries({ queryKey: qnaKeys.question(variables.questionId) });
      queryClient.invalidateQueries({ queryKey: qnaKeys.questions() });
    },
  });
};

export const useUpdateAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnswerRequest }) =>
      qnaApi.updateAnswer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.all });
    },
  });
};

export const useDeleteAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => qnaApi.deleteAnswer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.all });
    },
  });
};

export const useVoteAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VoteRequest }) => qnaApi.voteAnswer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qnaKeys.all });
    },
  });
};

export const useAnswerEditHistory = (id: number) => {
  return useQuery({
    queryKey: qnaKeys.editHistory('answer', id),
    queryFn: () => qnaApi.getAnswerEditHistory(id),
    enabled: !!id,
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: qnaKeys.tags(),
    queryFn: () => qnaApi.getTags(),
  });
};

export const usePopularTags = () => {
  return useQuery({
    queryKey: qnaKeys.popularTags(),
    queryFn: () => qnaApi.getPopularTags(),
  });
};
