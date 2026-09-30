import React, { useState } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles, 
  CheckCircle2, AlertCircle, HardDrive, Cloud, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin',
}) => {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    continueAsGuest,
    isAuthenticating, 
    authError, 
    clearAuthError 
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;

    if (tab === 'signin') {
      await signInWithEmail(email.trim(), password);
    } else {
      await signUpWithEmail(email.trim(), password, displayName.trim());
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    onClose();
  };

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Background Radial Glow */}
      <div 
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(45, 212, 191, 0.2) 60%, transparent 80%)'
        }}
      />

      <div className="relative w-full max-w-md bg-[#0a0d13]/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-slate-700/80 flex items-center justify-center text-cyan-300 mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight font-serif-display">
            {tab === 'signin' ? 'Welcome to Dhyaan Mudra' : 'Create Your Dhyaan Mudra Sanctuary'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'signin' 
              ? 'Sign in to sync your breathwork streaks & custom rhythms'
              : 'Save your routines and access them seamlessly across all devices'}
          </p>
        </div>

        {/* Loading / Synchronizing State */}
        {isAuthenticating ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse">
                <Cloud className="w-8 h-8 text-slate-950" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Synchronizing Sanctuary...</p>
              <p className="text-xs text-slate-400 mt-0.5">Connecting with Firebase Cloud Storage</p>
            </div>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {authError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{authError}</span>
                <button onClick={clearAuthError} className="text-rose-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400/60 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-md active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.96 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-3 bg-[#0a0d13] text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Or with email
              </span>
            </div>

            {/* Tabs: Sign In / Create Account */}
            <div className="flex rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  clearAuthError();
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                  tab === 'signin'
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  clearAuthError();
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                  tab === 'signup'
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === 'signup' && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-cyan-400 text-white text-xs placeholder:text-slate-600 focus:outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-cyan-400 text-white text-xs placeholder:text-slate-600 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-10 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-cyan-400 text-white text-xs placeholder:text-slate-600 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-semibold text-xs transition active:scale-98 shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
              >
                <span>{tab === 'signin' ? 'Sign In to Cloud' : 'Create Cloud Sanctuary'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Offline / Guest Mode Option */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleGuest}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-2 transition"
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Continue in Offline Guest Mode (IndexedDB)</span>
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Zero sign-up required. Your routines stay securely stored in your local browser database.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
