import React from 'react';
import { Bell, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Deadline, Task } from '../../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  deadlines: Deadline[];
  tasks: Task[];
  onNavigateToPlanner: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  deadlines,
  tasks,
  onNavigateToPlanner,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.scheduledDate === today && t.status === 'pending');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications & Alerts"
      subtitle="Upcoming milestones and schedule reminders"
      maxWidth="md"
    >
      <div className="space-y-3">
        {/* Today's Tasks Reminder */}
        {todayTasks.length > 0 ? (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-start gap-3">
            <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-700 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-semibold text-indigo-950">
                {todayTasks.length} Study Tasks Scheduled Today
              </h5>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                Keep up your streak! You have {todayTasks.reduce((acc, t) => acc + t.duration, 0)} minutes of study planned.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToPlanner();
                }}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 mt-2 inline-block underline underline-offset-2"
              >
                View Today's Timeline →
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No pending tasks remaining for today. Great job!</span>
          </div>
        )}

        {/* Deadlines alerts */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Approaching Deadlines
          </h4>
          {deadlines.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No deadlines tracked currently.</p>
          ) : (
            <div className="space-y-2">
              {deadlines.map((d) => {
                const diffDays = Math.ceil(
                  (new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={d.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-50 rounded text-amber-600 border border-amber-200/50">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{d.title}</p>
                        <p className="text-[11px] text-slate-500">Due {d.dueDate}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        diffDays <= 5
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {diffDays <= 0 ? 'Due Today' : `${diffDays} days left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
