import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Info, Sparkles, HeartPulse, Brain, Clock, Repeat } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg max-h-[88vh] sm:max-h-[84vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl bg-[#0d1017] border border-slate-800 text-slate-200 shadow-2xl p-6 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>{technique.category}</span>
              <span>·</span>
              <span>{totalCycleSeconds}s cycle</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-display font-semibold text-white">
              {technique.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{technique.subtitle}</p>

            {/* Outcome tags */}
            {technique.outcomes && technique.outcomes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {technique.outcomes.map(out => (
                  <span 
                    key={out}
                    className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"
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
            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contraindication Alert if applicable */}
        {technique.contraindications && technique.contraindications.length > 0 && (
          <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold block text-amber-200">Medical Precautions</strong>
              {technique.contraindications.map((contra, idx) => (
                <p key={idx} className="text-amber-300/90 leading-relaxed">{contra}</p>
              ))}
            </div>
          </div>
        )}

        {/* Breath Cycle Sequence Steps */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
            Phase Architecture
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {technique.steps.map((step, idx) => (
              <div 
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                  <span className="font-mono font-semibold text-cyan-300">{step.duration}s</span>
                </div>
                <div className="text-xs font-medium text-white line-clamp-1">{step.label}</div>
                {step.subLabel && (
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{step.subLabel}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Biological Mechanism & Science */}
        <div className="mb-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            Biological Mechanism
          </h3>
          <p className="text-xs leading-relaxed text-slate-300">{technique.science}</p>
        </div>

        {/* Benefits & Considerations */}
        <div className="mb-5 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Primary Benefits
            </h4>
            <ul className="space-y-1 text-xs text-slate-300 pl-1">
              {technique.pros.map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {technique.cons && technique.cons.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Considerations
              </h4>
              <ul className="space-y-1 text-xs text-slate-400 pl-1">
                {technique.cons.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Practice Duration & Cycles Configurator */}
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-cyan-400" />
              Session Duration
            </span>
            <span className="font-mono text-cyan-300 font-medium">
              {formatTotalTime(selectedCycles)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSelectedCycles(p.cycles)}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium transition ${
                  selectedCycles === p.cycles
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {selectedCycles > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Custom count</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCycles(Math.max(1, selectedCycles - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-95"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono font-bold text-white text-xs">
                  {selectedCycles}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCycles(Math.min(99, selectedCycles + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-1">
          <button
            onClick={() => {
              onSelectAndStart(technique, selectedCycles);
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {selectedCycles === 0 ? 'Begin Open Flow Practice' : `Begin Practice (${selectedCycles} Cycles)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
