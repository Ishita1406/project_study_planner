import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  Layers,
} from 'lucide-react';
import { Subject, Topic, Deadline } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { AddSubjectModal } from './AddSubjectModal';
import { AddTopicModal } from './AddTopicModal';
import { SubjectDetailsModal } from './SubjectDetailsModal';

interface SubjectsViewProps {
  subjects: Subject[];
  topics: Topic[];
  deadlines: Deadline[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  onDeleteSubject: (subjectId: string) => void;
  onAddTopic: (topic: Omit<Topic, 'id'>) => void;
  onDeleteTopic: (topicId: string) => void;
  onToggleTopicCompleted: (topicId: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  topics,
  deadlines,
  onAddSubject,
  onDeleteSubject,
  onAddTopic,
  onDeleteTopic,
  onToggleTopicCompleted,
}) => {
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [addTopicSubjectId, setAddTopicSubjectId] = useState<string | null>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null;
  const addTopicSubject = subjects.find((s) => s.id === addTopicSubjectId) || null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Subjects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explicitly manage your courses, syllabus topics, and confidence levels.
          </p>
        </div>

        <button
          id="subjects-add-subject-top-btn"
          onClick={() => setIsAddSubjectOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Main Content */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects added yet"
          description="Start by adding your courses or study subjects. You will be able to add specific topics, set deadlines, and generate your adaptive plan."
          actionLabel="Add First Subject"
          onAction={() => setIsAddSubjectOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const subTopics = topics.filter((t) => t.subjectId === sub.id);
            const completedTopics = subTopics.filter((t) => t.completed);
            const progress =
              subTopics.length > 0
                ? Math.round((completedTopics.length / subTopics.length) * 100)
                : 0;

            const subDeadline = deadlines.find((d) => d.subjectId === sub.id);

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent top color strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: sub.color || '#4f46e5' }}
                />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {sub.code && (
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {sub.code}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {sub.name}
                      </h3>
                    </div>

                    <Badge
                      variant={
                        sub.difficulty === 'hard'
                          ? 'danger'
                          : sub.difficulty === 'medium'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {sub.difficulty}
                    </Badge>
                  </div>

                  {sub.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {sub.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Curriculum Progress</span>
                      <span className="font-bold text-slate-800">{progress}%</span>
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
                  </div>
                </div>

                {/* Footer Details */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{subTopics.length} topics</span>
                  </div>

                  {sub.deadline ? (
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sub.deadline}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">No deadline</span>
                  )}

                  <div className="flex items-center text-indigo-600 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onAddSubject={onAddSubject}
      />

      <SubjectDetailsModal
        isOpen={selectedSubjectId !== null}
        onClose={() => setSelectedSubjectId(null)}
        subject={selectedSubject}
        topics={topics}
        deadline={deadlines.find((d) => d.subjectId === selectedSubjectId)}
        onToggleTopicCompleted={onToggleTopicCompleted}
        onOpenAddTopic={(subId) => setAddTopicSubjectId(subId)}
        onDeleteTopic={onDeleteTopic}
        onDeleteSubject={onDeleteSubject}
      />

      {addTopicSubject && (
        <AddTopicModal
          isOpen={addTopicSubjectId !== null}
          onClose={() => setAddTopicSubjectId(null)}
          subjectName={addTopicSubject.name}
          subjectId={addTopicSubject.id}
          onAddTopic={onAddTopic}
        />
      )}
    </div>
  );
};
