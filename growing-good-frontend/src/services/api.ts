import axios from 'axios';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ContentItem, 
  Category,
  UserProgress,
  CreateContentRequest,
  CreateCategoryRequest,
  User
} from '../types';

const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest) => 
    api.post<AuthResponse>('/api/auth/login', data)
    .catch((error: any) => {
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      throw new Error('Login failed');
    }),
  
  register: (data: RegisterRequest) => 
    api.post<AuthResponse>('/api/auth/register', data)
    .catch((error: any) => {
      if (error.response?.status === 400) {
        throw new Error('Username already exists');
      }
      throw new Error('Registration failed');
    }),
  
  me: () => 
    api.get<User>('/api/auth/me')
    .catch((error: any) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Session expired');
      }
      throw new Error('Failed to load user data');
    }),
};

// Content API (User)
export const contentAPI = {
  list: () => 
    api.get<ContentItem[]>('/api/content')
    .catch((error: any) => {
      console.error('Failed to load content:', error);
      throw new Error('Failed to load content');
    }),
  
  get: (id: number) => 
    api.get<ContentItem>('/api/content/' + id)
    .catch((error: any) => {
      if (error.response?.status === 404) {
        throw new Error('Content not found');
      }
      console.error('Failed to load content:', error);
      throw new Error('Failed to load content');
    }),
  
  validate: (id: number, answer: any) => 
    api.post('/api/content/' + id + '/validate', answer)
    .catch((error: any) => {
      console.error('Failed to validate answer:', error);
      throw new Error('Failed to validate answer');
    }),
  
  complete: (id: number, score: number) => 
    api.post('/api/content/' + id + '/complete', { score })
    .catch((error: any) => {
      console.error('Failed to complete content:', error);
      throw new Error('Failed to complete content');
    }),
};

// Admin Content API
export const adminContentAPI = {
  list: () => 
    api.get<ContentItem[]>('/api/admin/content')
    .catch((error: any) => {
      console.error('Failed to load admin content:', error);
      throw new Error('Failed to load admin content');
    }),
  
  create: (data: CreateContentRequest) => 
    api.post<ContentItem>('/api/admin/content', data)
    .catch((error: any) => {
      console.error('Failed to create content:', error);
      throw new Error('Failed to create content');
    }),
  
  update: (id: number, data: Partial<CreateContentRequest>) => 
    api.put<ContentItem>('/api/admin/content/' + id, data)
    .catch((error: any) => {
      console.error('Failed to update content:', error);
      throw new Error('Failed to update content');
    }),
  
  delete: (id: number) => 
    api.delete('/api/admin/content/' + id)
    .catch((error: any) => {
      console.error('Failed to delete content:', error);
      throw new Error('Failed to delete content');
    }),
};

// Admin Category API
export const adminCategoryAPI = {
  list: () => 
    api.get<Category[]>('/api/admin/categories')
    .catch((error: any) => {
      console.error('Failed to load categories:', error);
      throw new Error('Failed to load categories');
    }),
  
  create: (data: CreateCategoryRequest) => 
    api.post<Category>('/api/admin/categories', data)
    .catch((error: any) => {
      console.error('Failed to create category:', error);
      throw new Error('Failed to create category');
    }),
};

// Admin User API
export const adminUserAPI = {
  list: () => 
    api.get<User[]>('/api/admin/users')
    .catch((error: any) => {
      console.error('Failed to load users:', error);
      throw new Error('Failed to load users');
    }),
  
  get: (id: number) => 
    api.get<User>('/api/admin/users/' + id)
    .catch((error: any) => {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      console.error('Failed to load user:', error);
      throw new Error('Failed to load user');
    }),
};

// Progress API
export const progressAPI = {
  getUserProgress: () => 
    api.get<UserProgress[]>('/api/progress')
    .catch((error: any) => {
      console.error('Failed to get user progress:', error);
      throw new Error('Failed to get user progress');
    }),
  
  getContentProgress: (contentId: number) => 
    api.get<UserProgress>('/api/progress/' + contentId)
    .catch((error: any) => {
      console.error('Failed to get content progress:', error);
      throw new Error('Failed to get content progress');
    }),
};

export default api;
