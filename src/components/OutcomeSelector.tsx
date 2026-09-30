import React from 'react';
import { OutcomeCategory } from '../types/breathwork';
import { Moon, Heart, Zap, Target, Wind, Sparkles, Activity } from 'lucide-react';

interface OutcomeSelectorProps {
  selectedOutcome: OutcomeCategory;
  onSelectOutcome: (outcome: OutcomeCategory) => void;
  countMap: Record<OutcomeCategory, number>;
}

export const OutcomeSelector: React.FC<OutcomeSelectorProps> = ({
  selectedOutcome,
  onSelectOutcome,
  countMap,
}) => {
  const outcomes: { id: OutcomeCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'all', label: 'All', icon: <Sparkles className="w-3 h-3" />, desc: 'Full breathwork library' },
    { id: 'sleep', label: 'Deep Sleep', icon: <Moon className="w-3 h-3" />, desc: 'Down-regulate for restorative rest' },
    { id: 'calm', label: 'Calm Mind', icon: <Wind className="w-3 h-3" />, desc: 'De-escalate acute stress and panic' },
    { id: 'focus', label: 'Focus & Flow', icon: <Target className="w-3 h-3" />, desc: 'Cognitive poise & mental clarity' },
    { id: 'coherence', label: 'HRV Coherence', icon: <Heart className="w-3 h-3" />, desc: 'Harmonize cardiovascular rhythm' },
    { id: 'energy', label: 'Vital Energy', icon: <Zap className="w-3 h-3" />, desc: 'Cellular thermogenesis & alertness' },
    { id: 'capacity', label: 'Lung Capacity', icon: <Activity className="w-3 h-3" />, desc: 'CO2 tolerance & diaphragm training' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {outcomes.map(item => {
          const isSelected = selectedOutcome === item.id;
          const count = countMap[item.id] || 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelectOutcome(item.id)}
              className={`shrink-0 flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium transition-all active:scale-95 ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-cyan-600/30 text-slate-950' : 'text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
