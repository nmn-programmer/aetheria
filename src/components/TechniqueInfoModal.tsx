import React, { useState } from 'react';
import { 
  X, AlertTriangle, CheckCircle2, Info, Sparkles, HeartPulse, 
  Brain, Clock, Repeat, Play, ShieldAlert, Waves, Compass
} from 'lucide-react';
import { Technique } from '../types/breathwork';

interface TechniqueInfoModalProps {
  technique: Technique | null;
  onClose: () => void;
  onSelectAndStart: (tech: Technique, customCycles?: number) => void;
}

export const TechniqueInfoModal: React.FC<TechniqueInfoModalProps> = ({
  technique,
  onClose,
  onSelectAndStart,
}) => {
  const [selectedCycles, setSelectedCycles] = useState<number>(() => technique?.defaultCycles || 6);

  if (!technique) return null;

  const totalCycleSeconds = technique.steps.reduce((acc, s) => acc + s.duration, 0);

  // Time formatted helper
  const formatTotalTime = (cycles: number) => {
    if (cycles === 0) return 'Continuous (Open Flow)';
    const totalSecs = Math.round(cycles * totalCycleSeconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // 10 minutes calculated cycles
  const tenMinuteCycles = Math.max(1, Math.round(600 / totalCycleSeconds));

  const presets = [
    { label: '4 Cycles', cycles: 4 },
    { label: '8 Cycles', cycles: 8 },
    { label: '10 Mins', cycles: tenMinuteCycles },
    { label: '∞ Open Flow', cycles: 0 },
  ];

  // Helper for phase color
  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'inhale':
        return { bg: 'bg-cyan-400', border: 'border-cyan-400/40', text: 'text-cyan-300', lightBg: 'bg-cyan-500/15' };
      case 'micro-inhale':
        return { bg: 'bg-sky-300', border: 'border-sky-400/40', text: 'text-sky-300', lightBg: 'bg-sky-500/15' };
      case 'hold-in':
        return { bg: 'bg-indigo-400', border: 'border-indigo-400/40', text: 'text-indigo-300', lightBg: 'bg-indigo-500/15' };
      case 'exhale':
        return { bg: 'bg-violet-400', border: 'border-violet-400/40', text: 'text-violet-300', lightBg: 'bg-violet-500/15' };
      case 'hold-out':
        return { bg: 'bg-slate-400', border: 'border-slate-400/40', text: 'text-slate-300', lightBg: 'bg-slate-500/15' };
      default:
        return { bg: 'bg-teal-400', border: 'border-teal-400/40', text: 'text-teal-300', lightBg: 'bg-teal-500/15' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl bg-[#0a0d14] border border-slate-800 text-slate-200 shadow-2xl p-5 sm:p-7 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-mono text-cyan-400 mb-1">
              <span className="capitalize">{technique.category}</span>
              <span>·</span>
              <span>{totalCycleSeconds}s Complete Cycle</span>
              <span>·</span>
              <span className="capitalize text-slate-400">{technique.target.replace('-', ' ')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif-display font-semibold text-white">
              {technique.name}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-1 leading-relaxed">
              {technique.subtitle}
            </p>

            {/* Outcome tags */}
            {technique.outcomes && technique.outcomes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {technique.outcomes.map(out => (
                  <span 
                    key={out}
                    className="text-[10px] sm:text-xs font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"
                  >
                    {out === 'sleep' && '🌙 '}
                    {out === 'calm' && '🧘 '}
                    {out === 'focus' && '🎯 '}
                    {out === 'energy' && '⚡ '}
                    {out === 'coherence' && '🫀 '}
                    {out === 'capacity' && '🫁 '}
                    {out}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contraindication Alert if applicable */}
        {technique.contraindications && technique.contraindications.length > 0 && (
          <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-300 flex items-start gap-3 shadow-inner">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold block text-amber-200 text-sm">Medical Considerations</strong>
              {technique.contraindications.map((contra, idx) => (
                <p key={idx} className="text-amber-300/90 leading-relaxed">{contra}</p>
              ))}
            </div>
          </div>
        )}

        {/* Proportional Phase Architecture Timeline */}
        <div className="mb-6 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-cyan-400" />
              <span>Phase Architecture &amp; Pacing</span>
            </h3>
            <span className="text-xs font-mono text-cyan-300">
              {technique.steps.length} Steps · {totalCycleSeconds}s Total
            </span>
          </div>

          {/* Proportional Bar */}
          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex mb-4 border border-slate-800 shadow-inner">
            {technique.steps.map((step, idx) => {
              const widthPct = Math.max(8, (step.duration / totalCycleSeconds) * 100);
              const phaseStyle = getPhaseColor(step.type);
              return (
                <div
                  key={idx}
                  style={{ width: `${widthPct}%` }}
                  title={`${step.label}: ${step.duration}s`}
                  className={`${phaseStyle.bg} h-full border-r border-slate-950 last:border-r-0 transition-all duration-300`}
                />
              );
            })}
          </div>

          {/* Unclipped Step Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {technique.steps.map((step, idx) => {
              const phaseStyle = getPhaseColor(step.type);
              return (
                <div 
                  key={idx}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition ${phaseStyle.lightBg} ${phaseStyle.border}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-400">Step {idx + 1}</span>
                    <span className={`font-mono font-bold text-xs sm:text-sm ${phaseStyle.text}`}>
                      {step.duration}s
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-white mb-1">
                    {step.label}
                  </div>
                  {step.subLabel && (
                    <div className="text-[11px] sm:text-xs text-slate-300/90 leading-relaxed mt-0.5">
                      {step.subLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Biological Mechanism & Clinical Science */}
        <div className="mb-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Biological &amp; Neurological Mechanism</span>
          </h3>
          <p className="text-xs sm:text-sm md:text-base leading-relaxed text-slate-300">
            {technique.science}
          </p>
        </div>

        {/* Benefits & Considerations */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-emerald-400 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Primary Benefits</span>
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
              {technique.pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Application &amp; Timing</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-2">
              {technique.description}
            </p>
            {technique.recommendedMinutes && (
              <div className="text-[11px] sm:text-xs font-mono text-cyan-300 mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Recommended: {technique.recommendedMinutes} minutes daily</span>
              </div>
            )}
          </div>
        </div>

        {/* Practice Cycle Selector & Start Action Footer */}
        <div className="pt-4 border-t border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-cyan-400" />
              <span>Session Target</span>
            </span>
            <span className="text-xs sm:text-sm font-mono text-cyan-300 font-semibold">
              {formatTotalTime(selectedCycles)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSelectedCycles(p.cycles)}
                className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                  selectedCycles === p.cycles
                    ? 'bg-slate-800 border border-cyan-400 text-white font-semibold shadow-md'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onSelectAndStart(technique, selectedCycles);
              onClose();
            }}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition mt-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Begin {technique.name} ({selectedCycles > 0 ? `${selectedCycles} Cycles` : 'Open Flow'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
