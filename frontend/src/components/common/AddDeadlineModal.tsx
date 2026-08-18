import React, { useState } from 'react';
import { Deadline, Subject, PriorityLevel } from '../../types';
import { Modal } from './Modal';

interface AddDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onAddDeadline: (deadline: Omit<Deadline, 'id'>) => void;
}

export const AddDeadlineModal: React.FC<AddDeadlineModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onAddDeadline,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<'exam' | 'assignment' | 'project' | 'quiz'>('exam');
  const [priority, setPriority] = useState<PriorityLevel>('high');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onAddDeadline({
      subjectId: selectedSubjectId || subjects[0]?.id || '',
      title: title.trim(),
      dueDate,
      type,
      priority,
    });

    setTitle('');
    setDueDate('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Academic Deadline"
      subtitle="Track an upcoming exam, assignment, or milestone"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subject <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Deadline Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. DBMS Final Exam or Probability Problem Set"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assessment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white capitalize"
            >
              <option value="exam">Exam / Midterm</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
        </div>

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
            Add Deadline
          </button>
        </div>
      </form>
    </Modal>
  );
};
