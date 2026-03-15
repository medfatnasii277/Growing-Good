export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  avatar?: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface ContentItem {
  id: number;
  title: string;
  description?: string;
  content_type: ContentType;
  category_id?: number;
  data: ContentData;
  is_active: boolean;
}

export type ContentType = 'quiz' | 'reading' | 'click_game';

export interface QuizData {
  questions: QuizQuestion[];
  passing_score: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface ReadingData {
  title: string;
  content: string;
  reading_time_minutes: number;
  moral: string;
}

export interface ClickGameData {
  scenario: string;
  correct_items: string[];
  wrong_items: string[];
  time_limit_seconds: number;
}

export type ContentData = QuizData | ReadingData | ClickGameData;

export interface UserProgress {
  id: number;
  user_id: number;
  content_id: number;
  completed: boolean;
  score?: number;
  completed_at?: string;
}

export interface WeakArea {
  category_id?: number;
  category_name: string;
  average_score: number;
  average_duration_seconds?: number;
  attempt_count: number;
}

export interface RecommendedContent {
  content: ContentItem;
  reason: string;
  estimated_duration_seconds: number;
  match_score: number;
}

export interface LearningJourneyResponse {
  focus_message: string;
  recommendations: RecommendedContent[];
  weak_areas: WeakArea[];
}

export interface CreateContentRequest {
  title: string;
  description?: string;
  content_type: ContentType;
  category_id?: number;
  data: ContentData;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  total_score: number;
  completed_count: number;
  rank: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank?: number;
  user_score?: number;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
}

export interface ApiErrorResponse {
  error?: string;
}
