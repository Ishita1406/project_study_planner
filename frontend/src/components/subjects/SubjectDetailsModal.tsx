import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { Subject, Topic, Deadline } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface SubjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  topics: Topic[];
  deadline?: Deadline;
  onToggleTopicCompleted: (topicId: string) => void;
  onOpenAddTopic: (subjectId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onDeleteSubject: (subjectId: string) => void;
}

export const SubjectDetailsModal: React.FC<SubjectDetailsModalProps> = ({
  isOpen,
  onClose,
  subject,
  topics,
  deadline,
  onToggleTopicCompleted,
  onOpenAddTopic,
  onDeleteTopic,
  onDeleteSubject,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!subject) return null;

  const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
  const completedTopics = subjectTopics.filter((t) => t.completed);
  const progressPercent =
    subjectTopics.length > 0
      ? Math.round((completedTopics.length / subjectTopics.length) * 100)
      : 0;

  const totalEstimatedMinutes = subjectTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalHours = (totalEstimatedMinutes / 60).toFixed(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subject.name}
      subtitle={subject.code ? `${subject.code} • ${subject.description || 'Subject syllabus'}` : subject.description}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Progress & Quick Stats Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Curriculum Progress
            </span>
            <span className="text-sm font-bold text-slate-900">{progressPercent}% Completed</span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: subject.color || '#4f46e5',
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
            <span>
              {completedTopics.length} of {subjectTopics.length} topics mastered
            </span>
            <span>Total study required: ~{totalHours} hrs</span>
            {subject.deadline && (
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Exam: {subject.deadline}</span>
              </span>
            )}
          </div>
        </div>

        {/* Topics List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Syllabus Topics</h4>
              <p className="text-xs text-slate-500">Track and update individual concept mastery</p>
            </div>
            <button
              id="details-add-topic-btn"
              onClick={() => onOpenAddTopic(subject.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Topic</span>
            </button>
          </div>

          {subjectTopics.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs text-slate-500 mb-3">No topics listed for this subject yet.</p>
              <button
                onClick={() => onOpenAddTopic(subject.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first topic</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {subjectTopics.map((topic) => {
                return (
                  <div
                    key={topic.id}
                    className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors ${
                      topic.completed ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    {/* Left: Checkbox + Topic Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleTopicCompleted(topic.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                      >
                        {topic.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold tracking-tight truncate ${
                            topic.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                          }`}
                        >
                          {topic.name}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{topic.estimatedMinutes}m est.</span>
                          </span>
                          <span>•</span>
                          <span>Confidence: {topic.confidence}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Difficulty Badge + Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          topic.difficulty === 'hard'
                            ? 'danger'
                            : topic.difficulty === 'medium'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {topic.difficulty}
                      </Badge>

                      <button
                        onClick={() => onDeleteTopic(topic.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete topic"
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

        {/* Delete Subject Section */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Subject</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-700 font-medium">Delete subject and topics?</span>
              <button
                onClick={() => {
                  onDeleteSubject(subject.id);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
