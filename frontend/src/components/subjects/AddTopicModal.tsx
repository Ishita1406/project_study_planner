import React, { useState } from 'react';
import { Topic, DifficultyLevel } from '../../types';
import { Modal } from '../common/Modal';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectName: string;
  subjectId: string;
  onAddTopic: (topic: Omit<Topic, 'id'>) => void;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  subjectName,
  subjectId,
  onAddTopic,
}) => {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [confidence, setConfidence] = useState<number>(40);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTopic({
      subjectId,
      name: name.trim(),
      difficulty,
      confidence,
      estimatedMinutes,
      completed: false,
      order: 99,
    });

    setName('');
    setDifficulty('medium');
    setConfidence(40);
    setEstimatedMinutes(60);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Topic"
      subtitle={`Add a new study topic to ${subjectName}`}
      maxWidth="md"
    >
      <form id="add-topic-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Topic Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="input-topic-name"
            required
            placeholder="e.g. Normalization (1NF, 2NF, 3NF, BCNF)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Study Time
            </label>
            <select
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes (1 hr)</option>
              <option value={75}>75 minutes</option>
              <option value={90}>90 minutes (1.5 hrs)</option>
              <option value={120}>120 minutes (2 hrs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic Difficulty
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
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Initial Confidence</label>
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
            id="submit-add-topic-btn"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Add Topic
          </button>
        </div>
      </form>
    </Modal>
  );
};
