/**
 * Breathwork Types & Domain Models
 */

export type NervousSystemTarget = 'down-regulation' | 'coherence' | 'energy';

export type OutcomeCategory = 'all' | 'sleep' | 'calm' | 'focus' | 'energy' | 'coherence' | 'capacity';

export type BreathPhaseType = 'prep' | 'inhale' | 'hold-in' | 'micro-inhale' | 'exhale' | 'hold-out' | 'complete';

export interface BreathPhaseStep {
  type: BreathPhaseType;
  label: string;
  subLabel?: string;
  duration: number; // in seconds
}

export interface Technique {
  id: string;
  name: string;
  subtitle: string;
  target: NervousSystemTarget;
  outcomes: OutcomeCategory[];
  category: string;
  description: string;
  science: string;
  steps: BreathPhaseStep[];
  defaultCycles: number;
  isCustom?: boolean;
  intensity: 'gentle' | 'moderate' | 'intense';
  contraindications?: string[];
  pros: string[];
  cons?: string[];
  recommendedMinutes?: number;
}

export type VisualizerMode = 'fluid-orb' | 'minimal-rings';

export type AudioGuidanceType = 'singing-bowl' | 'zen-bell' | 'synth-hum' | 'silent';

export type AmbientSoundType = 'none' | 'brown-noise' | 'ocean-surge';

export type ThemeMode = 'reactive' | 'oled';

export interface AppSettings {
  audioGuidance: AudioGuidanceType;
  ambientSound: AmbientSoundType;
  ambientVolume: number; // 0 to 1
  hapticsEnabled: boolean;
  visualizerMode: VisualizerMode;
  themeMode: ThemeMode;
  wakeLockEnabled: boolean;
  prepCountdown: boolean;
  safetyFilter: boolean;
}

export interface SessionRecord {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timestamp: number;
  techniqueId: string;
  techniqueName: string;
  durationSeconds: number;
  completedCycles: number;
}

export interface UserStats {
  totalMinutes: number;
  totalSessions: number;
  currentStreak: number;
  lastActiveDate: string | null;
  history: SessionRecord[];
}
