import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, HardDrive, LogIn, LogOut, User as UserIcon, 
  Check, Sparkles, Shield, ChevronDown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserAuthChipProps {
  onOpenAuthModal: () => void;
}

export const UserAuthChip: React.FC<UserAuthChipProps> = ({ onOpenAuthModal }) => {
  const { user, signOut, loading, isAuthenticating } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 animate-pulse" />
    );
  }

  const isGuest = !user || user.isGuest;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Chip Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition active:scale-95 shadow-sm"
        title={isGuest ? 'Offline Guest Mode (IndexedDB)' : `Cloud Synced (${user?.email})`}
      >
        {/* Avatar or Initial */}
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
          />
        ) : (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            isGuest 
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          }`}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (isGuest ? 'G' : 'U')}
          </div>
        )}

        {/* Sync Indicator Dot */}
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${
            isGuest ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'
          }`} />
          <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
            {isGuest ? 'Guest' : (user?.displayName || 'Cloud')}
          </span>
        </span>

        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0a0d13]/95 border border-slate-800 p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Header */}
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800/80">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isGuest 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (isGuest ? 'G' : 'U')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {isGuest ? 'Guest Practitioner' : (user?.displayName || 'Practitioner')}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {isGuest ? 'Local IndexedDB Storage' : user?.email}
              </div>
            </div>
          </div>

          {/* Sync Status Tile */}
          <div className="my-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/70 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                {isGuest ? <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> : <Cloud className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="font-medium text-slate-300">{isGuest ? 'IndexedDB Engine' : 'Firebase Cloud Sync'}</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                isGuest ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isGuest ? 'Offline' : 'Active'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {isGuest
                ? 'Your streaks & custom routines are saved safely on this device.'
                : 'Your streaks & patterns sync in real time across all your devices.'}
            </p>
          </div>

          {/* Action Buttons */}
          {isGuest ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 shadow-md shadow-cyan-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sync to Cloud</span>
            </button>
          ) : (
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              disabled={isAuthenticating}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out to Guest</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
