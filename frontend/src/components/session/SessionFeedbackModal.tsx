import React, { useState } from 'react';
import { SessionFeedback } from '../../types';
import { Modal } from '../common/Modal';

interface SessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectName: string;
  topicName: string;
  durationMinutes: number;
  onSaveFeedback: (feedback: {
    difficulty: SessionFeedback;
    confidence: number;
    notes?: string;
  }) => void;
}

export const SessionFeedbackModal: React.FC<SessionFeedbackModalProps> = ({
  isOpen,
  onClose,
  subjectName,
  topicName,
  durationMinutes,
  onSaveFeedback,
}) => {
  const [difficulty, setDifficulty] = useState<SessionFeedback>('okay');
  const [confidence, setConfidence] = useState<number>(70);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFeedback({
      difficulty,
      confidence,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How did this session go?"
      subtitle={`${subjectName} • ${topicName} (${durationMinutes} min completed)`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Difficulty Feedback */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Session Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['easy', 'Easy', 'Felt smooth & clear'],
                ['okay', 'Okay', 'Standard challenge'],
                ['difficult', 'Difficult', 'Needed extra effort'],
              ] as [SessionFeedback, string, string][]
            ).map(([val, label, sub]) => (
              <button
                type="button"
                key={val}
                onClick={() => setDifficulty(val)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  difficulty === val
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">{label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Confidence After This Session
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
            <span>Needs Review</span>
            <span>Comfortable</span>
            <span>Mastered</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / What did you struggle with?{' '}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. 3NF decomposition algorithm was tricky, need more practice problems on Boyce-Codd normal form."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Save Session & Update Progress
          </button>
        </div>
      </form>
    </Modal>
  );
};
