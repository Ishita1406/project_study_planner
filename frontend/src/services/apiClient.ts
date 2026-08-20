/**
 * Modular API client abstraction.
 * Corresponds to future FastAPI endpoints.
 * Operates on StorageService to ensure interactive prototype state.
 */

import {
  Subject,
  Topic,
  Task,
  Deadline,
  StudySession,
  StudyPlan,
  PlanGenerationParams,
  GeneratedPlanItem,
  User,
  UserPreferences,
} from '../types';
import { StorageService } from './storage';
import { apiFetch, TokenStorage } from './httpClient';

// Helper to simulate network latency if needed
const delay = (ms: number = 50) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

interface SignupData {
  name: string;
  email: string;
  password: string;
  targetSemester?: string;
  weeklyGoalHours?: number;
  avatarUrl?: string;
}

export const apiClient = {
  // ==================== AUTH ====================
  // POST /api/auth/signup
  async signup(data: SignupData, rememberMe: boolean = true): Promise<User> {
    const res = await apiFetch<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    TokenStorage.set(res.token, rememberMe);
    return res.user;
  },

  // POST /api/auth/login
  async login(email: string, password: string, rememberMe: boolean = true): Promise<User> {
    const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    TokenStorage.set(res.token, rememberMe);
    return res.user;
  },

  // POST /api/auth/logout
  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      TokenStorage.clear();
    }
  },

  // GET /api/auth/me — used to validate/restore a session on load
  async getCurrentUser(): Promise<User> {
    return apiFetch<User>('/auth/me');
  },

  // ==================== USER & PREFERENCES ====================
  // GET /api/user
  async getUser(): Promise<User> {
    return apiFetch<User>('/user');
  },

  // PATCH /api/user
  async updateUser(user: Partial<User>): Promise<User> {
    return apiFetch<User>('/user', {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
  },

  // GET /api/preferences
  async getPreferences(): Promise<UserPreferences> {
    return apiFetch<UserPreferences>('/preferences');
  },

  // PATCH /api/preferences
  async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiFetch<UserPreferences>('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    });
  },

  // ==================== SUBJECTS ====================
  // GET /api/subjects
  async getSubjects(): Promise<Subject[]> {
    return apiFetch<Subject[]>('/subjects');
  },

  // POST /api/subjects
  async createSubject(data: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    // Backend auto-creates a matching deadline row when `deadline` is set.
    return apiFetch<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PATCH /api/subjects/:id
  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    return apiFetch<Subject>(`/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/subjects/:id
  async deleteSubject(id: string): Promise<void> {
    // Backend cascades the delete to topics, tasks, and deadlines.
    await apiFetch<void>(`/subjects/${id}`, { method: 'DELETE' });
  },

  // ==================== TOPICS ====================
  // GET /api/topics?subjectId=...
  async getTopics(subjectId?: string): Promise<Topic[]> {
    const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return apiFetch<Topic[]>(`/topics${query}`);
  },

  // POST /api/topics
  async createTopic(data: Omit<Topic, 'id'>): Promise<Topic> {
    return apiFetch<Topic>('/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PATCH /api/topics/:id
  async updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
    return apiFetch<Topic>(`/topics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/topics/:id
  async deleteTopic(id: string): Promise<void> {
    // Backend cascades the delete to any tasks referencing this topic.
    await apiFetch<void>(`/topics/${id}`, { method: 'DELETE' });
  },

  // ==================== TASKS ====================
  // GET /api/tasks
  async getTasks(): Promise<Task[]> {
    return apiFetch<Task[]>('/tasks');
  },

  // POST /api/tasks
  async createTask(data: Omit<Task, 'id'>): Promise<Task> {
    return apiFetch<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PATCH /api/tasks/:id
  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return apiFetch<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/tasks/:id
  async deleteTask(id: string): Promise<void> {
    await apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' });
  },

  // POST /api/tasks/:id/rebalance — moves the task and shifts subsequent
  // pending tasks for the same subject; returns the full refreshed task list.
  async rebalancePlan(movedTaskId: string, newDate: string): Promise<Task[]> {
    return apiFetch<Task[]>(`/tasks/${movedTaskId}/rebalance`, {
      method: 'POST',
      body: JSON.stringify({ newDate }),
    });
  },

  // ==================== DEADLINES ====================
  // GET /api/deadlines
  async getDeadlines(): Promise<Deadline[]> {
    return apiFetch<Deadline[]>('/deadlines');
  },

  // POST /api/deadlines
  async createDeadline(data: Omit<Deadline, 'id'>): Promise<Deadline> {
    return apiFetch<Deadline>('/deadlines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/deadlines/:id
  async deleteDeadline(id: string): Promise<void> {
    await apiFetch<void>(`/deadlines/${id}`, { method: 'DELETE' });
  },

  // ==================== STUDY SESSIONS ====================
  // GET /api/study-sessions
  async getStudySessions(): Promise<StudySession[]> {
    return apiFetch<StudySession[]>('/study-sessions');
  },

  // POST /api/study-sessions
  // Backend also marks the linked task completed and folds the feedback into
  // the topic's rolling confidence score, so no client-side bookkeeping needed.
  async createStudySession(data: Omit<StudySession, 'id' | 'createdAt'>): Promise<StudySession> {
    return apiFetch<StudySession>('/study-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== PLAN GENERATION ====================
  // POST /api/plans/generate — powered by Gemini AI on the backend
  async generateStudyPlan(params: PlanGenerationParams): Promise<StudyPlan> {
    return apiFetch<StudyPlan>('/plans/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // POST /api/plans/:id/accept
  // Converts generated plan items into active task records
  async acceptStudyPlan(plan: StudyPlan): Promise<void> {
    await apiFetch<void>(`/plans/${plan.id}/accept`, { method: 'POST' });
  },
};
