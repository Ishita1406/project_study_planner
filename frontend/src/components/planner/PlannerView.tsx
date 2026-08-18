import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Filter,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { Subject, Topic, Task, ActiveView } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { AddTaskModal } from './AddTaskModal';
import { RebalanceModal } from './RebalanceModal';

interface PlannerViewProps {
  subjects: Subject[];
  topics: Topic[];
  tasks: Task[];
  onToggleTaskStatus: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTaskDate: (taskId: string, newDate: string) => void;
  onRebalancePlan: (taskId: string, newDate: string) => void;
  onDeleteTask: (taskId: string) => void;
  onStartSession: (taskId: string) => void;
  onNavigate: (view: ActiveView) => void;
}

type CalendarViewMode = 'day' | 'week' | 'month';

export const PlannerView: React.FC<PlannerViewProps> = ({
  subjects,
  topics,
  tasks,
  onToggleTaskStatus,
  onAddTask,
  onUpdateTaskDate,
  onRebalancePlan,
  onDeleteTask,
  onStartSession,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [currentDateOffset, setCurrentDateOffset] = useState<number>(0); // days offset from today

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskInitialDate, setAddTaskInitialDate] = useState<string | undefined>();

  // Reschedule / Rebalance modal state
  const [rebalanceTask, setRebalanceTask] = useState<{
    task: Task;
    targetDate: string;
  } | null>(null);

  // Drag & drop state simulation
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Base current date
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + currentDateOffset);

  // Helper to format YYYY-MM-DD
  const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

  // Helper to get array of dates for the current view
  const getVisibleDates = (): Date[] => {
    if (viewMode === 'day') {
      return [new Date(baseDate)];
    }

    if (viewMode === 'week') {
      // Find starting Sunday/Monday of the week
      const curr = new Date(baseDate);
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // start on Monday
      const monday = new Date(curr.setDate(diff));

      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const next = new Date(monday);
        next.setDate(monday.getDate() + i);
        days.push(next);
      }
      return days;
    }

    // Month view: show 14 days preview window
    const days: Date[] = [];
    const start = new Date(baseDate);
    start.setDate(1); // 1st of month
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const visibleDates = getVisibleDates();

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedSubjectFilter !== 'all' && t.subjectId !== selectedSubjectFilter) {
      return false;
    }
    return true;
  });

  // Handle Drag Over & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.scheduledDate === targetDateStr) {
      setDraggedTaskId(null);
      return;
    }

    // Prompt rebalance modal
    setRebalanceTask({ task, targetDate: targetDateStr });
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setCurrentDateOffset((prev) => prev - (viewMode === 'day' ? 1 : 7))}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDateOffset(0)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDateOffset((prev) => prev + (viewMode === 'day' ? 1 : 7))}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-slate-900">
            {visibleDates[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {visibleDates.length > 1 &&
              ` – ${visibleDates[visibleDates.length - 1]?.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`}
          </span>
        </div>

        {/* View Mode & Subject Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize cursor-pointer transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Add Task Button */}
          <button
            id="planner-add-task-btn"
            onClick={() => {
              setAddTaskInitialDate(formatDateISO(new Date()));
              setIsAddTaskOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 2. Drag & Drop Helper Prompt */}
      <div className="text-xs text-slate-500 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Tip: Drag tasks between columns to reschedule or rebalance your study plan.</span>
        </span>
        <span>{filteredTasks.length} tasks scheduled</span>
      </div>

      {/* 3. Calendar Grid */}
      {viewMode === 'day' ? (
        /* DAY VIEW */
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {visibleDates[0].toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <p className="text-xs text-slate-500">Scheduled study sessions for this date</p>
            </div>
            <button
              onClick={() => {
                setAddTaskInitialDate(formatDateISO(visibleDates[0]));
                setIsAddTaskOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </button>
          </div>

          {filteredTasks.filter((t) => t.scheduledDate === formatDateISO(visibleDates[0])).length ===
          0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No tasks scheduled for this day.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks
                .filter((t) => t.scheduledDate === formatDateISO(visibleDates[0]))
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((task) => {
                  const subject = subjects.find((s) => s.id === task.subjectId);
                  const topic = topics.find((t) => t.id === task.topicId);
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onToggleTaskStatus(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-600"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {task.startTime}
                            </span>
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subject?.color || '#4f46e5' }}
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              {subject?.name}
                            </span>
                          </div>
                          <h4
                            className={`text-sm font-semibold ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {topic?.name || 'Topic'}
                          </h4>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-0.5">{task.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">{task.duration}m</span>
                        {!isDone && (
                          <button
                            onClick={() => onStartSession(task.id)}
                            className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-indigo-600" />
                            <span>Start</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        /* WEEK & MULTI-DAY VIEW */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {visibleDates.map((dayDate) => {
            const dateStr = formatDateISO(dayDate);
            const isToday = dateStr === formatDateISO(new Date());
            const dayTasks = filteredTasks
              .filter((t) => t.scheduledDate === dateStr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={dateStr}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr)}
                className={`bg-white rounded-xl border flex flex-col min-h-[360px] shadow-2xs transition-colors ${
                  isToday
                    ? 'border-indigo-300 ring-1 ring-indigo-200/60 bg-indigo-50/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    isToday ? 'bg-indigo-50/60 border-indigo-100' : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isToday ? 'text-indigo-600' : 'text-slate-800'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setAddTaskInitialDate(dateStr);
                      setIsAddTaskOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors cursor-pointer"
                    title={`Add task for ${dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Tasks List (Drop Zone) */}
                <div className="p-2 flex-1 space-y-2 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <span className="text-[11px] text-slate-300 italic">No tasks</span>
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const subject = subjects.find((s) => s.id === task.subjectId);
                      const topic = topics.find((t) => t.id === task.topicId);
                      const isDone = task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-grab active:cursor-grabbing select-none group relative ${
                            isDone
                              ? 'bg-slate-50 border-slate-200/80 opacity-60'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                          }`}
                        >
                          {/* Subject & Time */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {task.startTime}
                            </span>
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: subject?.color || '#4f46e5' }}
                            />
                          </div>

                          {/* Topic Name */}
                          <p
                            className={`text-xs font-semibold leading-tight line-clamp-2 ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {topic?.name || 'Topic Study'}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-500">
                            <span>{task.duration}m</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onToggleTaskStatus(task.id)}
                                className="text-slate-400 hover:text-emerald-600"
                                title="Toggle complete"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {!isDone && (
                                <button
                                  onClick={() => onStartSession(task.id)}
                                  className="text-slate-400 hover:text-indigo-600"
                                  title="Start focus timer"
                                >
                                  <Play className="w-3 h-3 fill-slate-400 hover:fill-indigo-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        subjects={subjects}
        topics={topics}
        initialDate={addTaskInitialDate}
        onAddTask={onAddTask}
      />

      {rebalanceTask && (
        <RebalanceModal
          isOpen={rebalanceTask !== null}
          onClose={() => setRebalanceTask(null)}
          taskTitle={
            topics.find((t) => t.id === rebalanceTask.task.topicId)?.name || 'Study Session'
          }
          targetDate={rebalanceTask.targetDate}
          onConfirmMoveOnly={() => {
            onUpdateTaskDate(rebalanceTask.task.id, rebalanceTask.targetDate);
            setRebalanceTask(null);
          }}
          onConfirmRebalance={() => {
            onRebalancePlan(rebalanceTask.task.id, rebalanceTask.targetDate);
            setRebalanceTask(null);
          }}
        />
      )}
    </div>
  );
};
