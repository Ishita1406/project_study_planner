import React, { useState } from 'react';
import {
  User as UserIcon,
  Clock,
  Bell,
  Calendar,
  Shield,
  Save,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { User, UserPreferences, PreferredTimeOfDay } from '../../types';

interface SettingsViewProps {
  user: User;
  preferences: UserPreferences;
  onUpdateUser: (user: Partial<User>) => Promise<User>;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => Promise<UserPreferences>;
  onResetSeedData: () => void;
  onClearData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  preferences,
  onUpdateUser,
  onUpdatePreferences,
  onResetSeedData,
  onClearData,
}) => {
  // Local form states
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [targetSemester, setTargetSemester] = useState(user.targetSemester);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(user.weeklyGoalHours);

  const [defaultDailyHours, setDefaultDailyHours] = useState(preferences.defaultDailyHours);
  const [maxContinuousMinutes, setMaxContinuousMinutes] = useState(
    preferences.maxContinuousMinutes
  );
  const [breakMinutes, setBreakMinutes] = useState(preferences.breakMinutes);
  const [preferredTime, setPreferredTime] = useState<PreferredTimeOfDay>(
    preferences.preferredTime
  );

  const [notifyReminders, setNotifyReminders] = useState(preferences.notifyReminders);
  const [notifyDeadlines, setNotifyDeadlines] = useState(preferences.notifyDeadlines);
  const [googleCalendarSync, setGoogleCalendarSync] = useState(preferences.googleCalendarSync);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateUser({
      name,
      email,
      targetSemester,
      weeklyGoalHours,
    });
    await onUpdatePreferences({
      defaultDailyHours,
      maxContinuousMinutes,
      breakMinutes,
      preferredTime,
      notifyReminders,
      notifyDeadlines,
      googleCalendarSync,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportData = () => {
    const data = {
      user,
      preferences,
      exportTimestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_planner_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your student profile, default study parameters, and data persistence.
          </p>
        </div>

        <button
          onClick={handleSave}
          id="settings-save-top-btn"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Saved Settings' : 'Save Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Student Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Student Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Semester / Program
              </label>
              <input
                type="text"
                value={targetSemester}
                onChange={(e) => setTargetSemester(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weekly Study Goal (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="80"
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Study Preferences & Capacity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Default Study Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Daily Study Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={defaultDailyHours}
                onChange={(e) => setDefaultDailyHours(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>

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
                <option value="flexible">Flexible / Spread Throughout</option>
              </select>
            </div>

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
                <option value={60}>60 minutes (1 hour)</option>
                <option value={75}>75 minutes</option>
                <option value={90}>90 minutes (1.5 hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rest Break Duration
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

        {/* 3. Notifications & Integrations */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Notifications & Integrations</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-800">Study Session Reminders</p>
                <p className="text-[11px] text-slate-500">
                  Notify 10 minutes prior to scheduled focus tasks
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyReminders}
                onChange={(e) => setNotifyReminders(e.target.checked)}
                className="rounded text-indigo-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-800">Approaching Exam Deadlines</p>
                <p className="text-[11px] text-slate-500">
                  Alert when deadlines enter within 7 days
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyDeadlines}
                onChange={(e) => setNotifyDeadlines(e.target.checked)}
                className="rounded text-indigo-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-800">Google Calendar Sync</p>
                <p className="text-[11px] text-slate-500">
                  Export scheduled study sessions to student Google Calendar
                </p>
              </div>
              <input
                type="checkbox"
                checked={googleCalendarSync}
                onChange={(e) => setGoogleCalendarSync(e.target.checked)}
                className="rounded text-indigo-600 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* 4. Prototype & Data Controls */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Prototype Data Management</h3>
          </div>

          <p className="text-xs text-slate-500">
            Easily reset to initial development data (DBMS, Math, OS) or clear all data to test empty
            states and custom student configurations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onResetSeedData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Seed Data (DBMS, Math, OS)</span>
            </button>

            <button
              type="button"
              onClick={onClearData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Data (Test Empty States)</span>
            </button>

            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export State JSON</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
