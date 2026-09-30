import React from 'react';
import { 
  X, Volume2, Waves, Vibrate, Eye, Moon, Sun, Monitor, Timer, ShieldAlert,
  Sliders, Music, Sparkles, Check
} from 'lucide-react';
import { AppSettings, AudioGuidanceType, AmbientSoundType, VisualizerMode, ThemeMode } from '../types/breathwork';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsDrawerProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
  onOpenStats: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onOpenStats,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl bg-[#0b0e14] border border-slate-800 text-slate-200 shadow-2xl p-6 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif-display font-semibold text-white">Experience Settings</h2>
              <p className="text-[11px] text-slate-400">Audio, haptics &amp; visual preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PWA Install Banner */}
        <div className="mb-5">
          <PWAInstallButton />
        </div>

        <div className="space-y-6">
          {/* Audio Guidance Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                Phase Guidance Bell
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'singing-bowl', label: 'Singing Bowl', sub: '432Hz Binaural' },
                { id: 'zen-bell', label: 'Zen Bell', sub: 'Metallic Chime' },
                { id: 'synth-hum', label: 'Synth Hum', sub: 'Warm Pad' },
                { id: 'silent', label: 'Silent', sub: 'No Chimes' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ audioGuidance: opt.id as AudioGuidanceType })}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    settings.audioGuidance === opt.id
                      ? 'bg-slate-800 border-cyan-400/80 text-white shadow-sm'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium text-white">{opt.label}</span>
                    {settings.audioGuidance === opt.id && <Check className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Soundscapes */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              Continuous Ambient Soundscape
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Off' },
                { id: 'brown-noise', label: 'Brown Noise' },
                { id: 'ocean-surge', label: 'Ocean Surge' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ambientSound: opt.id as AmbientSoundType })}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${
                    settings.ambientSound === opt.id
                      ? 'bg-slate-800 border-cyan-400/80 text-white shadow-sm'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {settings.ambientSound !== 'none' && (
              <div className="pt-2 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ambientVolume}
                  onChange={e => onUpdateSettings({ ambientVolume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400 w-8 text-right">
                  {Math.round(settings.ambientVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Visualizer Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Visualizer Geometry
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'fluid-orb', label: 'Fluid Glowing Orb', desc: 'Radial bloom & damped oscillation' },
                { id: 'minimal-rings', label: 'Minimal Concentric Rings', desc: 'Clean geometric Japanese rings' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ visualizerMode: opt.id as VisualizerMode })}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.visualizerMode === opt.id
                      ? 'bg-slate-800 border-cyan-400/80 text-white shadow-sm'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{opt.label}</span>
                    {settings.visualizerMode === opt.id && <Check className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode & OLED */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              Atmospheric Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: 'reactive' })}
                className={`p-3 rounded-xl border text-left transition ${
                  settings.themeMode === 'reactive'
                    ? 'bg-slate-800 border-cyan-400/80 text-white shadow-sm'
                    : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-medium text-white">Rhythm Reactive</div>
                <p className="text-[10px] text-slate-400 mt-1">Obsidian &amp; nervous system ambient glow</p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: 'oled' })}
                className={`p-3 rounded-xl border text-left transition ${
                  settings.themeMode === 'oled'
                    ? 'bg-slate-800 border-cyan-400/80 text-white shadow-sm'
                    : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-medium text-white">True OLED Black</div>
                <p className="text-[10px] text-slate-400 mt-1">Pitch #000000 · Maximum battery savings</p>
              </button>
            </div>
          </div>

          {/* Toggles (Haptics, Wake Lock, Countdown Buffer, Safety Filter) */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Session Controls &amp; Safety
            </h4>

            {/* Haptic Feedback */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Vibrate className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-white">Haptic Pulses</div>
                  <div className="text-[10px] text-slate-400">Tactile phase transition vibrations</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.hapticsEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Screen Wake Lock */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-white">Prevent Screen Sleep</div>
                  <div className="text-[10px] text-slate-400">Keeps display awake during sessions</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ wakeLockEnabled: !settings.wakeLockEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.wakeLockEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.wakeLockEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* 3s Countdown Buffer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-white">3s Preparation Buffer</div>
                  <div className="text-[10px] text-slate-400">Calming 3-2-1 countdown before starting</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ prepCountdown: !settings.prepCountdown })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.prepCountdown ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.prepCountdown ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Safety Filter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-medium text-white">Safety Filter</div>
                  <div className="text-[10px] text-slate-400">Hide intense hyperventilation / long retentions</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ safetyFilter: !settings.safetyFilter })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.safetyFilter ? 'bg-cyan-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${settings.safetyFilter ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenStats();
            }}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
          >
            Manage Data &amp; Backups →
          </button>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
