import React, { useEffect, useState } from 'react';
import { User } from '../../types';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onDemoLogin: () => void;
  initialMode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onDemoLogin,
  initialMode = 'login',
  onModeChange,
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  const setMode = (mode: 'login' | 'signup') => {
    setIsLogin(mode === 'login');
    setErrorMessage(null);
    onModeChange?.(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Basic Validation
    if (!email || !password || (!isLogin && !name)) {
      setErrorMessage('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate network request (replace with apiClient.login / signup)
      await new Promise((res) => setTimeout(res, 800));

      const authenticatedUser: User = {
        id: `user_${Date.now()}`,
        name: isLogin ? (email.split('@')[0] || 'Alex Hunter') : name,
        email: email,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        targetSemester: 'Current Semester',
        weeklyGoalHours: 12,
      };

      onAuthSuccess(authenticatedUser);
    } catch (err) {
      setErrorMessage('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background gradient decorative orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top: Logo & Name */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Study Planner</span>    
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Master your syllabus with adaptive pacing.
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Automated spaced-repetition schedules, smart deadline rebalancing, and deep focus analytics designed for high-performing students.
            </p>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 space-y-4 max-w-md my-8">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Dynamic Schedule Rebalancing</h4>
              <p className="text-xs text-slate-400">Missed a day? Your roadmap automatically readjusts.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm mb-35">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Topic Mastery & Retention</h4>
              <p className="text-xs text-slate-400">Track recall strength across every subject chapter.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT / FORM PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile Top Brand (visible only when screen < lg) */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Study Planner</span>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/60 p-6 sm:p-8">
            
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                }}
                className={`py-2 rounded-lg transition-all ${
                  isLogin
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                }}
                className={`py-2 rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Header Text */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {isLogin ? 'Welcome back' : 'Start your study journey'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isLogin
                  ? 'Enter your credentials to access your dashboard'
                  : 'Set up your student profile and begin planning'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Signup only) */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Hunter"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember checkbox (Login) or Terms (Signup) */}
              <div className="flex items-center text-xs text-slate-600">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 select-none cursor-pointer">
                  {isLogin ? 'Remember this device for 30 days' : 'I agree to the Terms of Service & Privacy Policy'}
                </label>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-semibold rounded-lg shadow-md shadow-slate-900/10 hover:shadow-slate-900/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <span>{isLogin ? 'Sign In to Workspace' : 'Create Student Account'}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                <span className="bg-white px-3 text-slate-400">Or continue with</span>
              </div>
            </div>

            {/* Social / One-Click Options */}
            <div className="grid grid-cols-2 gap-3 ml-20">
              <button
                type="button"
                onClick={() => {
                  onAuthSuccess({
                    id: 'google_user',
                    name: 'Alex Hunter (Google)',
                    email: 'alex.hunter@gmail.com',
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google_user',
                    targetSemester: 'Current Semester',
                    weeklyGoalHours: 12,
                  });
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google</span>
              </button>
            </div>

          </div>

          {/* Bottom Switch Link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            {isLogin ? "Don't have an account yet?" : "Already registered with us?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? 'signup' : 'login');
              }}
              className="font-semibold text-indigo-600 hover:underline"
            >
              {isLogin ? 'Sign up for free' : 'Sign in here'}
            </button>
          </p>

        </div>
      </div>

    </div>
  );
};