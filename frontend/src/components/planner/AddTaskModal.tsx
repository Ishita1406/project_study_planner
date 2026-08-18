import React, { useState } from 'react';
import { Task, Subject, Topic, PriorityLevel } from '../../types';
import { Modal } from '../common/Modal';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  initialDate?: string;
  onAddTask: (task: Omit<Task, 'id'>) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  initialDate,
  onAddTask,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<number>(60);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState<string>('');

  const subjectTopics = topics.filter((t) => t.subjectId === selectedSubjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;

    onAddTask({
      subjectId: selectedSubjectId,
      topicId: selectedTopicId || subjectTopics[0]?.id || '',
      scheduledDate,
      startTime,
      duration,
      status: 'pending',
      priority,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Study Task"
      subtitle="Schedule a specific focus block on your calendar"
      maxWidth="md"
    >
      <form id="add-task-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedTopicId('');
            }}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
          {subjectTopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No topics found for this subject.</p>
          ) : (
            <select
              value={selectedTopicId || subjectTopics[0]?.id}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              {subjectTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.difficulty})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Duration & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={75}>75 mins</option>
              <option value={90}>90 mins</option>
              <option value={120}>120 mins</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white capitalize"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Solve exercises 1 through 5"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Schedule Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
