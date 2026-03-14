export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
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
  content_type: 'quiz' | 'reading' | 'click_game';
  category_id?: number;
  data: QuizData | ReadingData | ClickGameData;
  is_active: boolean;
}

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

export interface UserProgress {
  id: number;
  user_id: number;
  content_id: number;
  completed: boolean;
  score?: number;
  completed_at?: string;
}

export interface CreateContentRequest {
  title: string;
  description?: string;
  content_type: 'quiz' | 'reading' | 'click_game';
  category_id?: number;
  data: any;
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
