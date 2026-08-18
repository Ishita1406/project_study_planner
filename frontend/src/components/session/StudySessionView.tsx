import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  BookOpen,
} from 'lucide-react';
import { Subject, Topic, Task, StudySession, SessionFeedback, ActiveView } from '../../types';
import { SessionFeedbackModal } from './SessionFeedbackModal';
import { Badge } from '../common/Badge';

interface StudySessionViewProps {
  subjects: Subject[];
  topics: Topic[];
  tasks: Task[];
  initialTaskId?: string | null;
  onSaveSession: (sessionData: Omit<StudySession, 'id' | 'createdAt'>) => Promise<void>;
  onNavigate: (view: ActiveView) => void;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({
  subjects,
  topics,
  tasks,
  initialTaskId,
  onSaveSession,
  onNavigate,
}) => {
  // Find initial task or default
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const activeTask =
    tasks.find((t) => t.id === initialTaskId) || pendingTasks[0] || tasks[0] || null;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    activeTask?.subjectId || subjects[0]?.id || ''
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    activeTask?.topicId || ''
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    activeTask?.id || null
  );

  // Timer states
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(
    activeTask?.duration || 45
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(sessionDurationMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Update selection if initialTaskId changes
  useEffect(() => {
    if (initialTaskId) {
      const task = tasks.find((t) => t.id === initialTaskId);
      if (task) {
        setSelectedTaskId(task.id);
        setSelectedSubjectId(task.subjectId);
        setSelectedTopicId(task.topicId);
        setSessionDurationMinutes(task.duration);
        setSecondsRemaining(task.duration * 60);
        setIsRunning(true);
      }
    }
  }, [initialTaskId, tasks]);

  // Timer interval
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      playCompletionTone();
      setIsFeedbackOpen(true);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining]);

  const playCompletionTone = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Ignore audio error
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(sessionDurationMinutes * 60);
  };

  const handleAddMinutes = (mins: number) => {
    setSecondsRemaining((prev) => prev + mins * 60);
    setSessionDurationMinutes((prev) => prev + mins);
  };

  const handleFinish = () => {
    setIsRunning(false);
    setIsFeedbackOpen(true);
  };

  const handleSaveFeedback = async (feedback: {
    difficulty: SessionFeedback;
    confidence: number;
    notes?: string;
  }) => {
    const elapsedMinutes = Math.max(
      1,
      Math.round((sessionDurationMinutes * 60 - secondsRemaining) / 60) || sessionDurationMinutes
    );

    const now = new Date();
    const startTime = new Date(now.getTime() - elapsedMinutes * 60000).toISOString();

    await onSaveSession({
      taskId: selectedTaskId || undefined,
      subjectId: selectedSubjectId,
      topicId: selectedTopicId,
      startTime,
      endTime: now.toISOString(),
      duration: elapsedMinutes,
      difficultyFeedback: feedback.difficulty,
      confidence: feedback.confidence,
      notes: feedback.notes,
    });

    setIsFeedbackOpen(false);
    onNavigate('analytics');
  };

  // Find active subject and topic
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentTopics = topics.filter((t) => t.subjectId === selectedSubjectId);
  const currentTopic = topics.find((t) => t.id === selectedTopicId) || currentTopics[0];

  // Timer formatting
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const totalSeconds = sessionDurationMinutes * 60;
  const progressPercent =
    totalSeconds > 0 ? Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100) : 0;

  return (
    <div
      className={`max-w-4xl mx-auto space-y-8 pb-16 transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 text-white p-8 max-w-none overflow-y-auto' : ''
      }`}
    >
      {/* Session Header Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>
            Focus Study Session
          </h1>
          <p className={`text-xs ${isFullScreen ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
            Dedicated focus block for deep learning and retention
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title="Toggle timer completion sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg text-slate-700 text-xs transition-colors cursor-pointer"
            title="Toggle focus mode"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Subject & Topic Selectors */}
      <div
        className={`p-5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ${
          isFullScreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div>
          <label
            className={`block text-xs font-semibold mb-1 ${
              isFullScreen ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Active Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              const subTopics = topics.filter((t) => t.subjectId === e.target.value);
              setSelectedTopicId(subTopics[0]?.id || '');
            }}
            className={`w-full px-3 py-2 text-xs border rounded-lg ${
              isFullScreen
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={`block text-xs font-semibold mb-1 ${
              isFullScreen ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Focus Topic
          </label>
          {currentTopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No topics available for this subject</p>
          ) : (
            <select
              value={selectedTopicId || currentTopics[0]?.id}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg ${
                isFullScreen
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {currentTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Conf: {t.confidence}%)
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Focus Centerpiece */}
      <div
        className={`p-10 rounded-2xl border text-center space-y-8 flex flex-col items-center justify-center ${
          isFullScreen
            ? 'bg-slate-800/80 border-slate-700'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Subject & Topic Banner */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentSubject?.color || '#4f46e5' }}
            />
            <span>{currentSubject?.name || 'Subject'}</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-bold tracking-tight mt-2 ${
              isFullScreen ? 'text-white' : 'text-slate-900'
            }`}
          >
            {currentTopic?.name || 'Study Focus'}
          </h2>
          <p className="text-xs text-slate-400">
            Target duration: {sessionDurationMinutes} minutes
          </p>
        </div>

        {/* Big Countdown Timer */}
        <div className="relative flex items-center justify-center">
          <div className="text-6xl sm:text-8xl font-mono font-bold tracking-tight select-none">
            {formattedTime}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStartPause}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{secondsRemaining < totalSeconds ? 'Resume Session' : 'Start Focus Timer'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleAddMinutes(5)}
            className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            +5 min
          </button>

          <button
            onClick={() => handleAddMinutes(15)}
            className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            +15 min
          </button>

          <button
            onClick={handleFinish}
            className="inline-flex items-center gap-1.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ml-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Session</span>
          </button>
        </div>
      </div>

      {/* Post-Session Reflection Feedback Modal */}
      <SessionFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        subjectName={currentSubject?.name || 'Subject'}
        topicName={currentTopic?.name || 'Topic Session'}
        durationMinutes={Math.max(
          1,
          Math.round((sessionDurationMinutes * 60 - secondsRemaining) / 60) || sessionDurationMinutes
        )}
        onSaveFeedback={handleSaveFeedback}
      />
    </div>
  );
};
