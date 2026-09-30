import React from 'react';
import { 
  Brain, Music, Waves, Volume2, Award, Flame, Clock, 
  PanelRightClose, PanelRightOpen, Keyboard, Info, Check
} from 'lucide-react';
import { Technique, AppSettings, UserStats, AudioGuidanceType, AmbientSoundType } from '../../types/breathwork';
import { getLast14DaysActivity } from '../../utils/storage';

interface DesktopRightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  technique: Technique;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  stats: UserStats;
  onOpenInfoModal: (tech: Technique) => void;
  onOpenStats: () => void;
}

export const DesktopRightPanel: React.FC<DesktopRightPanelProps> = ({
  isOpen,
  onToggle,
  technique,
  settings,
  onUpdateSettings,
  stats,
  onOpenInfoModal,
  onOpenStats,
}) => {
  const activity14Days = getLast14DaysActivity(stats.history);

  return (
    <aside
      className={`hidden lg:flex flex-col h-full bg-[#0a0d13]/85 backdrop-blur-xl border-l border-slate-800/80 transition-all duration-300 ease-in-out relative z-20 shrink-0 ${
        isOpen ? 'w-80 xl:w-88 p-4' : 'w-14 p-2 items-center'
      }`}
    >
      {/* Toggle button on top */}
      <div className={`flex items-center mb-3 w-full ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <button
          onClick={onToggle}
          title={isOpen ? 'Collapse Telemetry Panel ( ] )' : 'Expand Telemetry Panel ( ] )'}
          className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-95"
        >
          {isOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>

        {isOpen ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Telemetry &amp; Sound</span>
          </div>
        ) : null}
      </div>

      {/* Expanded Content */}
      {isOpen ? (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto no-scrollbar pr-0.5">
          {/* Active Biological Science Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 xl:p-4">
            <div className="flex items-center justify-between text-xs xl:text-sm mb-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-indigo-400" />
                Biological Mechanism
              </span>
              <button
                onClick={() => onOpenInfoModal(technique)}
                className="text-[10px] xl:text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                <span>Full Info</span>
                <Info className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] xl:text-xs leading-relaxed text-slate-300 line-clamp-3">
              {technique.science}
            </p>
          </div>

          {/* Soundscape & Audio Deck */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 xl:p-4 space-y-3">
            <div className="flex items-center justify-between text-xs xl:text-sm">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-cyan-400" />
                Phase Guidance &amp; Voice
              </span>
              <span className="text-[10px] xl:text-xs font-mono text-cyan-300 uppercase">
                {settings.audioGuidance.replace('-', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-1.5">
              {[
                { id: 'singing-bowl', label: 'Bowl' },
                { id: 'zen-bell', label: 'Zen' },
                { id: 'synth-hum', label: 'Synth' },
                { id: 'voice-female', label: '🎙️ Serene' },
                { id: 'voice-male', label: '🎙️ Sage' },
                { id: 'silent', label: 'Silent' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ audioGuidance: opt.id as AudioGuidanceType })}
                  className={`py-1.5 px-2 rounded-xl text-[11px] xl:text-xs font-medium text-center transition ${
                    settings.audioGuidance === opt.id
                      ? 'bg-slate-800 border border-cyan-400 text-white font-semibold shadow-sm'
                      : 'bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Ambient Sound */}
            <div className="pt-1 border-t border-slate-800/70">
              <div className="flex items-center justify-between text-xs xl:text-sm mb-1.5">
                <span className="text-[11px] xl:text-xs text-slate-300 flex items-center gap-1.5">
                  <Waves className="w-3 h-3 text-cyan-400" />
                  <span>Ambient Noise</span>
                </span>
                <span className="text-[10px] xl:text-xs font-mono text-slate-400">
                  {settings.ambientSound === 'none' ? 'Off' : `${Math.round(settings.ambientVolume * 100)}%`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 mb-2">
                {[
                  { id: 'none', label: 'Off' },
                  { id: 'brown-noise', label: 'Brown' },
                  { id: 'ocean-surge', label: 'Ocean' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ ambientSound: opt.id as AmbientSoundType })}
                    className={`py-1 px-1.5 rounded-lg text-[10px] xl:text-xs font-medium transition text-center ${
                      settings.ambientSound === opt.id
                        ? 'bg-slate-800 border border-cyan-400 text-white font-semibold'
                        : 'bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {settings.ambientSound !== 'none' && (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.ambientVolume}
                    onChange={e => onUpdateSettings({ ambientVolume: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Habit & Streak Tracker Widget */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 xl:p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs xl:text-sm">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-amber-400" />
                Practice Habits
              </span>
              <button
                onClick={onOpenStats}
                className="text-[10px] xl:text-xs text-cyan-400 hover:text-cyan-300"
              >
                Log Details →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 xl:p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-mono font-bold text-sm xl:text-base text-white">{stats.currentStreak}</span>
                </div>
                <div className="text-[9px] xl:text-[10px] text-slate-400 uppercase tracking-wider">Day Streak</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 xl:p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold text-sm xl:text-base text-white">{Math.round(stats.totalMinutes)}</span>
                </div>
                <div className="text-[9px] xl:text-[10px] text-slate-400 uppercase tracking-wider">Mindful Min</div>
              </div>
            </div>

            {/* 14-day activity mini grid */}
            <div>
              <div className="text-[9px] xl:text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                14-Day Consistency
              </div>
              <div className="grid grid-cols-7 gap-1">
                {activity14Days.map((item, idx) => {
                  let dotBg = 'bg-slate-800/60 border-slate-800';
                  if (item.count === 1) dotBg = 'bg-cyan-500/50 border-cyan-400/60';
                  else if (item.count >= 2) dotBg = 'bg-cyan-400 border-cyan-300 shadow-sm shadow-cyan-500/40';

                  return (
                    <div
                      key={idx}
                      title={`${item.date}: ${item.count} sessions`}
                      className={`h-5 xl:h-6 rounded-md border flex items-center justify-center text-[9px] xl:text-[10px] font-mono transition-transform hover:scale-110 ${dotBg}`}
                    >
                      {item.count > 0 && <span className="text-slate-950 font-bold">{item.count}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Keyboard Shortcuts reference */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] xl:text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Keyboard className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-slate-400" />
              <span>Keyboard Controls</span>
            </div>
            <div className="space-y-1 text-[10px] xl:text-xs text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Space</span>
                <span className="text-slate-300">Play / Pause</span>
              </div>
              <div className="flex justify-between">
                <span>R</span>
                <span className="text-slate-300">Reset Session</span>
              </div>
              <div className="flex justify-between">
                <span>[  ]</span>
                <span className="text-slate-300">Toggle Sidebars</span>
              </div>
              <div className="flex justify-between">
                <span>←  →</span>
                <span className="text-slate-300">Switch Routine</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Icon Bar */
        <div className="flex-1 flex flex-col items-center justify-between py-2">
          <div className="space-y-3">
            <button
              onClick={onOpenStats}
              title="Practice Habits"
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 hover:text-white hover:border-slate-700 transition"
            >
              <Award className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[9px] font-mono text-slate-500 uppercase [writing-mode:vertical-rl] tracking-widest">
            Telemetry
          </div>
        </div>
      )}
    </aside>
  );
};
