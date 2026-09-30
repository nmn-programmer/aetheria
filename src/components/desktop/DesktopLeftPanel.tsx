import React from 'react';
import { 
  Sparkles, Plus, ShieldAlert, ChevronLeft, ChevronRight, 
  PanelLeftClose, PanelLeftOpen, Compass
} from 'lucide-react';
import { Technique, OutcomeCategory } from '../../types/breathwork';
import { OutcomeSelector } from '../OutcomeSelector';

interface DesktopLeftPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedOutcome: OutcomeCategory;
  onSelectOutcome: (cat: OutcomeCategory) => void;
  outcomeCountMap: Record<OutcomeCategory, number>;
  techniques: Technique[];
  currentTechnique: Technique;
  onSelectTechnique: (tech: Technique) => void;
  onOpenPatternStudio: () => void;
  onOpenInfoModal: (tech: Technique) => void;
}

export const DesktopLeftPanel: React.FC<DesktopLeftPanelProps> = ({
  isOpen,
  onToggle,
  selectedOutcome,
  onSelectOutcome,
  outcomeCountMap,
  techniques,
  currentTechnique,
  onSelectTechnique,
  onOpenPatternStudio,
  onOpenInfoModal,
}) => {
  return (
    <aside 
      className={`hidden lg:flex flex-col h-full bg-[#0a0d13]/85 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 ease-in-out relative z-20 shrink-0 ${
        isOpen ? 'w-80 xl:w-88 p-4' : 'w-14 p-2 items-center'
      }`}
    >
      {/* Toggle button on top */}
      <div className={`flex items-center mb-3 w-full ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {isOpen ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Practice Library</span>
          </div>
        ) : null}

        <button
          onClick={onToggle}
          title={isOpen ? 'Collapse Library Panel ( [ )' : 'Expand Library Panel ( [ )'}
          className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-95"
        >
          {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isOpen ? (
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Outcome Filter */}
          <div>
            <div className="text-[10px] xl:text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
              Select Intention
            </div>
            <OutcomeSelector
              selectedOutcome={selectedOutcome}
              onSelectOutcome={onSelectOutcome}
              countMap={outcomeCountMap}
            />
          </div>

          {/* Technique list */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
            <div className="flex items-center justify-between text-[10px] xl:text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>Routines ({techniques.length})</span>
              <button
                onClick={onOpenPatternStudio}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>

            {techniques.map(tech => {
              const isSelected = tech.id === currentTechnique.id;
              const totalCycleSeconds = tech.steps.reduce((acc, s) => acc + s.duration, 0);

              let dotColor = 'bg-cyan-400';
              if (tech.target === 'down-regulation') dotColor = 'bg-indigo-400';
              else if (tech.target === 'energy') dotColor = 'bg-amber-400';

              return (
                <div
                  key={tech.id}
                  onClick={() => onSelectTechnique(tech)}
                  className={`group relative p-2.5 xl:p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400/80 text-white shadow-md shadow-cyan-950/20'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-xs xl:text-sm font-medium text-white group-hover:text-cyan-300 transition">
                        {tech.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {tech.intensity === 'intense' && (
                        <span title="High intensity routine" className="inline-flex">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                      <span className="text-[10px] xl:text-xs font-mono text-slate-400">
                        {totalCycleSeconds}s
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] xl:text-xs text-slate-400 line-clamp-1 mt-1 pl-4">
                    {tech.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom Custom Studio Trigger */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={onOpenPatternStudio}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs xl:text-sm font-medium text-slate-200 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Create Custom Rhythm</span>
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed Icon Bar */
        <div className="flex-1 flex flex-col items-center justify-between py-2">
          <div className="space-y-3">
            <button
              onClick={onOpenPatternStudio}
              title="Create Custom Rhythm"
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 hover:text-white hover:border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[9px] font-mono text-slate-500 uppercase [writing-mode:vertical-rl] rotate-180 tracking-widest">
            Library
          </div>
        </div>
      )}
    </aside>
  );
};
