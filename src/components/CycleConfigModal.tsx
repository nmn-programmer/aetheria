import React from 'react';
import { X, Clock, Repeat, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { Technique } from '../types/breathwork';

interface CycleConfigModalProps {
  technique: Technique;
  currentCycles: number;
  onSetCycles: (cycles: number) => void;
  onClose: () => void;
}

export const CycleConfigModal: React.FC<CycleConfigModalProps> = ({
  technique,
  currentCycles,
  onSetCycles,
  onClose,
}) => {
  const totalCycleSeconds = technique.steps.reduce((acc, s) => acc + s.duration, 0);

  const formatTotalTime = (cycles: number) => {
    if (cycles === 0) return 'Continuous (Open Flow)';
    const totalSecs = Math.round(cycles * totalCycleSeconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs} seconds`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} minutes`;
  };

  const tenMinuteCycles = Math.max(1, Math.round(600 / totalCycleSeconds));
  const fifteenMinuteCycles = Math.max(1, Math.round(900 / totalCycleSeconds));

  const presets = [
    { label: '4 Cycles', sub: 'Quick Reset', cycles: 4 },
    { label: '8 Cycles', sub: 'Standard', cycles: 8 },
    { label: '10 Mins', sub: `${tenMinuteCycles} cycles`, cycles: tenMinuteCycles },
    { label: '15 Mins', sub: `${fifteenMinuteCycles} cycles`, cycles: fifteenMinuteCycles },
    { label: '∞ Open Flow', sub: 'No limit', cycles: 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0d1017] border border-slate-800 text-slate-200 shadow-2xl p-6 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Target Practice Cycles</h3>
              <p className="text-[11px] text-slate-400">{technique.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Duration Estimate */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Estimated Duration</span>
          </div>
          <div className="text-xs font-mono font-bold text-cyan-300">
            {formatTotalTime(currentCycles)}
          </div>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => onSetCycles(p.cycles)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                currentCycles === p.cycles
                  ? 'bg-slate-800 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="text-xs font-semibold text-white flex items-center justify-between">
                <span>{p.label}</span>
                {p.cycles === 0 && <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">{p.sub}</span>
            </button>
          ))}
        </div>

        {/* Manual Stepper */}
        {currentCycles > 0 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 mb-5">
            <div>
              <div className="text-xs font-medium text-white">Custom Cycles</div>
              <div className="text-[10px] text-slate-400">Tap + or - to dial in count</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSetCycles(Math.max(1, currentCycles - 1))}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition font-bold"
              >
                -
              </button>
              <span className="w-8 text-center font-mono font-bold text-white text-sm">
                {currentCycles}
              </span>
              <button
                type="button"
                onClick={() => onSetCycles(Math.min(99, currentCycles + 1))}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition font-bold"
              >
                +
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition"
        >
          Confirm Target
        </button>
      </div>
    </div>
  );
};
