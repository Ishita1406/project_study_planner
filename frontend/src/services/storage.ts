/**
 * Storage service managing local persistence and synchronization.
 * Supports loading, updating, clearing, and resetting state.
 */

import { Subject, Topic, Task, Deadline, User, StudySession, UserPreferences, StudyPlan } from '../types';
import {
  INITIAL_USER,
  INITIAL_PREFERENCES,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
  INITIAL_TASKS,
  INITIAL_DEADLINES,
  INITIAL_SESSIONS,
} from './seedData';

const KEYS = {
  USER: 'sp_user_v1',
  PREFERENCES: 'sp_preferences_v1',
  SUBJECTS: 'sp_subjects_v1',
  TOPICS: 'sp_topics_v1',
  TASKS: 'sp_tasks_v1',
  DEADLINES: 'sp_deadlines_v1',
  SESSIONS: 'sp_sessions_v1',
  PLANS: 'sp_plans_v1',
};

// Safe JSON parser
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('study-planner-data-changed', { detail: { key } }));
  } catch (err) {
    console.error('Storage write error', err);
  }
}

export const StorageService = {
  getUser: (): User => getItem<User>(KEYS.USER, INITIAL_USER),
  saveUser: (user: User) => setItem(KEYS.USER, user),

  getPreferences: (): UserPreferences => getItem<UserPreferences>(KEYS.PREFERENCES, INITIAL_PREFERENCES),
  savePreferences: (prefs: UserPreferences) => setItem(KEYS.PREFERENCES, prefs),

  getSubjects: (): Subject[] => getItem<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS),
  saveSubjects: (subjects: Subject[]) => setItem(KEYS.SUBJECTS, subjects),

  getTopics: (): Topic[] => getItem<Topic[]>(KEYS.TOPICS, INITIAL_TOPICS),
  saveTopics: (topics: Topic[]) => setItem(KEYS.TOPICS, topics),

  getTasks: (): Task[] => getItem<Task[]>(KEYS.TASKS, INITIAL_TASKS),
  saveTasks: (tasks: Task[]) => setItem(KEYS.TASKS, tasks),

  getDeadlines: (): Deadline[] => getItem<Deadline[]>(KEYS.DEADLINES, INITIAL_DEADLINES),
  saveDeadlines: (deadlines: Deadline[]) => setItem(KEYS.DEADLINES, deadlines),

  getSessions: (): StudySession[] => getItem<StudySession[]>(KEYS.SESSIONS, INITIAL_SESSIONS),
  saveSessions: (sessions: StudySession[]) => setItem(KEYS.SESSIONS, sessions),

  getPlans: (): StudyPlan[] => getItem<StudyPlan[]>(KEYS.PLANS, []),
  savePlans: (plans: StudyPlan[]) => setItem(KEYS.PLANS, plans),

  // Reset to realistic development seed data
  resetToSeedData: () => {
    localStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(INITIAL_PREFERENCES));
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(KEYS.TOPICS, JSON.stringify(INITIAL_TOPICS));
    localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(KEYS.DEADLINES, JSON.stringify(INITIAL_DEADLINES));
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(KEYS.PLANS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('study-planner-data-changed', { detail: { reset: true } }));
  },

  // Clear all data to test empty states
  clearAllData: () => {
    localStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(INITIAL_PREFERENCES));
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify([]));
    localStorage.setItem(KEYS.TOPICS, JSON.stringify([]));
    localStorage.setItem(KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(KEYS.DEADLINES, JSON.stringify([]));
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.PLANS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('study-planner-data-changed', { detail: { reset: true } }));
  },
};
