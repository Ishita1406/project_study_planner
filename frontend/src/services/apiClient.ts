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
  async getUser(): Promise<User> {
    await delay(30);
    return StorageService.getUser();
  },

  async updateUser(user: Partial<User>): Promise<User> {
    await delay(50);
    const current = StorageService.getUser();
    const updated = { ...current, ...user };
    StorageService.saveUser(updated);
    return updated;
  },

  async getPreferences(): Promise<UserPreferences> {
    await delay(30);
    return StorageService.getPreferences();
  },

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    await delay(50);
    const current = StorageService.getPreferences();
    const updated = { ...current, ...prefs };
    StorageService.savePreferences(updated);
    return updated;
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
  // POST /api/plans/generate
  // Simulates the future LLM / optimization scheduler logic in UI
  async generateStudyPlan(params: PlanGenerationParams): Promise<StudyPlan> {
    // Step simulation occurs in UI, here we calculate the structured plan
    const subjects = StorageService.getSubjects();
    const allTopics = StorageService.getTopics();
    const deadlines = StorageService.getDeadlines();
    const user = StorageService.getUser();

    // Filter relevant subjects
    const targetSubjects = subjects.filter((s) =>
      params.prioritizedSubjectIds.length > 0 ? params.prioritizedSubjectIds.includes(s.id) : true
    );

    if (targetSubjects.length === 0) {
      throw new Error('Please select at least one subject to generate a study plan.');
    }

    // Collect candidate uncompleted/low-confidence topics
    let candidateTopics: { topic: Topic; subject: Subject; weight: number }[] = [];

    targetSubjects.forEach((sub) => {
      const subTopics = allTopics.filter((t) => t.subjectId === sub.id);
      const subDeadline = deadlines.find((d) => d.subjectId === sub.id);
      let deadlineDays = 30;
      if (subDeadline) {
        const diff = (new Date(subDeadline.dueDate).getTime() - new Date().getTime()) / 86400000;
        deadlineDays = Math.max(1, Math.round(diff));
      }

      subTopics.forEach((topic) => {
        let weight = 50;

        // Weight factors
        if (!topic.completed) weight += 40;
        if (topic.difficulty === 'hard') weight += 30;
        if (topic.difficulty === 'medium') weight += 15;
        if (topic.confidence < 50) weight += (50 - topic.confidence);

        // Priority factors
        if (params.priorities.includes('deadlines')) {
          weight += Math.max(0, 40 - deadlineDays * 2);
        }
        if (params.priorities.includes('weak_topics') && topic.confidence < 60) {
          weight += 35;
        }
        if (params.priorities.includes('exam_prep') && deadlineDays <= 7) {
          weight += 45;
        }

        candidateTopics.push({ topic, subject: sub, weight });
      });
    });

    // Sort candidate topics by calculated weight descending
    candidateTopics.sort((a, b) => b.weight - a.weight);

    // If all completed, fallback to reviewing all topics
    if (candidateTopics.length === 0) {
      targetSubjects.forEach((sub) => {
        const subTopics = allTopics.filter((t) => t.subjectId === sub.id);
        subTopics.forEach((topic) => {
          candidateTopics.push({ topic, subject: sub, weight: 10 });
        });
      });
    }

    // Days mapping (next 7 days)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const generatedItems: GeneratedPlanItem[] = [];
    let topicCursor = 0;

    const baseDate = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDayDate = new Date(baseDate);
      currentDayDate.setDate(baseDate.getDate() + dayOffset);
      const dayName = dayNames[currentDayDate.getDay()];
      const dayKey = dayName.toLowerCase() as keyof typeof params.weeklyAvailability;
      const dateStr = currentDayDate.toISOString().split('T')[0];

      // Available hours for this day
      const dailyAvailableHours =
        params.availabilityMode === 'custom'
          ? params.weeklyAvailability[dayKey] || 0
          : params.dailyHours;

      if (dailyAvailableHours <= 0) continue;

      let remainingMinutes = dailyAvailableHours * 60;
      const sessionDuration = Math.min(params.maxContinuousMinutes, 60);

      // Preferred starting times
      const startTimes =
        params.preferredTime === 'morning'
          ? ['09:00', '10:30', '14:00', '15:30', '19:00']
          : params.preferredTime === 'evening'
          ? ['17:00', '18:30', '20:00', '21:30']
          : ['13:30', '15:00', '16:30', '19:00'];

      let slotIdx = 0;

      while (remainingMinutes >= 30 && candidateTopics.length > 0 && slotIdx < startTimes.length) {
        const selected = candidateTopics[topicCursor % candidateTopics.length];
        topicCursor++;

        const taskDuration = Math.min(
          sessionDuration,
          selected.topic.estimatedMinutes || 60,
          remainingMinutes
        );

        let reason = 'Scheduled based on curriculum priorities.';
        if (selected.topic.confidence < 50) {
          reason = `Low confidence area (${selected.topic.confidence}%) needing reinforcement.`;
        } else if (selected.subject.deadline) {
          reason = `Approaching milestone for ${selected.subject.name}.`;
        }

        generatedItems.push({
          id: generateId('gpi'),
          day: dayName,
          date: dateStr,
          startTime: startTimes[slotIdx],
          subjectId: selected.subject.id,
          topicId: selected.topic.id,
          subjectName: selected.subject.name,
          topicName: selected.topic.name,
          durationMinutes: taskDuration,
          difficulty: selected.topic.difficulty,
          priority: selected.subject.priority,
          reason,
        });

        remainingMinutes -= taskDuration + params.breakMinutes;
        slotIdx++;
      }
    }

    const newPlan: StudyPlan = {
      id: generateId('plan'),
      userId: user.id,
      generatedAt: new Date().toISOString(),
      status: 'draft',
      params,
      items: generatedItems,
    };

    return newPlan;
  },

  // POST /api/plans/:id/accept
  // Converts generated plan items into active task records
  async acceptStudyPlan(plan: StudyPlan): Promise<void> {
    await delay(150);
    const existingTasks = StorageService.getTasks();

    // Map plan items to tasks
    const newTasks: Task[] = plan.items.map((item) => ({
      id: generateId('tsk'),
      subjectId: item.subjectId,
      topicId: item.topicId,
      scheduledDate: item.date,
      startTime: item.startTime,
      duration: item.durationMinutes,
      status: 'pending',
      priority: item.priority,
      notes: `Generated by Study Planner: ${item.reason}`,
    }));

    // Retain completed tasks, append or replace pending tasks
    const mergedTasks = [...existingTasks.filter((t) => t.status === 'completed'), ...newTasks];
    StorageService.saveTasks(mergedTasks);

    // Save accepted plan
    const plans = StorageService.getPlans();
    plans.push({ ...plan, status: 'accepted' });
    StorageService.savePlans(plans);
  },
};
