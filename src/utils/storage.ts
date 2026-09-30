/**
 * LocalStorage & Offline Data Management
 * Hardened with defensive schema validation and outcome-based querying
 */

import { AppSettings, Technique, UserStats, SessionRecord, OutcomeCategory } from '../types/breathwork';
import { DEFAULT_TECHNIQUES } from '../data/techniques';

const SETTINGS_KEY = 'aetheria_settings_v1';
const CUSTOM_TECHNIQUES_KEY = 'aetheria_custom_techniques_v1';
const STATS_KEY = 'aetheria_stats_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  audioGuidance: 'singing-bowl',
  ambientSound: 'brown-noise',
  ambientVolume: 0.25,
  hapticsEnabled: true,
  visualizerMode: 'fluid-orb',
  themeMode: 'reactive',
  wakeLockEnabled: true,
  prepCountdown: true,
  safetyFilter: false,
};

const DEFAULT_STATS: UserStats = {
  totalMinutes: 0,
  totalSessions: 0,
  currentStreak: 0,
  lastActiveDate: null,
  history: [],
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      audioGuidance: ['singing-bowl', 'zen-bell', 'synth-hum', 'silent'].includes(parsed.audioGuidance) ? parsed.audioGuidance : DEFAULT_SETTINGS.audioGuidance,
      ambientSound: ['none', 'brown-noise', 'ocean-surge'].includes(parsed.ambientSound) ? parsed.ambientSound : DEFAULT_SETTINGS.ambientSound,
      ambientVolume: typeof parsed.ambientVolume === 'number' ? Math.max(0, Math.min(1, parsed.ambientVolume)) : DEFAULT_SETTINGS.ambientVolume,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled,
      visualizerMode: ['fluid-orb', 'minimal-rings'].includes(parsed.visualizerMode) ? parsed.visualizerMode : DEFAULT_SETTINGS.visualizerMode,
      themeMode: ['reactive', 'oled'].includes(parsed.themeMode) ? parsed.themeMode : DEFAULT_SETTINGS.themeMode,
      wakeLockEnabled: typeof parsed.wakeLockEnabled === 'boolean' ? parsed.wakeLockEnabled : DEFAULT_SETTINGS.wakeLockEnabled,
      prepCountdown: typeof parsed.prepCountdown === 'boolean' ? parsed.prepCountdown : DEFAULT_SETTINGS.prepCountdown,
      safetyFilter: typeof parsed.safetyFilter === 'boolean' ? parsed.safetyFilter : DEFAULT_SETTINGS.safetyFilter,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCustomTechniques(): Technique[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TECHNIQUES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Validate shape
    return list.filter(item => 
      item && typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.steps) && item.steps.length > 0
    );
  } catch {
    return [];
  }
}

export function saveCustomTechniques(list: Technique[]) {
  try {
    localStorage.setItem(CUSTOM_TECHNIQUES_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export function getAllTechniques(safetyFilter = false, outcomeFilter: OutcomeCategory = 'all'): Technique[] {
  const custom = loadCustomTechniques();
  let all = [...DEFAULT_TECHNIQUES, ...custom];
  
  if (safetyFilter) {
    all = all.filter(t => t.intensity !== 'intense');
  }

  if (outcomeFilter !== 'all') {
    all = all.filter(t => t.outcomes && t.outcomes.includes(outcomeFilter));
  }

  return all;
}

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      totalMinutes: typeof parsed.totalMinutes === 'number' ? parsed.totalMinutes : 0,
      totalSessions: typeof parsed.totalSessions === 'number' ? parsed.totalSessions : 0,
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordSessionCompletion(record: Omit<SessionRecord, 'id' | 'timestamp' | 'date'>): UserStats {
  const current = loadUserStats();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const newRecord: SessionRecord = {
    ...record,
    id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    date: todayStr,
    timestamp: now.getTime(),
  };

  let newStreak = current.currentStreak;
  if (!current.lastActiveDate) {
    newStreak = 1;
  } else if (current.lastActiveDate === todayStr) {
    newStreak = Math.max(1, current.currentStreak);
  } else {
    const lastDate = new Date(current.lastActiveDate);
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = current.currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  const updatedMinutes = Number((current.totalMinutes + record.durationSeconds / 60).toFixed(1));
  const updatedSessions = current.totalSessions + 1;
  const updatedHistory = [newRecord, ...current.history].slice(0, 200);

  const updatedStats: UserStats = {
    totalMinutes: updatedMinutes,
    totalSessions: updatedSessions,
    currentStreak: newStreak,
    lastActiveDate: todayStr,
    history: updatedHistory,
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
  } catch {
    // Ignore
  }

  return updatedStats;
}

export function getLast14DaysActivity(history: SessionRecord[]): { date: string; dayLabel: string; count: number; minutes: number }[] {
  const result: { date: string; dayLabel: string; count: number; minutes: number }[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });

    const matchingSessions = history.filter(s => s.date === dateStr);
    const count = matchingSessions.length;
    const totalSecs = matchingSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    result.push({
      date: dateStr,
      dayLabel,
      count,
      minutes: Math.round(totalSecs / 60),
    });
  }

  return result;
}

export function exportBackupJSON(): string {
  const data = {
    version: '1.1',
    exportDate: new Date().toISOString(),
    settings: loadSettings(),
    customTechniques: loadCustomTechniques(),
    stats: loadUserStats(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return false;

    if (parsed.settings && typeof parsed.settings === 'object') {
      saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
    }
    if (Array.isArray(parsed.customTechniques)) {
      const valid = parsed.customTechniques.filter((t: unknown) => 
        t && typeof t === 'object' && 'id' in t && 'name' in t && 'steps' in t
      );
      saveCustomTechniques(valid);
    }
    if (parsed.stats && typeof parsed.stats === 'object') {
      const validStats: UserStats = {
        totalMinutes: Number(parsed.stats.totalMinutes) || 0,
        totalSessions: Number(parsed.stats.totalSessions) || 0,
        currentStreak: Number(parsed.stats.currentStreak) || 0,
        lastActiveDate: parsed.stats.lastActiveDate || null,
        history: Array.isArray(parsed.stats.history) ? parsed.stats.history : [],
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(validStats));
    }
    return true;
  } catch (e) {
    console.error('Import backup failed:', e);
    return false;
  }
}

export function resetAllStorage() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(CUSTOM_TECHNIQUES_KEY);
    localStorage.removeItem(STATS_KEY);
  } catch {
    // Ignore
  }
}
