import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  MoreVertical,
  ArrowRight,
  Plus,
  AlertCircle,
  BookOpen,
  Trash2,
  Edit2,
  BarChart2,
} from 'lucide-react';
import { Subject, Topic, Task, Deadline, User, ActiveView } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  user: User;
  subjects: Subject[];
  topics: Topic[];
  tasks: Task[];
  deadlines: Deadline[];
  onNavigate: (view: ActiveView) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onStartSession: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddDeadline: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  subjects,
  topics,
  tasks,
  deadlines,
  onNavigate,
  onToggleTaskStatus,
  onStartSession,
  onDeleteTask,
  onOpenAddDeadline,
}) => {
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);

  // Today's date calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr);

  // Dynamic calculations from database state
  const completedToday = todayTasks.filter((t) => t.status === 'completed');
  const pendingToday = todayTasks.filter((t) => t.status === 'pending');
  const todayProgressPercent =
    todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;

  const totalStudyMinutesToday = todayTasks.reduce((acc, t) => acc + t.duration, 0);
  const studyHoursToday = Math.floor(totalStudyMinutesToday / 60);
  const studyMinsToday = totalStudyMinutesToday % 60;
  const studyTimeFormatted =
    studyHoursToday > 0 ? `${studyHoursToday}h ${studyMinsToday > 0 ? `${studyMinsToday}m` : ''}` : `${studyMinsToday}m`;

  // Sorted upcoming deadlines
  const sortedDeadlines = [...deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const nextDeadline = sortedDeadlines[0];

  const getDeadlineDaysRemaining = (dueDate: string) => {
    const diff = (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  // Calculate subject progress from actual topics
  const getSubjectProgress = (subjectId: string) => {
    const subTopics = topics.filter((t) => t.subjectId === subjectId);
    if (subTopics.length === 0) return 0;
    const completed = subTopics.filter((t) => t.completed).length;
    return Math.round((completed / subTopics.length) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good morning, {user.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here's your study plan for today.</p>
        </div>

        <button
          id="dashboard-generate-plan-top-btn"
          onClick={() => onNavigate('generate-plan')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Study Plan</span>
        </button>
      </div>

      {/* 2. Top Summary Metrics (Spacious, clean, non-cluttered) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Today's Progress
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {todayTasks.length > 0 ? `${todayProgressPercent}%` : '0%'}
            </span>
            <span className="text-xs text-slate-500">
              ({completedToday.length}/{todayTasks.length} tasks)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Study Time */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Time</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {todayTasks.length > 0 ? studyTimeFormatted : '0m'}
            </span>
            <span className="text-xs text-slate-500">planned</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Target: {user.weeklyGoalHours}h / week</span>
          </p>
        </div>

        {/* Metric 3: Tasks Remaining */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tasks Remaining
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {pendingToday.length}
            </span>
            <span className="text-xs text-slate-500">to complete</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{completedToday.length} completed</span>
          </p>
        </div>

        {/* Metric 4: Upcoming Deadline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Upcoming Deadline
          </p>
          {nextDeadline ? (
            <>
              <div className="mt-2">
                <span className="text-base sm:text-lg font-bold text-slate-900 block truncate">
                  {subjects.find((s) => s.id === nextDeadline.subjectId)?.name || nextDeadline.title}
                </span>
                <span className="text-xs text-slate-500 block truncate">{nextDeadline.title}</span>
              </div>
              <p className="text-xs font-semibold text-amber-700 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {getDeadlineDaysRemaining(nextDeadline.dueDate) <= 0
                    ? 'Due Today'
                    : `${getDeadlineDaysRemaining(nextDeadline.dueDate)} days remaining`}
                </span>
              </p>
            </>
          ) : (
            <div className="mt-2">
              <span className="text-sm text-slate-400 italic">No deadlines set</span>
              <button
                onClick={onOpenAddDeadline}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-3 block"
              >
                + Add deadline
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Today's Plan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Today's Plan</h2>
              <p className="text-xs text-slate-500">Your scheduled study tasks for today</p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No study tasks scheduled for today"
              description="Create your adaptive study plan or manually add topics to begin your study session."
              actionLabel="Generate Study Plan"
              onAction={() => onNavigate('generate-plan')}
              secondaryActionLabel="Add Subject First"
              onSecondaryAction={() => onNavigate('subjects')}
            />
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const subject = subjects.find((s) => s.id === task.subjectId);
                const topic = topics.find((t) => t.id === task.topicId);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'border-slate-200/70 bg-slate-50/40 opacity-75'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Left: Time & Subject Info */}
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox toggle */}
                      <button
                        onClick={() => onToggleTaskStatus(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title={isCompleted ? 'Mark pending' : 'Mark completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {task.startTime}
                          </span>
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: subject?.color || '#4f46e5' }}
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            {subject?.name || 'Subject'}
                          </span>
                          <Badge
                            variant={
                              task.priority === 'high'
                                ? 'danger'
                                : task.priority === 'medium'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {task.priority}
                          </Badge>
                        </div>

                        <h4
                          className={`text-sm font-semibold tracking-tight ${
                            isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                          }`}
                        >
                          {topic?.name || 'Topic Session'}
                        </h4>

                        {task.notes && (
                          <p className="text-xs text-slate-500 mt-1 max-w-md">{task.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Duration, Start Action, Options */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.duration} min</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCompleted ? (
                          <button
                            onClick={() => onStartSession(task.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Start</span>
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md">
                            Done
                          </span>
                        )}

                        <div className="relative">
                          <button
                            onClick={() =>
                              setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {taskMenuOpen === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                              <button
                                onClick={() => {
                                  onToggleTaskStatus(task.id);
                                  setTaskMenuOpen(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isCompleted ? 'Mark Pending' : 'Mark Complete'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteTask(task.id);
                                  setTaskMenuOpen(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Task</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan Generation Callout Area */}
          <div className="mt-6 p-6 rounded-xl border border-indigo-100 bg-indigo-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Need a study plan?</span>
              </h3>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                Tell us how much time you have and we'll create a plan around your deadlines and
                confidence levels.
              </p>
            </div>
            <button
              onClick={() => onNavigate('generate-plan')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Generate Study Plan
            </button>
          </div>
        </div>

        {/* Right 1 Column: Upcoming Deadlines & Subject Progress */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Upcoming Deadlines
                </h3>
                <p className="text-xs text-slate-500">Upcoming exams & assignments</p>
              </div>
              <button
                onClick={onOpenAddDeadline}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {deadlines.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">No deadlines scheduled.</p>
            ) : (
              <div className="space-y-3">
                {sortedDeadlines.slice(0, 3).map((dl) => {
                  const subject = subjects.find((s) => s.id === dl.subjectId);
                  const daysLeft = getDeadlineDaysRemaining(dl.dueDate);
                  return (
                    <div
                      key={dl.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {dl.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {subject?.name || 'Subject'} • {new Date(dl.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
                          daysLeft <= 5
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : daysLeft <= 10
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        {daysLeft <= 0 ? 'Today' : `${daysLeft} days remaining`}
                      </span>
                    </div>
                  );
                })}

                {deadlines.length > 3 && (
                  <button
                    onClick={() => onNavigate('subjects')}
                    className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 pt-1 block cursor-pointer"
                  >
                    View all ({deadlines.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Study Progress by Subject */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Study Progress</h3>
                <p className="text-xs text-slate-500">Calculated from completed topics</p>
              </div>
              <button
                onClick={() => onNavigate('subjects')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                View Subjects
              </button>
            </div>

            {subjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No subjects added"
                description="Add your first subject to start tracking progress."
                actionLabel="Add Subject"
                onAction={() => onNavigate('subjects')}
              />
            ) : (
              <div className="space-y-4">
                {subjects.map((sub) => {
                  const progress = getSubjectProgress(sub.id);
                  const subTopics = topics.filter((t) => t.subjectId === sub.id);
                  const completedTopics = subTopics.filter((t) => t.completed).length;

                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate pr-2">
                          {sub.name}
                        </span>
                        <span className="font-bold text-slate-700 shrink-0">{progress}%</span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: sub.color || '#4f46e5',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {completedTopics} of {subTopics.length} topics mastered
                        </span>
                        <span>Confidence: {sub.confidence}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
