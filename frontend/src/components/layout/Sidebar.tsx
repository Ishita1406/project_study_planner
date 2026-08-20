import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Timer,
  BarChart3,
  Settings,
  Bell,
  Sparkles,
  RefreshCw,
  Trash2,
  LogOut,
} from 'lucide-react';
import { ActiveView, User } from '../../types';

interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  user: User;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  onResetSeedData: () => void;
  onClearData: () => void;
  onLogout: () => void;
  isSessionActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenNotifications,
  unreadNotificationsCount = 2,
  onResetSeedData,
  onClearData,
  onLogout,
  isSessionActive = false,
}) => {
  const navItems: { id: ActiveView; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'My Planner', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    {
      id: 'sessions',
      label: 'Study Sessions',
      icon: Timer,
      badge: isSessionActive ? 'Active' : undefined,
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* App Branding */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Study Planner
              </h1>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                Adaptive Learning
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="sidebar-generate-plan-btn"
            onClick={() => onNavigate('generate-plan')}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentView === 'generate-plan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600" />
            <span>Generate Study Plan</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-700 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/40">
        {/* Prototype Data Controls */}
        <div className="p-2.5 bg-slate-100/70 rounded-lg border border-slate-200/70">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Prototype State</span>
          </div>
          <div className="flex gap-2">
            <button
              id="sidebar-reset-seed-btn"
              onClick={onResetSeedData}
              title="Reset to realistic seed data (DBMS, Math, OS)"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Reset Seed</span>
            </button>
            <button
              id="sidebar-clear-all-btn"
              onClick={onClearData}
              title="Clear all data to test empty states"
              className="inline-flex items-center justify-center gap-1 py-1 px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Notifications & Profile */}
        <div className="flex items-center justify-between pt-1">
          <button
            id="sidebar-profile-btn"
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2.5 text-left group hover:opacity-80 transition-opacity cursor-pointer flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-300">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.targetSemester}</p>
            </div>
          </button>

          <button
            id="sidebar-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="relative p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
