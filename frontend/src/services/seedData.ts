/**
 * Development Seed Data
 * Conceptually mirrors initial records in PostgreSQL database.
 * Used for development visualization. All values are editable/deletable.
 */

import { Subject, Topic, Task, Deadline, User, StudySession, UserPreferences } from '../types';

// Helper to calculate dynamic dates relative to today
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_USER: User = {
  id: 'usr_default_01',
  name: 'Alex Chen',
  email: 'alex.chen@university.edu',
  targetSemester: 'Fall Semester 2026',
  weeklyGoalHours: 20,
};

export const INITIAL_PREFERENCES: UserPreferences = {
  defaultDailyHours: 3.5,
  weeklyAvailability: {
    monday: 3,
    tuesday: 2.5,
    wednesday: 4,
    thursday: 3,
    friday: 2,
    saturday: 5,
    sunday: 4,
  },
  maxContinuousMinutes: 60,
  breakMinutes: 15,
  preferredTime: 'morning',
  notifyReminders: true,
  notifyDeadlines: true,
  googleCalendarSync: false,
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_dbms',
    name: 'Database Management Systems',
    code: 'CS 340',
    description: 'Relational data models, normalization, indexing, and SQL optimization.',
    deadline: getRelativeDate(5),
    examName: 'DBMS Final Exam',
    difficulty: 'hard',
    confidence: 68,
    priority: 'high',
    color: '#2563eb', // Blue
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'sub_math',
    name: 'Mathematics',
    code: 'MATH 220',
    description: 'Linear algebra, probability distributions, and statistical inference.',
    deadline: getRelativeDate(9),
    examName: 'Probability Assignment',
    difficulty: 'hard',
    confidence: 54,
    priority: 'high',
    color: '#7c3aed', // Purple
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'sub_os',
    name: 'Operating Systems',
    code: 'CS 320',
    description: 'Process management, concurrency, virtual memory, and file systems.',
    deadline: getRelativeDate(14),
    examName: 'OS Midterm Assessment',
    difficulty: 'medium',
    confidence: 42,
    priority: 'medium',
    color: '#0284c7', // Sky
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const INITIAL_TOPICS: Topic[] = [
  // DBMS topics
  {
    id: 'top_dbms_1',
    subjectId: 'sub_dbms',
    name: 'ER Model & Relational Schema',
    difficulty: 'easy',
    confidence: 85,
    estimatedMinutes: 45,
    completed: true,
    order: 1,
  },
  {
    id: 'top_dbms_2',
    subjectId: 'sub_dbms',
    name: 'Relational Algebra',
    difficulty: 'medium',
    confidence: 80,
    estimatedMinutes: 60,
    completed: true,
    order: 2,
  },
  {
    id: 'top_dbms_3',
    subjectId: 'sub_dbms',
    name: 'Normalization (1NF, 2NF, 3NF, BCNF)',
    difficulty: 'hard',
    confidence: 45,
    estimatedMinutes: 60,
    completed: false,
    order: 3,
  },
  {
    id: 'top_dbms_4',
    subjectId: 'sub_dbms',
    name: 'Transactions & ACID Properties',
    difficulty: 'medium',
    confidence: 50,
    estimatedMinutes: 75,
    completed: false,
    order: 4,
  },
  {
    id: 'top_dbms_5',
    subjectId: 'sub_dbms',
    name: 'Indexing & B-Trees',
    difficulty: 'hard',
    confidence: 40,
    estimatedMinutes: 60,
    completed: false,
    order: 5,
  },

  // Math topics
  {
    id: 'top_math_1',
    subjectId: 'sub_math',
    name: 'Linear Algebra Review',
    difficulty: 'easy',
    confidence: 90,
    estimatedMinutes: 45,
    completed: true,
    order: 1,
  },
  {
    id: 'top_math_2',
    subjectId: 'sub_math',
    name: 'Probability Basics & Bayes Theorem',
    difficulty: 'medium',
    confidence: 50,
    estimatedMinutes: 45,
    completed: false,
    order: 2,
  },
  {
    id: 'top_math_3',
    subjectId: 'sub_math',
    name: 'Random Variables & Expectation',
    difficulty: 'hard',
    confidence: 40,
    estimatedMinutes: 60,
    completed: false,
    order: 3,
  },
  {
    id: 'top_math_4',
    subjectId: 'sub_math',
    name: 'Continuous Distributions (Normal, Poisson)',
    difficulty: 'hard',
    confidence: 35,
    estimatedMinutes: 60,
    completed: false,
    order: 4,
  },

  // OS topics
  {
    id: 'top_os_1',
    subjectId: 'sub_os',
    name: 'Processes & Threads',
    difficulty: 'easy',
    confidence: 80,
    estimatedMinutes: 45,
    completed: true,
    order: 1,
  },
  {
    id: 'top_os_2',
    subjectId: 'sub_os',
    name: 'CPU Scheduling Algorithms',
    difficulty: 'medium',
    confidence: 50,
    estimatedMinutes: 60,
    completed: false,
    order: 2,
  },
  {
    id: 'top_os_3',
    subjectId: 'sub_os',
    name: 'Memory Management & Paging',
    difficulty: 'hard',
    confidence: 38,
    estimatedMinutes: 75,
    completed: false,
    order: 3,
  },
  {
    id: 'top_os_4',
    subjectId: 'sub_os',
    name: 'Virtual Memory & Page Replacement',
    difficulty: 'hard',
    confidence: 30,
    estimatedMinutes: 60,
    completed: false,
    order: 4,
  },
];

export const INITIAL_TASKS: Task[] = [
  // Today's scheduled tasks
  {
    id: 'tsk_today_1',
    subjectId: 'sub_dbms',
    topicId: 'top_dbms_3',
    scheduledDate: getRelativeDate(0),
    startTime: '09:00',
    duration: 60,
    status: 'pending',
    priority: 'high',
    notes: 'Focus on 3NF vs BCNF decomposition examples.',
  },
  {
    id: 'tsk_today_2',
    subjectId: 'sub_math',
    topicId: 'top_math_2',
    scheduledDate: getRelativeDate(0),
    startTime: '11:00',
    duration: 45,
    status: 'pending',
    priority: 'high',
    notes: 'Complete practice problem set 4.',
  },
  {
    id: 'tsk_today_3',
    subjectId: 'sub_os',
    topicId: 'top_os_2',
    scheduledDate: getRelativeDate(0),
    startTime: '14:30',
    duration: 60,
    status: 'pending',
    priority: 'medium',
    notes: 'Review Round Robin and Multi-Level Queue scheduling.',
  },

  // Tomorrow's tasks
  {
    id: 'tsk_tmrw_1',
    subjectId: 'sub_dbms',
    topicId: 'top_dbms_4',
    scheduledDate: getRelativeDate(1),
    startTime: '09:30',
    duration: 75,
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'tsk_tmrw_2',
    subjectId: 'sub_math',
    topicId: 'top_math_3',
    scheduledDate: getRelativeDate(1),
    startTime: '13:00',
    duration: 60,
    status: 'pending',
    priority: 'medium',
  },

  // Day + 2 tasks
  {
    id: 'tsk_day2_1',
    subjectId: 'sub_os',
    topicId: 'top_os_3',
    scheduledDate: getRelativeDate(2),
    startTime: '10:00',
    duration: 75,
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'tsk_day2_2',
    subjectId: 'sub_dbms',
    topicId: 'top_dbms_5',
    scheduledDate: getRelativeDate(2),
    startTime: '14:00',
    duration: 60,
    status: 'pending',
    priority: 'medium',
  },
];

export const INITIAL_DEADLINES: Deadline[] = [
  {
    id: 'ddl_1',
    subjectId: 'sub_dbms',
    title: 'DBMS Final Exam',
    dueDate: getRelativeDate(5),
    type: 'exam',
    priority: 'high',
  },
  {
    id: 'ddl_2',
    subjectId: 'sub_math',
    title: 'Mathematics Assignment 4',
    dueDate: getRelativeDate(9),
    type: 'assignment',
    priority: 'high',
  },
  {
    id: 'ddl_3',
    subjectId: 'sub_os',
    title: 'OS Midterm Assessment',
    dueDate: getRelativeDate(14),
    type: 'exam',
    priority: 'medium',
  },
];

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 'ses_1',
    subjectId: 'sub_dbms',
    topicId: 'top_dbms_1',
    startTime: new Date(Date.now() - 3 * 86400000 - 3600000).toISOString(),
    endTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    duration: 60,
    difficultyFeedback: 'easy',
    confidence: 85,
    notes: 'Reviewed entity relationships and cardinalities clearly.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'ses_2',
    subjectId: 'sub_math',
    topicId: 'top_math_1',
    startTime: new Date(Date.now() - 2 * 86400000 - 3000000).toISOString(),
    endTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    duration: 50,
    difficultyFeedback: 'okay',
    confidence: 80,
    notes: 'Matrix transformations solved without errors.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ses_3',
    subjectId: 'sub_os',
    topicId: 'top_os_1',
    startTime: new Date(Date.now() - 1 * 86400000 - 3600000).toISOString(),
    endTime: new Date(Date.now() - 1 * 86400000).toISOString(),
    duration: 60,
    difficultyFeedback: 'okay',
    confidence: 75,
    notes: 'Process control blocks and context switching concepts understood.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];
