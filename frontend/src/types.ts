/**
 * Conceptual Database Entities & TypeScript Interfaces
 * Corresponds to future FastAPI / PostgreSQL schema.
 */

export type PriorityLevel = 'low' | 'medium' | 'high';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type SessionFeedback = 'easy' | 'okay' | 'difficult';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface User {
  id: string;
  name: string;
  email: string;
  targetSemester: string;
  weeklyGoalHours: number;
  avatarUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  deadline?: string; // YYYY-MM-DD
  examName?: string;
  difficulty: DifficultyLevel;
  confidence: number; // 0 - 100
  priority: PriorityLevel;
  color: string; // e.g. '#3b82f6'
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  difficulty: DifficultyLevel;
  confidence: number; // 0 - 100
  estimatedMinutes: number;
  completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  subjectId: string;
  topicId: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour format)
  duration: number; // minutes
  status: TaskStatus;
  priority: PriorityLevel;
  notes?: string;
  completedAt?: string;
}

export interface StudySession {
  id: string;
  taskId?: string;
  subjectId: string;
  topicId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // minutes
  difficultyFeedback: SessionFeedback;
  confidence: number; // 0 - 100
  notes?: string;
  createdAt: string;
}

export interface Deadline {
  id: string;
  subjectId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  type: 'exam' | 'assignment' | 'project' | 'quiz';
  priority: PriorityLevel;
}

export interface WeeklyAvailability {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export type PlanningPriorityOption = 'deadlines' | 'weak_topics' | 'balanced' | 'exam_prep';
export type PreferredTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'flexible';

export interface PlanGenerationParams {
  availabilityMode: 'daily' | 'custom';
  dailyHours: number;
  weeklyAvailability: WeeklyAvailability;
  prioritizedSubjectIds: string[];
  priorities: PlanningPriorityOption[];
  preferredTime: PreferredTimeOfDay;
  maxContinuousMinutes: number;
  breakMinutes: number;
  additionalNotes?: string;
}

export interface GeneratedPlanItem {
  id: string;
  day: string; // 'Monday', 'Tuesday', etc.
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  durationMinutes: number;
  difficulty: DifficultyLevel;
  priority: PriorityLevel;
  reason: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  generatedAt: string;
  status: 'draft' | 'accepted' | 'archived';
  params: PlanGenerationParams;
  items: GeneratedPlanItem[];
}

export interface UserPreferences {
  defaultDailyHours: number;
  weeklyAvailability: WeeklyAvailability;
  maxContinuousMinutes: number;
  breakMinutes: number;
  preferredTime: PreferredTimeOfDay;
  notifyReminders: boolean;
  notifyDeadlines: boolean;
  googleCalendarSync: boolean;
}

export type ActiveView = 
  | 'dashboard'
  | 'planner'
  | 'subjects'
  | 'sessions'
  | 'analytics'
  | 'settings'
  | 'generate-plan';
