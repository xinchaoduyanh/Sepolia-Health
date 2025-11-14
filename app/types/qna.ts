// Q&A Types

export type VoteType = 'UP' | 'DOWN';

export interface Author {
  id: number;
  fullName: string;
  role: string;
  avatar?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  usageCount?: number;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  views: number;
  upvotes: number;
  downvotes: number;
  voteScore: number;
  answerCount: number;
  hasBestAnswer: boolean;
  author: Author;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionDetail extends Question {
  answers: Answer[];
  editHistory?: EditHistoryItem[];
}

export interface Answer {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  voteScore: number;
  isBestAnswer: boolean;
  author: Author;
  createdAt: string;
  updatedAt: string;
}

export interface EditHistoryItem {
  id: number;
  oldTitle?: string;
  newTitle?: string;
  oldContent?: string;
  newContent?: string;
  reason?: string;
  editor: Author;
  createdAt: string;
}

// Request Types
export interface CreateQuestionRequest {
  title: string;
  content: string;
  tagIds: number[];
}

export interface UpdateQuestionRequest {
  title?: string;
  content?: string;
  tagIds?: number[];
  reason?: string;
}

export interface CreateAnswerRequest {
  content: string;
}

export interface UpdateAnswerRequest {
  content?: string;
  reason?: string;
}

export interface VoteRequest {
  voteType: VoteType;
}

export interface SetBestAnswerRequest {
  answerId: number;
}

// Query Filters
export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  tagIds?: number[];
  sortBy?: 'newest' | 'mostVoted' | 'mostAnswered' | 'unanswered';
}

// Response Types
export interface QuestionsListResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
}

export interface AnswersListResponse {
  answers: Answer[];
  total: number;
}

export interface TagsListResponse {
  tags: Tag[];
}



