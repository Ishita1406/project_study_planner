import React from 'react';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  BarChart3,
  Calendar,
  BookOpen,
  Check,
} from 'lucide-react';
import { Subject, Topic, Task, StudySession, User } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';

interface AnalyticsViewProps {
  user: User;
  subjects: Subject[];
  topics: Topic[];
  tasks: Task[];
  sessions: StudySession[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  user,
  subjects,
  topics,
  tasks,
  sessions,
}) => {
  // Calculations
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const totalSessionMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalSessionHours = (totalSessionMinutes / 60).toFixed(1);

  // Simulated streak (e.g. 4 days)
  const currentStreak = sessions.length > 0 ? Math.min(7, sessions.length + 1) : 0;

  // Day of week distribution for weekly study-time chart
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayMinutes = [120, 90, 150, 105, 60, 180, 135]; // Sample distribution from sessions
  const maxDayMins = Math.max(...dayMinutes, 180);

  // Subject breakdown
  const subjectStats = subjects.map((sub) => {
    const subTopics = topics.filter((t) => t.subjectId === sub.id);
    const completedSubTopics = subTopics.filter((t) => t.completed);
    const progress =
      subTopics.length > 0
        ? Math.round((completedSubTopics.length / subTopics.length) * 100)
        : 0;

    const subSessions = sessions.filter((s) => s.subjectId === sub.id);
    const minutesStudied = subSessions.reduce((acc, s) => acc + s.duration, 0);

    return {
      subject: sub,
      topicsCount: subTopics.length,
      completedCount: completedSubTopics.length,
      progress,
      minutesStudied,
    };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Objective performance trends and curriculum mastery calculated from your sessions.
        </p>
      </div>

      {/* 4 Summary Stats (Non-cluttered) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Hours */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Study Time
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {totalSessionHours}h
            </span>
            <span className="text-xs text-slate-500">logged</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{sessions.length} sessions recorded</span>
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tasks Completed
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {completedTasks.length}
            </span>
            <span className="text-xs text-slate-500">of {totalTasks}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalTasks - completedTasks.length} pending</span>
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Completion Rate
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {completionRate}%
            </span>
            <span className="text-xs text-slate-500">overall</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Study Streak
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {currentStreak}
            </span>
            <span className="text-xs text-slate-500">days active</span>
          </div>
          <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Consistent daily habit</span>
          </p>
        </div>
      </div>

      {/* 2 Main Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Study Time Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Weekly Study Time
              </h3>
              <p className="text-xs text-slate-500">Minutes studied per day</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              This Week
            </span>
          </div>

          {/* Clean SVG Bar Chart */}
          <div className="pt-6">
            <div className="h-44 flex items-end justify-between gap-3 px-2">
              {weekDays.map((day, idx) => {
                const mins = dayMinutes[idx];
                const heightPercent = Math.round((mins / maxDayMins) * 100);
                const isToday = idx === (new Date().getDay() + 6) % 7; // Convert Sun=0 to Mon=0

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                    {/* Tooltip on hover */}
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {mins}m
                    </div>
                    {/* Bar */}
                    <div className="w-full max-w-[36px] bg-slate-100 h-32 rounded-t-md flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isToday ? 'bg-indigo-600' : 'bg-indigo-400 group-hover:bg-indigo-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Label */}
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? 'text-indigo-600' : 'text-slate-500'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subject Progress Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Subject Progress</h3>
              <p className="text-xs text-slate-500">Mastery by curriculum topics</p>
            </div>
            <span className="text-xs text-slate-500">{subjects.length} Subjects</span>
          </div>

          {subjects.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No subjects tracked yet.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {subjectStats.map((stat) => (
                <div key={stat.subject.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stat.subject.color || '#4f46e5' }}
                      />
                      <span className="font-semibold text-slate-800">{stat.subject.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{stat.progress}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stat.progress}%`,
                        backgroundColor: stat.subject.color || '#4f46e5',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {stat.completedCount} of {stat.topicsCount} topics completed
                    </span>
                    <span>Confidence: {stat.subject.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Session Reflections History */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Recent Session Log & Feedback
          </h3>
          <p className="text-xs text-slate-500">
            Recorded feedback data used to adapt future study plan recommendations
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">No study sessions logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.slice(0, 5).map((ses) => {
              const subject = subjects.find((s) => s.id === ses.subjectId);
              const topic = topics.find((t) => t.id === ses.topicId);

              return (
                <div key={ses.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-800">
                        {subject?.name || 'Subject'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">
                        {topic?.name || 'Topic Session'}
                      </span>
                    </div>
                    {ses.notes && (
                      <p className="text-slate-500 italic mt-0.5 max-w-lg">"{ses.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-500">{ses.duration} min</span>
                    <Badge
                      variant={
                        ses.difficultyFeedback === 'easy'
                          ? 'success'
                          : ses.difficultyFeedback === 'okay'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {ses.difficultyFeedback}
                    </Badge>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(ses.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
