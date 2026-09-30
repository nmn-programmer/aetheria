import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Sliders, Award, Plus, Info, 
  CheckCircle2, ShieldAlert, Repeat, Sparkles
} from 'lucide-react';
import { 
  Technique, BreathPhaseType, AppSettings, UserStats, OutcomeCategory
} from './types/breathwork';
import { DEFAULT_TECHNIQUES } from './data/techniques';
import { audioEngine } from './audio/audioEngine';
import { triggerHaptic } from './utils/haptics';
import { wakeLockManager } from './utils/wakeLock';
import { 
  loadSettings, saveSettings, loadCustomTechniques, saveCustomTechniques,
  getAllTechniques, loadUserStats, recordSessionCompletion
} from './utils/storage';
import { BreathVisualizer } from './components/BreathVisualizer';
import { SettingsDrawer } from './components/SettingsDrawer';
import { StatsDrawer } from './components/StatsDrawer';
import { CustomPatternStudio } from './components/CustomPatternStudio';
import { TechniqueInfoModal } from './components/TechniqueInfoModal';
import { CycleConfigModal } from './components/CycleConfigModal';
import { OutcomeSelector } from './components/OutcomeSelector';
import { DesktopLeftPanel } from './components/desktop/DesktopLeftPanel';
import { DesktopRightPanel } from './components/desktop/DesktopRightPanel';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // App settings & persistence
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats);
  const [allTechniques, setAllTechniques] = useState<Technique[]>(() => getAllTechniques(settings.safetyFilter));
  const [customTechniques, setCustomTechniques] = useState<Technique[]>(loadCustomTechniques);

  // Outcome filter state
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeCategory>('all');

  // Desktop Collapsible Panels State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Active technique & customizable target cycles
  const [currentTechnique, setCurrentTechnique] = useState<Technique>(() => {
    const list = getAllTechniques(settings.safetyFilter);
    return list[0] || DEFAULT_TECHNIQUES[0];
  });
  const [sessionTargetCycles, setSessionTargetCycles] = useState<number>(() => currentTechnique.defaultCycles || 6);

  // Session state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathPhaseType>('prep');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [remainingPhaseSeconds, setRemainingPhaseSeconds] = useState(3);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Modals & Drawers
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPatternStudio, setShowPatternStudio] = useState(false);
  const [showCycleConfig, setShowCycleConfig] = useState(false);
  const [infoModalTechnique, setInfoModalTechnique] = useState<Technique | null>(null);

  // Zen Mode (Inactivity fadeout after 4 seconds of stillness during active practice)
  const [isZenDimmed, setIsZenDimmed] = useState(false);
  const zenTimerRef = useRef<number | null>(null);

  // High precision animation and timing refs
  const lastTickTimeRef = useRef<number>(0);
  const stepTimeAccumRef = useRef<number>(0);
  const isRunningRef = useRef(isRunning);
  const currentStepIndexRef = useRef(currentStepIndex);
  const currentTechniqueRef = useRef(currentTechnique);
  const sessionTargetCyclesRef = useRef(sessionTargetCycles);
  const completedCyclesRef = useRef(completedCycles);
  const settingsRef = useRef(settings);

  isRunningRef.current = isRunning;
  currentStepIndexRef.current = currentStepIndex;
  currentTechniqueRef.current = currentTechnique;
  sessionTargetCyclesRef.current = sessionTargetCycles;
  completedCyclesRef.current = completedCycles;
  settingsRef.current = settings;

  // Refresh techniques on filter change
  useEffect(() => {
    setAllTechniques(getAllTechniques(settings.safetyFilter));
  }, [settings.safetyFilter]);

  // Ambient sound playback sync
  useEffect(() => {
    if (isRunning && settings.ambientSound !== 'none') {
      audioEngine.setAmbientSound(settings.ambientSound, settings.ambientVolume);
    } else {
      audioEngine.setAmbientSound('none');
    }
  }, [isRunning, settings.ambientSound, settings.ambientVolume]);

  // Screen Wake Lock sync
  useEffect(() => {
    if (isRunning && settings.wakeLockEnabled) {
      wakeLockManager.requestLock();
    } else {
      wakeLockManager.releaseLock();
    }
  }, [isRunning, settings.wakeLockEnabled]);

  // Zen Mode Inactivity Monitor
  const resetZenTimer = useCallback(() => {
    setIsZenDimmed(false);
    if (zenTimerRef.current) {
      window.clearTimeout(zenTimerRef.current);
    }
    if (isRunning) {
      zenTimerRef.current = window.setTimeout(() => {
        setIsZenDimmed(true);
      }, 4000);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      resetZenTimer();
    } else {
      setIsZenDimmed(false);
      if (zenTimerRef.current) {
        window.clearTimeout(zenTimerRef.current);
      }
    }
    return () => {
      if (zenTimerRef.current) window.clearTimeout(zenTimerRef.current);
    };
  }, [isRunning, resetZenTimer]);

  // Settings update helper
  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
  };

  // Switch Active Technique
  const handleSelectTechnique = useCallback((tech: Technique, customCycles?: number) => {
    setIsRunning(false);
    wakeLockManager.releaseLock();
    setCurrentTechnique(tech);
    const targetCount = customCycles !== undefined ? customCycles : (tech.defaultCycles || 6);
    setSessionTargetCycles(targetCount);
    setCurrentStepIndex(0);
    setPhaseProgress(0);
    setCompletedCycles(0);
    setIsCompleted(false);
    stepTimeAccumRef.current = 0;

    const firstStep = tech.steps[0];
    if (settingsRef.current.prepCountdown) {
      setCurrentPhase('prep');
      setRemainingPhaseSeconds(3);
    } else {
      setCurrentPhase(firstStep.type);
      setRemainingPhaseSeconds(firstStep.duration);
    }
  }, []);

  // Session Complete Handler
  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(true);
    setCurrentPhase('complete');
    setPhaseProgress(1);
    setRemainingPhaseSeconds(0);

    audioEngine.playCompletionChime();
    triggerHaptic('complete', settingsRef.current.hapticsEnabled);
    wakeLockManager.releaseLock();

    const cycleSecs = currentTechniqueRef.current.steps.reduce((acc, s) => acc + s.duration, 0);
    const totalSecs = cycleSecs * Math.max(1, completedCyclesRef.current);
    const updatedStats = recordSessionCompletion({
      techniqueId: currentTechniqueRef.current.id,
      techniqueName: currentTechniqueRef.current.name,
      durationSeconds: Math.max(30, Math.round(totalSecs)),
      completedCycles: completedCyclesRef.current,
    });
    setUserStats(updatedStats);
  }, []);

  // Main High-Precision Time Engine Loop
  useEffect(() => {
    if (!isRunning) return;

    let animId: number;
    lastTickTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (!isRunningRef.current) return;

      const dt = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      // Handle prep countdown
      if (currentPhase === 'prep') {
        stepTimeAccumRef.current += dt;
        const remaining = 3 - stepTimeAccumRef.current;
        setRemainingPhaseSeconds(Math.max(0, remaining));
        setPhaseProgress(Math.min(1, stepTimeAccumRef.current / 3));

        if (remaining <= 0) {
          stepTimeAccumRef.current = 0;
          setCurrentStepIndex(0);
          const firstStep = currentTechniqueRef.current.steps[0];
          setCurrentPhase(firstStep.type);
          setRemainingPhaseSeconds(firstStep.duration);
          audioEngine.playPhaseCue(settingsRef.current.audioGuidance, firstStep.type);
          triggerHaptic(firstStep.type, settingsRef.current.hapticsEnabled);
        }
        animId = requestAnimationFrame(loop);
        return;
      }

      // Normal breathing phase execution
      const currentStep = currentTechniqueRef.current.steps[currentStepIndexRef.current];
      if (!currentStep) return;

      stepTimeAccumRef.current += dt;
      const duration = currentStep.duration;
      const progress = Math.min(1, stepTimeAccumRef.current / duration);
      const remaining = Math.max(0, duration - stepTimeAccumRef.current);

      setPhaseProgress(progress);
      setRemainingPhaseSeconds(remaining);

      // Phase step transition
      if (stepTimeAccumRef.current >= duration) {
        stepTimeAccumRef.current = 0;
        const nextStepIdx = currentStepIndexRef.current + 1;

        if (nextStepIdx < currentTechniqueRef.current.steps.length) {
          currentStepIndexRef.current = nextStepIdx;
          setCurrentStepIndex(nextStepIdx);
          const nextStep = currentTechniqueRef.current.steps[nextStepIdx];
          setCurrentPhase(nextStep.type);
          setRemainingPhaseSeconds(nextStep.duration);
          audioEngine.playPhaseCue(settingsRef.current.audioGuidance, nextStep.type);
          triggerHaptic(nextStep.type, settingsRef.current.hapticsEnabled);
        } else {
          // Cycle finished
          const nextCycleCount = completedCyclesRef.current + 1;
          completedCyclesRef.current = nextCycleCount;
          setCompletedCycles(nextCycleCount);

          const target = sessionTargetCyclesRef.current;
          if (target > 0 && nextCycleCount >= target) {
            handleSessionComplete();
            return;
          } else {
            currentStepIndexRef.current = 0;
            setCurrentStepIndex(0);
            const firstStep = currentTechniqueRef.current.steps[0];
            setCurrentPhase(firstStep.type);
            setRemainingPhaseSeconds(firstStep.duration);
            audioEngine.playPhaseCue(settingsRef.current.audioGuidance, firstStep.type);
            triggerHaptic(firstStep.type, settingsRef.current.hapticsEnabled);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, currentPhase, handleSessionComplete]);

  // Start / Resume Practice
  const startSession = useCallback(() => {
    audioEngine.ensureRunning();
    if (isCompleted) {
      setCurrentStepIndex(0);
      setCompletedCycles(0);
      setIsCompleted(false);
      stepTimeAccumRef.current = 0;
    }

    if (settingsRef.current.prepCountdown && completedCyclesRef.current === 0 && currentStepIndexRef.current === 0 && currentPhase !== 'prep') {
      setCurrentPhase('prep');
      setRemainingPhaseSeconds(3);
      stepTimeAccumRef.current = 0;
    } else if (currentPhase !== 'prep') {
      const activeStep = currentTechniqueRef.current.steps[currentStepIndexRef.current];
      if (activeStep) {
        audioEngine.playPhaseCue(settingsRef.current.audioGuidance, activeStep.type);
        triggerHaptic(activeStep.type, settingsRef.current.hapticsEnabled);
      }
    }

    lastTickTimeRef.current = performance.now();
    setIsRunning(true);
    if (!sessionStartTime) setSessionStartTime(Date.now());
  }, [isCompleted, currentPhase, sessionStartTime]);

  // Pause Practice
  const pauseSession = useCallback(() => {
    setIsRunning(false);
    wakeLockManager.releaseLock();
  }, []);

  // Reset Practice
  const resetSession = useCallback(() => {
    pauseSession();
    setCurrentStepIndex(0);
    setCompletedCycles(0);
    setPhaseProgress(0);
    setIsCompleted(false);
    stepTimeAccumRef.current = 0;

    if (settingsRef.current.prepCountdown) {
      setCurrentPhase('prep');
      setRemainingPhaseSeconds(3);
    } else {
      const firstStep = currentTechniqueRef.current.steps[0];
      setCurrentPhase(firstStep.type);
      setRemainingPhaseSeconds(firstStep.duration);
    }
  }, [pauseSession]);

  // Desktop Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunningRef.current) {
          pauseSession();
        } else {
          startSession();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetSession();
      } else if (e.key === '[') {
        e.preventDefault();
        setIsLeftPanelOpen(prev => !prev);
      } else if (e.key === ']') {
        e.preventDefault();
        setIsRightPanelOpen(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleUpdateSettings({
          audioGuidance: settingsRef.current.audioGuidance === 'silent' ? 'singing-bowl' : 'silent'
        });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const available = allTechniques;
        const currentIdx = available.findIndex(t => t.id === currentTechniqueRef.current.id);
        if (currentIdx !== -1) {
          let nextIdx = e.key === 'ArrowRight' ? currentIdx + 1 : currentIdx - 1;
          if (nextIdx >= available.length) nextIdx = 0;
          if (nextIdx < 0) nextIdx = available.length - 1;
          handleSelectTechnique(available[nextIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allTechniques, handleSelectTechnique, pauseSession, resetSession, startSession]);

  // Save Custom Pattern
  const handleSaveCustomPattern = (newPattern: Technique) => {
    const updated = [newPattern, ...customTechniques];
    setCustomTechniques(updated);
    saveCustomTechniques(updated);
    setAllTechniques(getAllTechniques(settings.safetyFilter));
    handleSelectTechnique(newPattern);
  };

  // Delete Custom Pattern
  const handleDeleteCustomPattern = (id: string) => {
    const updated = customTechniques.filter(t => t.id !== id);
    setCustomTechniques(updated);
    saveCustomTechniques(updated);
    setAllTechniques(getAllTechniques(settings.safetyFilter));
    if (currentTechnique.id === id) {
      handleSelectTechnique(DEFAULT_TECHNIQUES[0]);
    }
  };

  // Outcome counts calculation
  const outcomeCountMap: Record<OutcomeCategory, number> = {
    all: allTechniques.length,
    sleep: allTechniques.filter(t => t.outcomes?.includes('sleep')).length,
    calm: allTechniques.filter(t => t.outcomes?.includes('calm')).length,
    focus: allTechniques.filter(t => t.outcomes?.includes('focus')).length,
    coherence: allTechniques.filter(t => t.outcomes?.includes('coherence')).length,
    energy: allTechniques.filter(t => t.outcomes?.includes('energy')).length,
    capacity: allTechniques.filter(t => t.outcomes?.includes('capacity')).length,
  };

  const filteredTechniques = selectedOutcome === 'all'
    ? allTechniques
    : allTechniques.filter(t => t.outcomes?.includes(selectedOutcome));

  // Visual cues text
  let phaseLabel = 'Ready to begin';
  let phaseSubLabel: string | undefined = currentTechnique.subtitle;

  if (currentPhase === 'prep') {
    phaseLabel = 'Settle In';
    phaseSubLabel = 'Get into a comfortable posture';
  } else if (currentPhase === 'complete') {
    phaseLabel = 'Practice Complete';
    phaseSubLabel = 'Notice the peaceful stillness in your body';
  } else if (isRunning || remainingPhaseSeconds > 0) {
    const currentStep = currentTechnique.steps[currentStepIndex];
    if (currentStep) {
      phaseLabel = currentStep.label;
      phaseSubLabel = currentStep.subLabel;
    }
  }

  // Atmospheric background colors
  let bgClasses = 'bg-[#07080D]';
  let ambientGlowColor = 'radial-gradient(circle at 50% 45%, rgba(99, 102, 241, 0.12), transparent 75%)';

  if (settings.themeMode === 'oled') {
    bgClasses = 'bg-[#000000]';
    ambientGlowColor = 'none';
  } else if (currentTechnique.target === 'coherence') {
    bgClasses = 'bg-[#0A0D10]';
    ambientGlowColor = 'radial-gradient(circle at 50% 45%, rgba(45, 212, 191, 0.12), rgba(56, 189, 248, 0.05) 50%, transparent 80%)';
  } else if (currentTechnique.target === 'energy') {
    bgClasses = 'bg-[#0E0C0B]';
    ambientGlowColor = 'radial-gradient(circle at 50% 45%, rgba(251, 146, 60, 0.14), rgba(244, 63, 94, 0.04) 50%, transparent 80%)';
  }

  return (
    <div className={`relative flex flex-row w-full h-[100dvh] min-h-[100dvh] overflow-hidden select-none transition-colors duration-1000 ${bgClasses}`}>
      {/* Dynamic Atmospheric Ambient Glow */}
      <div 
        className="pointer-events-none absolute inset-0 transition-all duration-1000 z-0"
        style={{ background: ambientGlowColor }}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* DESKTOP LEFT PANEL (Practice Library & Intention Studio) */}
      <DesktopLeftPanel
        isOpen={isLeftPanelOpen}
        onToggle={() => setIsLeftPanelOpen(prev => !prev)}
        selectedOutcome={selectedOutcome}
        onSelectOutcome={setSelectedOutcome}
        outcomeCountMap={outcomeCountMap}
        techniques={filteredTechniques}
        currentTechnique={currentTechnique}
        onSelectTechnique={handleSelectTechnique}
        onOpenPatternStudio={() => setShowPatternStudio(true)}
        onOpenInfoModal={tech => setInfoModalTechnique(tech)}
      />

      {/* CENTER FOCAL SANCTUARY */}
      <main 
        onClick={resetZenTimer}
        className="relative z-10 flex-1 flex flex-col justify-between h-full overflow-hidden transition-all duration-500"
      >
        {/* Top Header Bar */}
        <header className={`w-full max-w-4xl mx-auto px-4 pt-safe flex items-center justify-between transition-opacity duration-700 shrink-0 ${
          isZenDimmed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-slate-700/60 flex items-center justify-center text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white font-serif-display">Aetheria</h1>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="capitalize">{currentTechnique.target.replace('-', ' ')}</span>
                <span>·</span>
                <span className="hidden sm:inline">{currentTechnique.category}</span>
                <span className="sm:hidden">Offline</span>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />

            <button
              onClick={() => setShowStats(true)}
              title="Practice Habits Log"
              className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center active:scale-95 transition"
            >
              <Award className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              title="Experience Settings"
              className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center active:scale-95 transition"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Center Visualizer Breathing Stage */}
        <section className="relative flex-1 flex flex-col items-center justify-center px-4 w-full max-w-xl mx-auto my-auto min-h-0">
          {/* Active Technique Pill & Cycle Adjustment Trigger */}
          <div className={`mb-2 flex items-center gap-2 transition-opacity duration-700 ${
            isZenDimmed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <button
              onClick={() => setInfoModalTechnique(currentTechnique)}
              className="flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition active:scale-95 shadow-sm"
            >
              <span className="font-medium text-white">{currentTechnique.name}</span>
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </button>

            {/* Quick cycle configurator trigger */}
            <button
              onClick={() => setShowCycleConfig(true)}
              className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-cyan-300 text-[11px] font-mono transition active:scale-95 shadow-sm"
              title="Adjust target cycles"
            >
              <Repeat className="w-3 h-3" />
              <span>{sessionTargetCycles > 0 ? `${sessionTargetCycles}c` : '∞'}</span>
            </button>
          </div>

          {/* HTML5 Canvas 2D Breath Visualizer */}
          <BreathVisualizer
            phase={currentPhase}
            phaseProgress={phaseProgress}
            remainingPhaseSeconds={remainingPhaseSeconds}
            phaseLabel={phaseLabel}
            phaseSubLabel={phaseSubLabel}
            cycleCount={completedCycles + 1}
            totalCycles={sessionTargetCycles}
            isRunning={isRunning}
            visualizerMode={settings.visualizerMode}
            target={currentTechnique.target}
            isOled={settings.themeMode === 'oled'}
            onOpenCycleConfig={() => setShowCycleConfig(true)}
          />

          {/* Completion Card */}
          {isCompleted && (
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 text-center max-w-xs animate-in zoom-in-95 duration-300 shadow-xl shadow-cyan-950/20">
              <div className="w-9 h-9 mx-auto rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-1.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white font-serif-display">Practice Complete</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed {completedCycles} cycles of {currentTechnique.name}.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={resetSession}
                  className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  Reset
                </button>
                <button
                  onClick={startSession}
                  className="flex-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition"
                >
                  Repeat
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Interactive Area */}
        <footer className={`w-full max-w-xl mx-auto px-4 pb-safe flex flex-col gap-2.5 transition-opacity duration-700 shrink-0 ${
          isZenDimmed ? 'opacity-25 hover:opacity-100' : 'opacity-100'
        }`}>
          {/* Mobile-Only Outcome Selector & Quick Carousel (hidden on lg desktop since left panel has it) */}
          <div className="lg:hidden flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="uppercase tracking-wider">What is your intention?</span>
              <button
                onClick={() => setShowPatternStudio(true)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Studio</span>
              </button>
            </div>
            <OutcomeSelector
              selectedOutcome={selectedOutcome}
              onSelectOutcome={setSelectedOutcome}
              countMap={outcomeCountMap}
            />

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {filteredTechniques.map(tech => {
                const isSelected = tech.id === currentTechnique.id;
                let dotColor = 'bg-cyan-400';
                if (tech.target === 'down-regulation') dotColor = 'bg-indigo-400';
                else if (tech.target === 'energy') dotColor = 'bg-amber-400';

                return (
                  <button
                    key={tech.id}
                    onClick={() => handleSelectTechnique(tech)}
                    className={`shrink-0 py-2 px-3 rounded-2xl border text-xs font-medium transition-all active:scale-95 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400/80 text-white shadow-md shadow-cyan-950/20'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="whitespace-nowrap">{tech.name}</span>
                    {tech.intensity === 'intense' && (
                      <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Interactive Controls (Play / Pause / Reset) */}
          <div className="flex items-center justify-center gap-4 py-1.5">
            {/* Reset Button */}
            <button
              onClick={resetSession}
              title="Reset practice (R)"
              className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center active:scale-90 transition shadow-sm"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Tactile Play / Pause Action Button */}
            <button
              onClick={isRunning ? pauseSession : startSession}
              title={isRunning ? 'Pause practice (Space)' : 'Start practice (Space)'}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all duration-300 ${
                isRunning
                  ? 'bg-slate-800/95 border border-slate-700 text-white shadow-slate-900/40'
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-500 text-slate-950 shadow-cyan-500/25 hover:opacity-95'
              }`}
            >
              {isRunning ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
              )}
            </button>

            {/* Science & Medical Info Trigger */}
            <button
              onClick={() => setInfoModalTechnique(currentTechnique)}
              title="View Science & Medical Mechanism"
              className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center active:scale-90 transition shadow-sm"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop hotkeys hint */}
          <div className="text-center text-[10px] text-slate-500 font-mono tracking-wider transition-opacity">
            <span className="hidden lg:inline">
              [Space] {isRunning ? 'Pause' : 'Play'} · [R] Reset · [← →] Switch Routine · [ [ ] ] Sidebars
            </span>
            <span className="lg:hidden uppercase">
              {isRunning ? (isZenDimmed ? 'Tap to wake controls' : 'Zen mode activates in 4s') : 'Select rhythm and begin'}
            </span>
          </div>
        </footer>
      </main>

      {/* DESKTOP RIGHT PANEL (Telemetry, Soundscape & Habits) */}
      <DesktopRightPanel
        isOpen={isRightPanelOpen}
        onToggle={() => setIsRightPanelOpen(prev => !prev)}
        technique={currentTechnique}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        stats={userStats}
        onOpenInfoModal={tech => setInfoModalTechnique(tech)}
        onOpenStats={() => setShowStats(true)}
      />

      {/* Modals & Bottom Drawers */}
      {showSettings && (
        <SettingsDrawer
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
          onOpenStats={() => {
            setShowSettings(false);
            setShowStats(true);
          }}
        />
      )}

      {showStats && (
        <StatsDrawer
          stats={userStats}
          onClose={() => setShowStats(false)}
          onRefreshData={() => {
            setUserStats(loadUserStats());
            setSettings(loadSettings());
            setCustomTechniques(loadCustomTechniques());
            setAllTechniques(getAllTechniques(settings.safetyFilter));
          }}
        />
      )}

      {showPatternStudio && (
        <CustomPatternStudio
          onClose={() => setShowPatternStudio(false)}
          onSavePattern={handleSaveCustomPattern}
          existingCustoms={customTechniques}
          onDeletePattern={handleDeleteCustomPattern}
        />
      )}

      {showCycleConfig && (
        <CycleConfigModal
          technique={currentTechnique}
          currentCycles={sessionTargetCycles}
          onSetCycles={cycles => setSessionTargetCycles(cycles)}
          onClose={() => setShowCycleConfig(false)}
        />
      )}

      {infoModalTechnique && (
        <TechniqueInfoModal
          technique={infoModalTechnique}
          onClose={() => setInfoModalTechnique(null)}
          onSelectAndStart={(tech, customCycles) => {
            handleSelectTechnique(tech, customCycles);
            setTimeout(() => startSession(), 100);
          }}
        />
      )}
    </div>
  );
}
