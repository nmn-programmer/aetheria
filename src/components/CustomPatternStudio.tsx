import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, Sparkles, AlertCircle, Play, Trash2 } from 'lucide-react';
import { Technique, NervousSystemTarget, BreathPhaseStep } from '../types/breathwork';

interface CustomPatternStudioProps {
  onClose: () => void;
  onSavePattern: (tech: Technique) => void;
  existingCustoms: Technique[];
  onDeletePattern: (id: string) => void;
}

export const CustomPatternStudio: React.FC<CustomPatternStudioProps> = ({
  onClose,
  onSavePattern,
  existingCustoms,
  onDeletePattern,
}) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState<NervousSystemTarget>('coherence');
  const [inhale, setInhale] = useState<number>(4);
  const [holdIn, setHoldIn] = useState<number>(4);
  const [exhale, setExhale] = useState<number>(4);
  const [holdOut, setHoldOut] = useState<number>(0);
  const [cycles, setCycles] = useState<number>(6);

  // Live mini preview state
  const [previewPhase, setPreviewPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');
  const [previewProgress, setPreviewProgress] = useState(0);

  // Total cycle calculation
  const totalDuration = inhale + holdIn + exhale + holdOut;

  // Live preview animation loop
  useEffect(() => {
    let currentPhaseIdx = 0;
    const allPhases: { type: 'inhale' | 'hold-in' | 'exhale' | 'hold-out'; dur: number }[] = [
      { type: 'inhale', dur: inhale },
      { type: 'hold-in', dur: holdIn },
      { type: 'exhale', dur: exhale },
      { type: 'hold-out', dur: holdOut },
    ];
    const phases = allPhases.filter(p => p.dur > 0);

    if (phases.length === 0) return;

    let phaseStartTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const current = phases[currentPhaseIdx];
      const elapsed = (now - phaseStartTime) / 1000;
      const progress = Math.min(1, elapsed / current.dur);

      setPreviewPhase(current.type);
      setPreviewProgress(progress);

      if (elapsed >= current.dur) {
        currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
        phaseStartTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [inhale, holdIn, exhale, holdOut]);

  const handleSave = () => {
    const trimmed = name.trim() || 'My Breath Rhythm';
    const steps: BreathPhaseStep[] = [];

    if (inhale > 0) steps.push({ type: 'inhale', label: 'Inhale', subLabel: 'Breathe in deep', duration: inhale });
    if (holdIn > 0) steps.push({ type: 'hold-in', label: 'Hold Breath', subLabel: 'Retain gently', duration: holdIn });
    if (exhale > 0) steps.push({ type: 'exhale', label: 'Exhale', subLabel: 'Release fully', duration: exhale });
    if (holdOut > 0) steps.push({ type: 'hold-out', label: 'Hold Empty', subLabel: 'Rest in stillness', duration: holdOut });

    const targetOutcomes = target === 'down-regulation' 
      ? ['sleep' as const, 'calm' as const] 
      : target === 'energy' 
      ? ['energy' as const, 'focus' as const] 
      : ['coherence' as const, 'focus' as const];

    const newTechnique: Technique = {
      id: 'custom_' + Date.now(),
      name: trimmed,
      subtitle: `Custom ${inhale}-${holdIn}-${exhale}-${holdOut} Pattern`,
      target,
      outcomes: targetOutcomes,
      category: 'Custom Studio',
      intensity: holdIn > 15 || holdOut > 12 ? 'intense' : 'gentle',
      description: `User-crafted breath rhythm consisting of ${inhale}s inhale, ${holdIn}s retention, ${exhale}s exhale, and ${holdOut}s suspension.`,
      science: 'Personalized cadence adapted for individual lung capacity and autonomic pacing.',
      steps,
      defaultCycles: cycles,
      isCustom: true,
      pros: ['Tailored precisely to your breath tolerance', 'Optimized for personal pacing'],
      contraindications: holdIn > 15 || holdOut > 12 
        ? ['Long breath retention: stop immediately if lightheaded or dizzy.']
        : undefined,
    };

    onSavePattern(newTechnique);
    onClose();
  };

  // Preview circle scale
  let circleScale = 0.4;
  if (previewPhase === 'inhale') {
    circleScale = 0.4 + previewProgress * 0.5;
  } else if (previewPhase === 'hold-in') {
    circleScale = 0.9;
  } else if (previewPhase === 'exhale') {
    circleScale = 0.9 - previewProgress * 0.5;
  } else if (previewPhase === 'hold-out') {
    circleScale = 0.4;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[86vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl bg-[#0b0e14] border border-slate-800 text-slate-200 shadow-2xl p-6 relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase">Pattern Studio</div>
            <h2 className="text-xl font-serif-display font-semibold text-white">Create Custom Breath Rhythm</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Mini Preview Orb */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 flex items-center justify-between gap-4">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <div 
              className="absolute rounded-full transition-all duration-75"
              style={{
                width: `${circleScale * 88}px`,
                height: `${circleScale * 88}px`,
                background: target === 'down-regulation' 
                  ? 'radial-gradient(circle, #818cf8, #38bdf8 70%, transparent 100%)'
                  : target === 'energy'
                  ? 'radial-gradient(circle, #fb923c, #f43f5e 70%, transparent 100%)'
                  : 'radial-gradient(circle, #38bdf8, #34d399 70%, transparent 100%)',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              }}
            />
            <div className="z-10 text-[10px] font-mono uppercase tracking-wider text-white font-semibold drop-shadow">
              {previewPhase.replace('-', ' ')}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="text-xs font-medium text-white flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
              <span>Real-Time Rhythm Preview</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Total cycle: <strong className="text-cyan-300 font-mono">{totalDuration}s</strong> · {((60 / totalDuration) || 0).toFixed(1)} breaths/min
            </p>
            <div className="flex items-center gap-1 pt-1 text-[11px] font-mono text-slate-300">
              <span className="text-cyan-400">{inhale}s</span>
              <span>-</span>
              <span className="text-indigo-400">{holdIn}s</span>
              <span>-</span>
              <span className="text-emerald-400">{exhale}s</span>
              <span>-</span>
              <span className="text-amber-400">{holdOut}s</span>
            </div>
          </div>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Technique Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My Evening Wind-Down"
            maxLength={35}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Target Atmosphere / Nervous System */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Atmosphere / Target
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'down-regulation', label: 'Down-Regulate', color: 'border-indigo-500/40 text-indigo-300' },
              { id: 'coherence', label: 'Coherence', color: 'border-cyan-500/40 text-cyan-300' },
              { id: 'energy', label: 'Energize', color: 'border-amber-500/40 text-amber-300' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTarget(opt.id as NervousSystemTarget)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  target === opt.id
                    ? `bg-slate-800 border-white text-white shadow-sm`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tactile Numeric Steppers */}
        <div className="space-y-3 mb-5">
          {/* Inhale */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Inhale Duration</div>
              <div className="text-[10px] text-slate-400">Fill your lungs with air</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInhale(Math.max(1, inhale - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-cyan-400 text-base">{inhale}s</span>
              <button
                type="button"
                onClick={() => setInhale(Math.min(20, inhale + 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hold In */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Hold In (Retention)</div>
              <div className="text-[10px] text-slate-400">Keep full lungs still</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHoldIn(Math.max(0, holdIn - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-indigo-400 text-base">{holdIn}s</span>
              <button
                type="button"
                onClick={() => setHoldIn(Math.min(30, holdIn + 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Exhale */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Exhale Duration</div>
              <div className="text-[10px] text-slate-400">Empty lungs slowly</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExhale(Math.max(1, exhale - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-emerald-400 text-base">{exhale}s</span>
              <button
                type="button"
                onClick={() => setExhale(Math.min(20, exhale + 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hold Out */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Hold Out (Suspension)</div>
              <div className="text-[10px] text-slate-400">Empty lung pause</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHoldOut(Math.max(0, holdOut - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-amber-400 text-base">{holdOut}s</span>
              <button
                type="button"
                onClick={() => setHoldOut(Math.min(30, holdOut + 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Target Cycles */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Target Cycles</div>
              <div className="text-[10px] text-slate-400">Approx. {Math.round((totalDuration * cycles) / 60)} min practice</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCycles(Math.max(1, cycles - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-white text-base">{cycles}</span>
              <button
                type="button"
                onClick={() => setCycles(Math.min(50, cycles + 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Safety flag notice if hold is high */}
        {(holdIn > 15 || holdOut > 12) && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Prolonged breath retentions (&gt;15s) can induce hypercapnia. Maintain relaxation and stop if uncomfortable.</span>
          </div>
        )}

        {/* Existing Custom Patterns List */}
        {existingCustoms.length > 0 && (
          <div className="mb-5 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Saved Custom Rhythms ({existingCustoms.length})
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
              {existingCustoms.map(cust => (
                <div key={cust.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div>
                    <div className="text-xs font-medium text-white">{cust.name}</div>
                    <div className="text-[10px] text-slate-400">{cust.subtitle}</div>
                  </div>
                  <button
                    onClick={() => onDeletePattern(cust.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition"
                    title="Delete pattern"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Select Pattern</span>
          </button>
        </div>
      </div>
    </div>
  );
};
