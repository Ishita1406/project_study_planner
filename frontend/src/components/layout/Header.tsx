import React from 'react';
import { Play, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { ActiveView } from '../../types';

interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  activeSessionDuration?: number; // seconds
  isSessionRunning?: boolean;
  onQuickAddSubject?: () => void;
  onQuickAddTask?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  activeSessionDuration = 0,
  isSessionRunning = false,
  onQuickAddSubject,
  onQuickAddTask,
}) => {
  const titles: Record<ActiveView, { title: string; subtitle?: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your learning progress and upcoming tasks',
    },
    planner: {
      title: 'My Planner',
      subtitle: 'Interactive schedule and study calendar',
    },
    subjects: {
      title: 'Subjects & Topics',
      subtitle: 'Manage your enrolled courses, syllabi, and mastery confidence',
    },
    sessions: {
      title: 'Study Session',
      subtitle: 'Distraction-free focus timer and session feedback',
    },
    analytics: {
      title: 'Study Analytics',
      subtitle: 'Performance trends, completion rates, and subject distribution',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Preferences, schedule availability, and integrations',
    },
    'generate-plan': {
      title: 'Create Your Study Plan',
      subtitle: 'Provide your available time and priorities to generate an adaptive schedule',
    },
  };

  const currentInfo = titles[currentView] || { title: 'Study Planner' };

  // Format active session seconds into mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
          {currentInfo.title}
        </h2>
        <p className="text-xs text-slate-500 mt-1 hidden sm:block">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Session Indicator */}
        {isSessionRunning && (
          <button
            onClick={() => onNavigate('sessions')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold hover:bg-emerald-100/70 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Play className="w-3 h-3 fill-emerald-600" />
            <span>In Focus ({formatTimer(activeSessionDuration)})</span>
          </button>
        )}

        {/* Date Display */}
        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 hidden md:inline-block">
          {todayFormatted}
        </span>

        {/* Contextual Quick Actions */}
        {currentView === 'subjects' && onQuickAddSubject && (
          <button
            id="header-add-subject-btn"
            onClick={onQuickAddSubject}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        )}

        {currentView === 'planner' && onQuickAddTask && (
          <button
            id="header-add-task-btn"
            onClick={onQuickAddTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}

        {currentView !== 'generate-plan' && currentView !== 'subjects' && currentView !== 'planner' && (
          <button
            id="header-plan-btn"
            onClick={() => onNavigate('generate-plan')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Generate Plan</span>
          </button>
        )}
      </div>
    </header>
  );
};
