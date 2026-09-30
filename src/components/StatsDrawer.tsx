import React, { useState } from 'react';
import { 
  X, Award, Flame, Clock, Calendar, CheckCircle2, TrendingUp, 
  Download, Upload, RotateCcw, Sparkles, Sun, Sunset, Moon, 
  Shield, Zap, Crown, PlusCircle, BarChart3, Activity, Heart,
  Timer, Lock, Unlock
} from 'lucide-react';
import { UserStats } from '../types/breathwork';
import { 
  getLast14DaysActivity, getLast30DaysDailyMinutes, 
  calculateSomaticAnalytics, evaluateAchievements, 
  loadCustomTechniques 
} from '../utils/storage';
import { Achievement } from '../types/achievements';

interface StatsDrawerProps {
  stats: UserStats;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  stats,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'achievements' | 'history'>('analytics');
  const customCount = loadCustomTechniques().length;

  const activity14Days = getLast14DaysActivity(stats.history);
  const activity30Days = getLast30DaysDailyMinutes(stats.history);
  const analytics = calculateSomaticAnalytics(stats);
  const achievements = evaluateAchievements(stats, customCount);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Max minutes in last 30 days for bar scaling
  const maxDayMinutes = Math.max(15, ...activity30Days.map(d => d.minutes));

  const renderAchievementIcon = (iconName: string, unlocked: boolean) => {
    const iconClass = `w-5 h-5 ${unlocked ? 'text-white' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'Flame': return <Flame className={iconClass} />;
      case 'Zap': return <Zap className={iconClass} />;
      case 'Crown': return <Crown className={iconClass} />;
      case 'Clock': return <Clock className={iconClass} />;
      case 'Award': return <Award className={iconClass} />;
      case 'Shield': return <Shield className={iconClass} />;
      case 'Moon': return <Moon className={iconClass} />;
      case 'PlusCircle': return <PlusCircle className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'silver':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'diamond':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl bg-[#0a0d14] border border-slate-800 text-slate-200 shadow-2xl p-5 sm:p-7 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-slate-700/80 flex items-center justify-center text-amber-300 shadow-inner">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif-display font-semibold text-white">
                Somatic Telemetry &amp; Mastery
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Biological respiration telemetry, habits &amp; unlockable milestones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span className="font-mono font-bold text-lg sm:text-xl text-white">{stats.currentStreak}</span>
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">Day Streak</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold text-lg sm:text-xl text-white">{Math.round(stats.totalMinutes)}</span>
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">Mindful Min</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-indigo-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="font-mono font-bold text-lg sm:text-xl text-white">{stats.totalSessions}</span>
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">Sessions</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
              <Timer className="w-4 h-4" />
              <span className="font-mono font-bold text-lg sm:text-xl text-white">{analytics.avgHoldSeconds}s</span>
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">Avg Hold</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-2xl bg-slate-950 p-1 mb-5 border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span>Telemetry &amp; Graphs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'achievements'
                ? 'bg-slate-800 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Achievements ({unlockedCount}/{achievements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span>Practice Log</span>
          </button>
        </div>

        {/* TAB 1: TELEMETRY & DATA VISUALIZERS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* 30-Day Mindful Volume Interactive Bar Chart */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>30-Day Mindful Volume</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Daily practice minutes over the last month</p>
                </div>
                <span className="text-xs font-mono text-cyan-300">
                  Peak: {maxDayMinutes}m
                </span>
              </div>

              {/* Bar Chart */}
              <div className="h-32 sm:h-40 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 px-1 border-b border-slate-800">
                {activity30Days.map((d, idx) => {
                  const heightPct = Math.max(4, (d.minutes / maxDayMinutes) * 100);
                  const isToday = idx === activity30Days.length - 1;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-slate-700 text-[10px] font-mono py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-20">
                        {d.shortDate}: {d.minutes}m ({d.sessions}s)
                      </div>

                      {/* Bar Pillar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 group-hover:opacity-100 ${
                          d.minutes > 0
                            ? (isToday ? 'bg-cyan-300 shadow-sm shadow-cyan-400/50' : 'bg-cyan-500/80')
                            : 'bg-slate-800/40 opacity-40'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Axis dates */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-1">
                <span>30 Days Ago</span>
                <span>15 Days</span>
                <span className="text-cyan-400">Today</span>
              </div>
            </div>

            {/* Deep Respiration Biometrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase mb-1">
                  Avg Breath Cycle
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-white mb-1">
                  {analytics.avgCycleSeconds}s
                </div>
                <p className="text-[10px] text-slate-400">Paced respiratory wave rate</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase mb-1">
                  Cumulative Retention
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-300 mb-1">
                  {Math.round(analytics.totalHoldSeconds)}s
                </div>
                <p className="text-[10px] text-slate-400">Total conscious breath-hold time</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase mb-1">
                  Weekly Rhythm
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300 mb-1">
                  {analytics.weeklySessions}
                </div>
                <p className="text-[10px] text-slate-400">Avg sessions per 7-day cycle</p>
              </div>
            </div>

            {/* Circadian Time-of-Day Distribution */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Circadian Practice Distribution</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-4">
                When you engage with your autonomic regulation
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Dawn (6-12h)', icon: <Sun className="w-3.5 h-3.5 text-amber-400" />, data: analytics.circadian.morning },
                  { label: 'Afternoon (12-18h)', icon: <Sun className="w-3.5 h-3.5 text-orange-400" />, data: analytics.circadian.afternoon },
                  { label: 'Evening (18-22h)', icon: <Sunset className="w-3.5 h-3.5 text-indigo-400" />, data: analytics.circadian.evening },
                  { label: 'Night (22-6h)', icon: <Moon className="w-3.5 h-3.5 text-cyan-400" />, data: analytics.circadian.night },
                ].map((c, i) => (
                  <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1 text-slate-300 text-[11px]">{c.icon} {c.label.split(' ')[0]}</span>
                      <span className="font-mono font-semibold text-white">{c.data.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1">
                      <div style={{ width: `${c.data.pct}%` }} className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{c.data.count} sessions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 14-Day Dot Grid */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                14-Day Consistency Track
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
                {activity14Days.map((item, idx) => {
                  let dotBg = 'bg-slate-950 border-slate-800 text-slate-600';
                  if (item.count === 1) dotBg = 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200';
                  else if (item.count >= 2) dotBg = 'bg-cyan-400 border-cyan-300 text-slate-950 font-bold shadow-md shadow-cyan-500/30';

                  return (
                    <div
                      key={idx}
                      title={`${item.date}: ${item.count} sessions, ${item.minutes}m`}
                      className={`h-9 rounded-xl border flex flex-col items-center justify-center text-[10px] font-mono transition-transform hover:scale-105 ${dotBg}`}
                    >
                      <span className="text-[9px] opacity-70">{item.dayLabel}</span>
                      <span>{item.count > 0 ? `${item.minutes}m` : '·'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOMATIC ACHIEVEMENTS & MILESTONES */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-white">Somatic Mastery Badges</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Unlock neuro-respiratory milestones as you practice</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
                {unlockedCount} / {achievements.length} Unlocked
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.map(ach => {
                const progressPct = Math.min(100, Math.round((ach.currentValue / ach.targetValue) * 100));
                const tierClass = getTierBadge(ach.tier);

                return (
                  <div
                    key={ach.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      ach.unlocked
                        ? 'bg-slate-900/90 border-slate-700 shadow-lg shadow-cyan-950/20'
                        : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                          ach.unlocked 
                            ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-cyan-500/30' 
                            : 'bg-slate-800 border border-slate-700'
                        }`}>
                          {renderAchievementIcon(ach.icon, ach.unlocked)}
                        </div>

                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${tierClass}`}>
                          {ach.tier}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-white mb-0.5">
                        {ach.title}
                      </h4>
                      <p className="text-[11px] font-medium text-cyan-300 mb-1">
                        {ach.subtitle}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Progress</span>
                        <span className={ach.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {ach.currentValue} / {ach.targetValue} {ach.unit}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${progressPct}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            ach.unlocked ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PRACTICE LOG & HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-400 uppercase px-1">
              Recorded Sessions ({stats.history.length})
            </div>

            {stats.history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs sm:text-sm">
                No recorded sessions yet. Begin a breathing routine to start logging!
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                {stats.history.map((record, index) => {
                  const date = new Date(record.timestamp || Date.now());
                  const formattedDate = date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const formattedTime = date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const durationMins = Math.round(record.durationSeconds / 60);

                  return (
                    <div
                      key={record.id || index}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold">
                          {record.completedCycles}c
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-white">
                            {record.techniqueName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {formattedDate} · {formattedTime}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-mono font-bold text-cyan-300">
                          {durationMins > 0 ? `${durationMins} min` : `${record.durationSeconds}s`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {record.holdSeconds ? `${record.holdSeconds}s hold` : 'Completed'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
