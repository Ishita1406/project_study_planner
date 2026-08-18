import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  Subject,
  Topic,
  Deadline,
  PlanGenerationParams,
  StudyPlan,
  PlanningPriorityOption,
  PreferredTimeOfDay,
  WeeklyAvailability,
  ActiveView,
} from '../../types';
import { Badge } from '../common/Badge';

interface PlanGeneratorViewProps {
  subjects: Subject[];
  topics: Topic[];
  deadlines: Deadline[];
  onGeneratePlan: (params: PlanGenerationParams) => Promise<StudyPlan>;
  onAcceptPlan: (plan: StudyPlan) => Promise<void>;
  onNavigate: (view: ActiveView) => void;
}

export const PlanGeneratorView: React.FC<PlanGeneratorViewProps> = ({
  subjects,
  topics,
  deadlines,
  onGeneratePlan,
  onAcceptPlan,
  onNavigate,
}) => {
  // Wizard state
  const [availabilityMode, setAvailabilityMode] = useState<'daily' | 'custom'>('daily');
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>({
    monday: 3,
    tuesday: 2.5,
    wednesday: 4,
    thursday: 3,
    friday: 2,
    saturday: 5,
    sunday: 4,
  });

  // Selected subjects
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    subjects.map((s) => s.id)
  );

  // Priorities
  const [priorities, setPriorities] = useState<PlanningPriorityOption[]>([
    'deadlines',
    'weak_topics',
  ]);

  // Scheduling prefs
  const [preferredTime, setPreferredTime] = useState<PreferredTimeOfDay>('morning');
  const [maxContinuousMinutes, setMaxContinuousMinutes] = useState<number>(60);
  const [breakMinutes, setBreakMinutes] = useState<number>(15);
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    'I have a test on normalization this Friday.'
  );

  // Flow status
  const [stepState, setStepState] = useState<'form' | 'loading' | 'generated'>('form');
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadingSteps = [
    'Analyzing your subjects and topic mastery',
    'Checking upcoming exam deadlines',
    'Balancing available study time and break intervals',
    'Creating your optimized schedule',
  ];

  const handleToggleSubject = (id: string) => {
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((sId) => sId !== id));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, id]);
    }
  };

  const handleTogglePriority = (p: PlanningPriorityOption) => {
    if (priorities.includes(p)) {
      if (priorities.length > 1) {
        setPriorities(priorities.filter((item) => item !== p));
      }
    } else {
      setPriorities([...priorities, p]);
    }
  };

  const handleStartGeneration = async () => {
    if (selectedSubjectIds.length === 0) {
      setErrorMessage('Please select at least one subject to plan.');
      return;
    }
    setErrorMessage(null);
    setStepState('loading');
    setLoadingStepIndex(0);

    // Realistic UI step progression
    const timer1 = setTimeout(() => setLoadingStepIndex(1), 500);
    const timer2 = setTimeout(() => setLoadingStepIndex(2), 1000);
    const timer3 = setTimeout(() => setLoadingStepIndex(3), 1500);

    try {
      const planParams: PlanGenerationParams = {
        availabilityMode,
        dailyHours,
        weeklyAvailability,
        prioritizedSubjectIds: selectedSubjectIds,
        priorities,
        preferredTime,
        maxContinuousMinutes,
        breakMinutes,
        additionalNotes,
      };

      const plan = await onGeneratePlan(planParams);

      setTimeout(() => {
        setGeneratedPlan(plan);
        setStepState('generated');
      }, 1900);
    } catch (err: any) {
      setStepState('form');
      setErrorMessage(err?.message || 'Error generating plan. Please try again.');
    }
  };

  const handleAccept = async () => {
    if (!generatedPlan) return;
    setIsAccepting(true);
    try {
      await onAcceptPlan(generatedPlan);
      onNavigate('planner');
    } catch (err) {
      setIsAccepting(false);
    }
  };

  // ==================== VIEW: LOADING STATE ====================
  if (stepState === 'loading') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Creating your study plan...
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Optimizing study blocks around your priorities and retention curve.
        </p>

        {/* Progression Steps */}
        <div className="mt-8 space-y-3 max-w-md mx-auto text-left">
          {loadingSteps.map((stepText, idx) => {
            const isDone = idx < loadingStepIndex;
            const isCurrent = idx === loadingStepIndex;
            return (
              <div
                key={stepText}
                className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : isCurrent
                    ? 'bg-white border-indigo-300 text-slate-900 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200/60 text-slate-400 opacity-60'
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <span className="text-xs font-medium">{stepText}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==================== VIEW: GENERATED PLAN REVIEW ====================
  if (stepState === 'generated' && generatedPlan) {
    // Group generated items by day/date
    const groupedDays: Record<string, typeof generatedPlan.items> = {};
    generatedPlan.items.forEach((item) => {
      const key = `${item.day} (${item.date})`;
      if (!groupedDays[key]) groupedDays[key] = [];
      groupedDays[key].push(item);
    });

    const totalHoursPlanned = (
      generatedPlan.items.reduce((acc, i) => acc + i.durationMinutes, 0) / 60
    ).toFixed(1);

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Top Header */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Adaptive Plan Generated</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Study Plan</h1>
            <p className="text-xs text-slate-500">
              Based on your subjects, available time, upcoming deadlines and priorities.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setStepState('form')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Adjust Parameters
            </button>
            <button
              id="generated-plan-accept-btn"
              onClick={handleAccept}
              disabled={isAccepting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Accept Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Stats Strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Study Time
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {totalHoursPlanned} Hours
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Study Blocks
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {generatedPlan.items.length} Sessions
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Subjects
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {selectedSubjectIds.length} Covered
            </span>
          </div>
        </div>

        {/* Generated Schedule by Days */}
        <div className="space-y-6">
          {Object.entries(groupedDays).map(([dayLabel, items]) => (
            <div key={dayLabel} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {dayLabel}
                </h3>
                <span className="text-xs text-slate-500">
                  {items.reduce((acc, i) => acc + i.durationMinutes, 0)} mins total
                </span>
              </div>

              <div className="divide-y divide-slate-100 p-2">
                {items.map((item) => {
                  const subject = subjects.find((s) => s.id === item.subjectId);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {item.startTime}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subject?.color || '#4f46e5' }}
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              {item.subjectName}
                            </span>
                            <Badge
                              variant={
                                item.difficulty === 'hard'
                                  ? 'danger'
                                  : item.difficulty === 'medium'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {item.difficulty}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900">{item.topicName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 italic">{item.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.durationMinutes} min</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-200">
          <button
            onClick={() => handleStartGeneration()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStepState('form')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Edit Plan Parameters
            </button>
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Accept & Apply to Planner</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VIEW: PLANNING FORM (PAGE 3) ====================
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your Study Plan</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tell us how much time you have and your priorities to craft an adaptive, realistic
          schedule.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: How much time can you study? */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            1. How much time can you study?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your overall daily capacity or specify custom hours by day.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg max-w-xs">
          <button
            type="button"
            onClick={() => setAvailabilityMode('daily')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              availabilityMode === 'daily'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fixed Daily Hours
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityMode('custom')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              availabilityMode === 'custom'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Different by Day
          </button>
        </div>

        {availabilityMode === 'daily' ? (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Daily available study hours</span>
              <span className="font-bold text-indigo-600 text-sm">{dailyHours} hours / day</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>1 hr (Light)</span>
              <span>3.5 hrs (Standard)</span>
              <span>8 hrs (Intensive)</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {(
              [
                ['monday', 'Monday'],
                ['tuesday', 'Tuesday'],
                ['wednesday', 'Wednesday'],
                ['thursday', 'Thursday'],
                ['friday', 'Friday'],
                ['saturday', 'Saturday'],
                ['sunday', 'Sunday'],
              ] as [keyof WeeklyAvailability, string][]
            ).map(([dayKey, dayLabel]) => (
              <div key={dayKey} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                <label className="block text-xs font-semibold text-slate-700 mb-1">{dayLabel}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={weeklyAvailability[dayKey]}
                    onChange={(e) =>
                      setWeeklyAvailability({
                        ...weeklyAvailability,
                        [dayKey]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                  <span className="text-xs text-slate-500">hrs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Which subjects should I prioritize? */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            2. Which subjects should I prioritize?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select from your actual added courses to include in this study cycle.
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <span>You have no subjects registered yet. Add subjects first.</span>
            <button
              onClick={() => onNavigate('subjects')}
              className="font-semibold underline underline-offset-2"
            >
              Add Subjects →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map((sub) => {
              const isSelected = selectedSubjectIds.includes(sub.id);
              const subTopics = topics.filter((t) => t.subjectId === sub.id);
              return (
                <div
                  key={sub.id}
                  onClick={() => handleToggleSubject(sub.id)}
                  className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{sub.name}</p>
                      <p className="text-[11px] text-slate-500">{subTopics.length} topics</p>
                    </div>
                  </div>

                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sub.color || '#4f46e5' }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: What's your priority? */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            3. What's your primary focus?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select one or more scheduling strategies (multiple allowed).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: 'deadlines' as PlanningPriorityOption,
              title: 'Upcoming Deadlines',
              desc: 'Prioritize subjects with exams in the next 14 days.',
            },
            {
              id: 'weak_topics' as PlanningPriorityOption,
              title: 'Weak Topics (Low Confidence)',
              desc: 'Schedule extra review for topics rated under 50%.',
            },
            {
              id: 'balanced' as PlanningPriorityOption,
              title: 'Balanced Progress',
              desc: 'Evenly distribute hours across all enrolled subjects.',
            },
            {
              id: 'exam_prep' as PlanningPriorityOption,
              title: 'Exam Preparation',
              desc: 'Heavier focus on past practice and hard topics.',
            },
          ].map((item) => {
            const isChecked = priorities.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleTogglePriority(item.id)}
                className={`p-3.5 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isChecked
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: How should I schedule my study? */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            4. How should I schedule my study?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize session duration and your biological focus window.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Preferred time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Study Time
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value as PreferredTimeOfDay)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="morning">Morning (09:00 - 12:00)</option>
              <option value="afternoon">Afternoon (13:30 - 17:00)</option>
              <option value="evening">Evening (18:00 - 22:00)</option>
              <option value="flexible">Flexible / Spread Out</option>
            </select>
          </div>

          {/* Max continuous session */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Continuous Session
            </label>
            <select
              value={maxContinuousMinutes}
              onChange={(e) => setMaxContinuousMinutes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={75}>75 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          {/* Break duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Break Duration
            </label>
            <select
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 5: Anything else? */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">5. Anything else?</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add context or specific upcoming quiz notes.
          </p>
        </div>

        <textarea
          rows={2}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="e.g. I have a test on normalization this Friday, so prioritize DBMS topics."
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          id="submit-generate-plan-btn"
          type="button"
          onClick={handleStartGeneration}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Study Plan</span>
        </button>
      </div>
    </div>
  );
};
