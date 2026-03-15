import axios from 'axios';
import type {
  AuthResponse,
  Category,
  ContentItem,
  CreateCategoryRequest,
  CreateContentRequest,
  LearningJourneyResponse,
  LeaderboardResponse,
  UpdateProfileRequest,
  User,
  UserProgress,
} from '../types';
import { getErrorMessage } from '../utils/errors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type AnswerPayload = Record<string, unknown>;
type UserStats = { completed_count: number; total_score: number };
type UserRank = { rank: number; total_score: number };

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api
      .post<AuthResponse>('/api/auth/login', data)
      .catch((error: unknown) => {
        throw new Error(getErrorMessage(error, 'Login failed'));
      }),

  register: (data: { username: string; password: string; role?: 'admin' | 'user' }) =>
    api
      .post<AuthResponse>('/api/auth/register', data)
      .catch((error: unknown) => {
        throw new Error(getErrorMessage(error, 'Registration failed'));
      }),

  me: () =>
    api.get<User>('/api/auth/me').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load user data'));
    }),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<User>('/api/auth/profile', data).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to update profile'));
    }),
};

export const contentAPI = {
  list: () =>
    api.get<ContentItem[]>('/api/content').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load content'));
    }),

  get: (id: number) =>
    api.get<ContentItem>(`/api/content/${id}`).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load content'));
    }),

  validate: (id: number, answer: AnswerPayload) =>
    api.post(`/api/content/${id}/validate`, answer).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to validate answer'));
    }),

  complete: (id: number, score: number, durationSeconds?: number) =>
    api.post(`/api/content/${id}/complete`, { score, duration_seconds: durationSeconds }).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to complete content'));
    }),

  getUserStats: () =>
    api.get<UserStats>('/api/content/stats').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to get user stats'));
    }),

  getRecommendations: () =>
    api.get<LearningJourneyResponse>('/api/content/recommendations').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to get recommendations'));
    }),
};

export const adminContentAPI = {
  list: () =>
    api.get<ContentItem[]>('/api/admin/content').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load admin content'));
    }),

  create: (data: CreateContentRequest) =>
    api.post<ContentItem>('/api/admin/content', data).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to create content'));
    }),

  update: (id: number, data: Partial<CreateContentRequest>) =>
    api.put<ContentItem>(`/api/admin/content/${id}`, data).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to update content'));
    }),

  delete: (id: number) =>
    api.delete(`/api/admin/content/${id}`).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to delete content'));
    }),
};

export const adminCategoryAPI = {
  list: () =>
    api.get<Category[]>('/api/admin/categories').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load categories'));
    }),

  create: (data: CreateCategoryRequest) =>
    api.post<Category>('/api/admin/categories', data).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to create category'));
    }),

  delete: (id: number) =>
    api.delete(`/api/admin/categories/${id}`).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to delete category'));
    }),
};

export const adminUserAPI = {
  list: () =>
    api.get<User[]>('/api/admin/users').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load users'));
    }),

  get: (id: number) =>
    api.get<User>(`/api/admin/users/${id}`).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to load user'));
    }),
};

export const progressAPI = {
  getUserProgress: () =>
    api.get<UserProgress[]>('/api/content/progress').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to get user progress'));
    }),

  getContentProgress: (contentId: number) =>
    api.get<UserProgress>(`/api/progress/${contentId}`).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to get content progress'));
    }),
};

export const leaderboardAPI = {
  getLeaderboard: (limit?: number) => {
    const suffix = limit ? `?limit=${limit}` : '';
    return api
      .get<LeaderboardResponse>(`/api/leaderboard${suffix}`)
      .catch((error: unknown) => {
        throw new Error(getErrorMessage(error, 'Failed to load leaderboard'));
      });
  },

  getMyRank: () =>
    api.get<UserRank>('/api/leaderboard/me').catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to get user rank'));
    }),

  getUserRank: (userId: number) =>
    api.get<UserRank>(`/api/leaderboard/user/${userId}`).catch((error: unknown) => {
      throw new Error(getErrorMessage(error, 'Failed to get user rank'));
    }),
};

export default api;
