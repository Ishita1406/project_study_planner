import React, { useState } from 'react';
import { Subject, DifficultyLevel, PriorityLevel } from '../../types';
import { Modal } from '../common/Modal';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
}

const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#0284c7', // Sky
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#4f46e5', // Indigo
  '#475569', // Slate
];

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAddSubject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [examName, setExamName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [confidence, setConfidence] = useState<number>(50);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [color, setColor] = useState<string>(COLOR_PALETTE[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSubject({
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      examName: examName.trim() || undefined,
      difficulty,
      confidence,
      priority,
      color,
    });

    // Reset form
    setName('');
    setCode('');
    setDescription('');
    setDeadline('');
    setExamName('');
    setDifficulty('medium');
    setConfidence(50);
    setColor(COLOR_PALETTE[0]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Subject"
      subtitle="Define a course or topic area you are actively studying"
      maxWidth="lg"
    >
      <form id="add-subject-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Name & Code */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-subject-name"
              required
              placeholder="e.g. Database Management Systems"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Code
            </label>
            <input
              type="text"
              id="input-subject-code"
              placeholder="e.g. CS 340"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="input-subject-description"
            placeholder="e.g. Relational models, normal forms, indexing, query optimization"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Deadline & Exam Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Deadline / Exam Date
            </label>
            <input
              type="date"
              id="input-subject-deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assessment Name
            </label>
            <input
              type="text"
              id="input-subject-exam-name"
              placeholder="e.g. Final Exam or Midterm"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Difficulty & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Perceived Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`py-1.5 text-xs font-medium rounded capitalize cursor-pointer transition-colors ${
                    difficulty === lvl
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Study Priority
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 text-xs font-medium rounded capitalize cursor-pointer transition-colors ${
                    priority === p
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Current Confidence Level
            </label>
            <span className="text-xs font-bold text-indigo-600">{confidence}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={confidence}
            onChange={(e) => setConfidence(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0% (Beginner)</span>
            <span>50% (Comfortable)</span>
            <span>100% (Mastered)</span>
          </div>
        </div>

        {/* Color Tag */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Subject Tag Color
          </label>
          <div className="flex items-center gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-115 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="submit-add-subject-btn"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Add Subject
          </button>
        </div>
      </form>
    </Modal>
  );
};
