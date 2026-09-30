import React, { useState } from 'react';
import { X, Flame, Clock, Award, Calendar, Download, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserStats } from '../types/breathwork';
import { getLast14DaysActivity, exportBackupJSON, importBackupJSON, resetAllStorage } from '../utils/storage';

interface StatsDrawerProps {
  stats: UserStats;
  onClose: () => void;
  onRefreshData: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  stats,
  onClose,
  onRefreshData,
}) => {
  const [importMessage, setImportMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const activity14Days = getLast14DaysActivity(stats.history);

  // Handle Export Backup
  const handleExport = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aetheria-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Import Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = importBackupJSON(text);
        if (ok) {
          setImportMessage({ text: 'Backup restored successfully!', success: true });
          onRefreshData();
        } else {
          setImportMessage({ text: 'Invalid backup file structure.', success: false });
        }
      } catch {
        setImportMessage({ text: 'Failed to read file.', success: false });
      }
    };
    reader.readAsText(file);
  };

  // Handle Reset All
  const handleReset = () => {
    resetAllStorage();
    setShowConfirmReset(false);
    onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl bg-[#0b0e14] border border-slate-800 text-slate-200 shadow-2xl p-6 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif-display font-semibold text-white">Mindful Practice Log</h2>
              <p className="text-[11px] text-slate-400">100% private &amp; stored locally on device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {/* Streak */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="w-7 h-7 mx-auto rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-1.5">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="text-xl font-mono font-bold text-white">{stats.currentStreak}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Day Streak</div>
          </div>

          {/* Total Minutes */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="w-7 h-7 mx-auto rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xl font-mono font-bold text-white">{Math.round(stats.totalMinutes)}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Mindful Min</div>
          </div>

          {/* Total Sessions */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="w-7 h-7 mx-auto rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-1.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xl font-mono font-bold text-white">{stats.totalSessions}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Sessions</div>
          </div>
        </div>

        {/* 14-Day Activity Dot Grid (GitHub-style) */}
        <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Recent Activity (Last 14 Days)</span>
            <span className="text-[10px] text-slate-500 font-mono">Today: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {activity14Days.map((item, idx) => {
              const hasActivity = item.count > 0;
              let dotBg = 'bg-slate-800 border-slate-700/60';
              if (item.count === 1) dotBg = 'bg-cyan-500/50 border-cyan-400/60';
              else if (item.count >= 2) dotBg = 'bg-cyan-400 border-cyan-300 shadow-sm shadow-cyan-500/40';

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    title={`${item.date}: ${item.count} sessions (${item.minutes}m)`}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono transition-transform hover:scale-110 ${dotBg}`}
                  >
                    {hasActivity ? (
                      <span className="text-slate-950 font-bold">{item.count}</span>
                    ) : (
                      <span className="text-slate-600">·</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{item.dayLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded bg-slate-800" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-500/50" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <span>More</span>
          </div>
        </div>

        {/* Recent Session Logs */}
        {stats.history.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Recent Completed Sessions
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {stats.history.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <span className="font-medium text-white block">{s.techniqueName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{s.date} · {s.completedCycles} cycles</span>
                  </div>
                  <div className="font-mono text-cyan-300 text-xs font-semibold">
                    {Math.round(s.durationSeconds / 60)} min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Message Feedback */}
        {importMessage && (
          <div className={`mb-4 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            importMessage.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'
          }`}>
            {importMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{importMessage.text}</span>
          </div>
        )}

        {/* Data Management Actions */}
        <div className="mt-auto pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="w-full py-2 text-center text-xs text-slate-500 hover:text-red-400 transition"
            >
              Reset History &amp; Settings
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 space-y-2">
              <p className="text-xs text-red-300">Are you sure? This will delete all streaks and custom patterns permanently.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg transition"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
