/**
 * High-Performance HTML5 Canvas 2D Breath Visualizer
 * Fully optimized with requestAnimationFrame, exact delta time tracking,
 * 0% CPU/GPU consumption when paused/idle/hidden, and dual visualization modes.
 */

import React, { useEffect, useRef } from 'react';
import { BreathPhaseType, NervousSystemTarget, VisualizerMode } from '../types/breathwork';

interface BreathVisualizerProps {
  phase: BreathPhaseType;
  phaseProgress: number; // 0.0 to 1.0 within current phase
  remainingPhaseSeconds: number;
  phaseLabel: string;
  phaseSubLabel?: string;
  cycleCount: number;
  totalCycles: number;
  isRunning: boolean;
  visualizerMode: VisualizerMode;
  target: NervousSystemTarget;
  isOled: boolean;
  onOpenCycleConfig?: () => void;
  onSkipPrep?: () => void;
}

export const BreathVisualizer: React.FC<BreathVisualizerProps> = ({
  phase,
  phaseProgress,
  remainingPhaseSeconds,
  phaseLabel,
  phaseSubLabel,
  cycleCount,
  totalCycles,
  isRunning,
  visualizerMode,
  target,
  isOled,
  onOpenCycleConfig,
  onSkipPrep,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const stateRef = useRef({
    phase,
    phaseProgress,
    target,
    visualizerMode,
    isOled,
    isRunning,
    lastTime: performance.now(),
    currentRadius: 100,
    targetRadius: 100,
    holdOscillationTime: 0,
    rotAngle: 0,
  });

  // Keep ref synchronized with prop updates
  useEffect(() => {
    stateRef.current.phase = phase;
    stateRef.current.phaseProgress = phaseProgress;
    stateRef.current.target = target;
    stateRef.current.visualizerMode = visualizerMode;
    stateRef.current.isOled = isOled;
    stateRef.current.isRunning = isRunning;
  }, [phase, phaseProgress, target, visualizerMode, isOled, isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (!isVisible && animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      } else if (isVisible && isRunning && !animFrameRef.current) {
        stateRef.current.lastTime = performance.now();
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for battery efficiency
      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      ro = new ResizeObserver(() => {
        resizeCanvas();
      });
      ro.observe(canvas.parentElement);
    }

    // Easing helper
    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const renderLoop = (timeNow: number) => {
      if (!isVisible || !stateRef.current.isRunning) {
        animFrameRef.current = null;
        return;
      }

      const dt = Math.min((timeNow - stateRef.current.lastTime) / 1000, 0.1);
      stateRef.current.lastTime = timeNow;

      const { phase: currentPhase, phaseProgress: progress, visualizerMode: mode, target: currentTarget, isOled: oled } = stateRef.current;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const cx = width / 2;
      const cy = height / 2;
      const baseMinR = Math.min(width, height) * 0.22;
      const baseMaxR = Math.min(width, height) * 0.42;

      // Calculate target expansion based on phase
      let expansion = 0.0;
      const easedProgress = easeInOutCubic(Math.max(0, Math.min(1, progress)));

      if (currentPhase === 'inhale') {
        expansion = easedProgress; // 0 -> 1
      } else if (currentPhase === 'micro-inhale') {
        expansion = 0.85 + easedProgress * 0.15; // 0.85 -> 1.0
      } else if (currentPhase === 'hold-in') {
        // High-damping micro-oscillation (subtle organic breathing heart flutter)
        stateRef.current.holdOscillationTime += dt;
        const microOsc = Math.sin(stateRef.current.holdOscillationTime * 3.5) * 0.022;
        expansion = 1.0 + microOsc;
      } else if (currentPhase === 'exhale') {
        expansion = 1.0 - easedProgress; // 1 -> 0
      } else if (currentPhase === 'hold-out') {
        stateRef.current.holdOscillationTime += dt;
        const microOsc = Math.sin(stateRef.current.holdOscillationTime * 2.5) * 0.015;
        expansion = 0.0 + microOsc;
      } else {
        // Prep / Complete
        expansion = 0.3;
      }

      const desiredR = baseMinR + (baseMaxR - baseMinR) * Math.max(0, expansion);
      // Smooth lerp for continuous fluidity
      stateRef.current.currentRadius += (desiredR - stateRef.current.currentRadius) * Math.min(1, dt * 10);
      stateRef.current.rotAngle += dt * 0.3;

      const r = stateRef.current.currentRadius;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Color palettes according to nervous system target
      let primaryGlow = 'rgba(129, 140, 248, 0.45)'; // Indigo/violet
      let accentGlow = 'rgba(56, 189, 248, 0.65)';  // Cyan
      let coreColor = 'rgba(240, 246, 255, 0.95)';
      let ringColor = 'rgba(167, 139, 250, 0.5)';

      if (currentTarget === 'coherence') {
        primaryGlow = 'rgba(56, 189, 248, 0.5)'; // Cyan
        accentGlow = 'rgba(52, 211, 153, 0.6)';  // Emerald
        ringColor = 'rgba(45, 212, 191, 0.55)';
      } else if (currentTarget === 'energy') {
        primaryGlow = 'rgba(251, 146, 60, 0.5)';  // Warm Amber
        accentGlow = 'rgba(244, 63, 94, 0.55)';   // Coral
        ringColor = 'rgba(251, 191, 36, 0.6)';
      }

      if (oled) {
        primaryGlow = 'rgba(255, 255, 255, 0.12)';
        accentGlow = 'rgba(255, 255, 255, 0.25)';
        ringColor = 'rgba(255, 255, 255, 0.5)';
        coreColor = 'rgba(255, 255, 255, 0.9)';
      }

      if (mode === 'fluid-orb') {
        // MODE A: FLUID GLOWING ORB
        // Outer diffuse ambient bloom
        if (!oled) {
          const outerGrad = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r * 1.55);
          outerGrad.addColorStop(0, primaryGlow);
          outerGrad.addColorStop(0.55, accentGlow);
          outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = outerGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
          ctx.fill();
        }

        // Secondary luminous body
        const orbGrad = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
        if (oled) {
          orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          orbGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.06)');
          orbGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          orbGrad.addColorStop(0.35, accentGlow);
          orbGrad.addColorStop(0.8, primaryGlow);
          orbGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Delicate luminous rim
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = oled ? 1.5 : 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
        ctx.stroke();

        // Innermost pearl core
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(14, r * 0.14), 0, Math.PI * 2);
        ctx.fill();

      } else {
        // MODE B: MINIMAL CONCENTRIC RINGS
        const ringsCount = 5;
        const ringStep = r / ringsCount;

        for (let i = 1; i <= ringsCount; i++) {
          const curR = ringStep * i;
          const alpha = 0.2 + (i / ringsCount) * 0.6;
          ctx.strokeStyle = oled ? `rgba(255, 255, 255, ${alpha})` : ringColor;
          ctx.lineWidth = i === ringsCount ? 2.5 : 1.2;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(i % 2 === 0 ? stateRef.current.rotAngle : -stateRef.current.rotAngle * 0.8);

          // Subtle dash rhythm
          if (i % 2 === 1) {
            ctx.setLineDash([8, 12]);
          } else {
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.arc(0, 0, curR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Center jewel
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    if (isRunning) {
      stateRef.current.lastTime = performance.now();
      animFrameRef.current = requestAnimationFrame(renderLoop);
    } else {
      // Draw static peaceful baseline when paused
      renderLoop(performance.now());
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (ro) {
        ro.disconnect();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isRunning, visualizerMode, target, isOled]);

  return (
    <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] xl:max-w-[530px] flex items-center justify-center my-auto transition-all duration-500">
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />

      {/* Centered HUD Overlay for Phase & Countdown */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-4 sm:px-6">
        {/* Subtle Phase Subtitle */}
        {phaseSubLabel && (
          <span className="text-[11px] sm:text-xs md:text-sm lg:text-base tracking-wider uppercase text-slate-300 font-medium mb-1 drop-shadow-sm opacity-90 transition-all duration-300">
            {phaseSubLabel}
          </span>
        )}

        {/* Primary Phase Instruction Label */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium tracking-tight text-white mb-2 md:mb-3 drop-shadow-md transition-all duration-300">
          {phaseLabel}
        </h2>

        {/* Phase Remaining Seconds Countdown */}
        {isRunning && phase !== 'complete' && (
          <div className="flex items-baseline gap-1 md:gap-1.5">
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light font-mono tracking-tighter text-white drop-shadow-lg">
              {remainingPhaseSeconds <= 0 ? '0' : Math.ceil(remainingPhaseSeconds)}
            </span>
            <span className="text-xs md:text-sm lg:text-base text-slate-400 font-mono">s</span>
          </div>
        )}

        {/* Prep Phase Skip Button */}
        {phase === 'prep' && isRunning && onSkipPrep && (
          <button
            type="button"
            onClick={onSkipPrep}
            className="mt-3 pointer-events-auto py-1 px-3.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-[11px] md:text-xs text-cyan-300 hover:text-white font-medium tracking-wide transition active:scale-95 shadow-sm"
          >
            Start Now →
          </button>
        )}

        {/* Cycle indicator (interactive config trigger) */}
        {phase !== 'complete' && phase !== 'prep' && (
          <button
            type="button"
            onClick={onOpenCycleConfig}
            className="mt-3 pointer-events-auto flex items-center gap-1.5 py-1 px-3 md:py-1.5 md:px-4 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] md:text-xs text-slate-400 hover:text-white font-mono tracking-wider uppercase transition active:scale-95 shadow-sm"
            title="Configure target cycles"
          >
            <span>Cycle</span>
            <span className="text-white font-semibold">{cycleCount}</span>
            <span>/</span>
            <span>{totalCycles > 0 ? totalCycles : '∞'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
