/**
 * Study Planner - Adaptive Student Productivity System
 * Frontend Prototype with Modular API & Database-ready Schema
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActiveView,
  User,
  UserPreferences,
  Subject,
  Topic,
  Task,
  Deadline,
  StudySession,
  StudyPlan,
  PlanGenerationParams,
} from './types';
import { apiClient } from './services/apiClient';
import { StorageService } from './services/storage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { SubjectsView } from './components/subjects/SubjectsView';
import { PlannerView } from './components/planner/PlannerView';
import { PlanGeneratorView } from './components/generator/PlanGeneratorView';
import { StudySessionView } from './components/session/StudySessionView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { NotificationPanel } from './components/common/NotificationPanel';
import { AddDeadlineModal } from './components/common/AddDeadlineModal';
import { AddSubjectModal } from './components/subjects/AddSubjectModal';
import { AddTaskModal } from './components/planner/AddTaskModal';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');

  // Core Data States
  const [user, setUser] = useState<User>(StorageService.getUser());
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getPreferences());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Session & Modal States
  const [activeSessionTaskId, setActiveSessionTaskId] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddDeadlineOpen, setIsAddDeadlineOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load all entities from API client
  const refreshAllData = useCallback(async () => {
    try {
      const [u, prefs, subs, tops, tsks, ddls, sess] = await Promise.all([
        apiClient.getUser(),
        apiClient.getPreferences(),
        apiClient.getSubjects(),
        apiClient.getTopics(),
        apiClient.getTasks(),
        apiClient.getDeadlines(),
        apiClient.getStudySessions(),
      ]);

      setUser(u);
      setPreferences(prefs);
      setSubjects(subs);
      setTopics(tops);
      setTasks(tsks);
      setDeadlines(ddls);
      setSessions(sess);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();

    // Listen to local persistence updates
    const handleStorageChange = () => {
      refreshAllData();
    };

    window.addEventListener('study-planner-data-changed', handleStorageChange);
    return () => window.removeEventListener('study-planner-data-changed', handleStorageChange);
  }, [refreshAllData]);

  // Handlers for User & Preferences
  const handleUpdateUser = async (updated: Partial<User>) => {
    const res = await apiClient.updateUser(updated);
    setUser(res);
    showToast('Profile updated');
    return res;
  };

  const handleUpdatePreferences = async (updated: Partial<UserPreferences>) => {
    const res = await apiClient.updatePreferences(updated);
    setPreferences(res);
    showToast('Preferences saved');
    return res;
  };

  // Handlers for Subjects
  const handleAddSubject = async (data: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSub = await apiClient.createSubject(data);
    await refreshAllData();
    showToast(`Subject "${newSub.name}" added`);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    await apiClient.deleteSubject(subjectId);
    await refreshAllData();
    showToast('Subject deleted');
  };

  // Handlers for Topics
  const handleAddTopic = async (data: Omit<Topic, 'id'>) => {
    await apiClient.createTopic(data);
    await refreshAllData();
    showToast(`Topic "${data.name}" added`);
  };

  const handleDeleteTopic = async (topicId: string) => {
    await apiClient.deleteTopic(topicId);
    await refreshAllData();
    showToast('Topic deleted');
  };

  const handleToggleTopicCompleted = async (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    await apiClient.updateTopic(topicId, { completed: !topic.completed });
    await refreshAllData();
  };

  // Handlers for Tasks
  const handleToggleTaskStatus = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await apiClient.updateTask(taskId, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
    await refreshAllData();
    showToast(newStatus === 'completed' ? 'Task marked complete' : 'Task marked pending');
  };

  const handleAddTask = async (data: Omit<Task, 'id'>) => {
    await apiClient.createTask(data);
    await refreshAllData();
    showToast('Study session scheduled');
  };

  const handleUpdateTaskDate = async (taskId: string, newDate: string) => {
    await apiClient.updateTask(taskId, { scheduledDate: newDate });
    await refreshAllData();
    showToast('Task rescheduled');
  };

  const handleRebalancePlan = async (taskId: string, newDate: string) => {
    await apiClient.rebalancePlan(taskId, newDate);
    await refreshAllData();
    showToast('Study schedule rebalanced');
  };

  const handleDeleteTask = async (taskId: string) => {
    await apiClient.deleteTask(taskId);
    await refreshAllData();
    showToast('Task removed from schedule');
  };

  // Handlers for Sessions & Timer
  const handleStartSession = (taskId: string) => {
    setActiveSessionTaskId(taskId);
    setCurrentView('sessions');
  };

  const handleSaveStudySession = async (
    sessionData: Omit<StudySession, 'id' | 'createdAt'>
  ) => {
    await apiClient.createStudySession(sessionData);
    await refreshAllData();
    showToast('Session logged & progress updated');
  };

  // Handlers for Plan Generator
  const handleGeneratePlan = async (params: PlanGenerationParams): Promise<StudyPlan> => {
    return await apiClient.generateStudyPlan(params);
  };

  const handleAcceptPlan = async (plan: StudyPlan) => {
    await apiClient.acceptStudyPlan(plan);
    await refreshAllData();
    showToast('Adaptive study plan applied to your calendar');
  };

  // Deadlines
  const handleAddDeadline = async (data: Omit<Deadline, 'id'>) => {
    await apiClient.createDeadline(data);
    await refreshAllData();
    showToast('Deadline added');
  };

  // Prototype Data Resets
  const handleResetSeedData = () => {
    StorageService.resetToSeedData();
    refreshAllData();
    showToast('Reset to development seed data (DBMS, Math, OS)');
  };

  const handleClearData = () => {
    StorageService.clearAllData();
    refreshAllData();
    showToast('All data cleared (Empty state mode)');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationsCount={
          deadlines.filter((d) => {
            const diff = (new Date(d.dueDate).getTime() - new Date().getTime()) / 86400000;
            return diff >= 0 && diff <= 7;
          }).length
        }
        onResetSeedData={handleResetSeedData}
        onClearData={handleClearData}
        isSessionActive={currentView === 'sessions'}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onNavigate={setCurrentView}
          isSessionRunning={currentView === 'sessions'}
          onQuickAddSubject={() => setIsAddSubjectOpen(true)}
          onQuickAddTask={() => setIsAddTaskOpen(true)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              user={user}
              subjects={subjects}
              topics={topics}
              tasks={tasks}
              deadlines={deadlines}
              onNavigate={setCurrentView}
              onToggleTaskStatus={handleToggleTaskStatus}
              onStartSession={handleStartSession}
              onDeleteTask={handleDeleteTask}
              onOpenAddDeadline={() => setIsAddDeadlineOpen(true)}
            />
          )}

          {currentView === 'planner' && (
            <PlannerView
              subjects={subjects}
              topics={topics}
              tasks={tasks}
              onToggleTaskStatus={handleToggleTaskStatus}
              onAddTask={handleAddTask}
              onUpdateTaskDate={handleUpdateTaskDate}
              onRebalancePlan={handleRebalancePlan}
              onDeleteTask={handleDeleteTask}
              onStartSession={handleStartSession}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              topics={topics}
              deadlines={deadlines}
              onAddSubject={handleAddSubject}
              onDeleteSubject={handleDeleteSubject}
              onAddTopic={handleAddTopic}
              onDeleteTopic={handleDeleteTopic}
              onToggleTopicCompleted={handleToggleTopicCompleted}
            />
          )}

          {currentView === 'generate-plan' && (
            <PlanGeneratorView
              subjects={subjects}
              topics={topics}
              deadlines={deadlines}
              onGeneratePlan={handleGeneratePlan}
              onAcceptPlan={handleAcceptPlan}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'sessions' && (
            <StudySessionView
              subjects={subjects}
              topics={topics}
              tasks={tasks}
              initialTaskId={activeSessionTaskId}
              onSaveSession={handleSaveStudySession}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView
              user={user}
              subjects={subjects}
              topics={topics}
              tasks={tasks}
              sessions={sessions}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              user={user}
              preferences={preferences}
              onUpdateUser={handleUpdateUser}
              onUpdatePreferences={handleUpdatePreferences}
              onResetSeedData={handleResetSeedData}
              onClearData={handleClearData}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        deadlines={deadlines}
        tasks={tasks}
        onNavigateToPlanner={() => {
          setIsNotificationOpen(false);
          setCurrentView('planner');
        }}
      />

      <AddDeadlineModal
        isOpen={isAddDeadlineOpen}
        onClose={() => setIsAddDeadlineOpen(false)}
        subjects={subjects}
        onAddDeadline={handleAddDeadline}
      />

      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onAddSubject={handleAddSubject}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        subjects={subjects}
        topics={topics}
        onAddTask={handleAddTask}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
