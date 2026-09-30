/**
 * LocalStorage & Offline Data Management
 * Hardened with defensive schema validation and outcome-based querying
 */

import { AppSettings, Technique, UserStats, SessionRecord, OutcomeCategory } from '../types/breathwork';
import { DEFAULT_TECHNIQUES } from '../data/techniques';
import { ACHIEVEMENT_DEFINITIONS, Achievement } from '../types/achievements';
import { setIdbItem, STORES } from './indexedDb';

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
  prepDuration: 3,
  safetyFilter: false,
};

const DEFAULT_STATS: UserStats = {
  totalMinutes: 0,
  totalSessions: 0,
  currentStreak: 0,
  lastActiveDate: null,
  history: [],
  totalHoldSeconds: 0,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const prepDuration = typeof parsed.prepDuration === 'number' 
      ? parsed.prepDuration 
      : (parsed.prepCountdown === false ? 0 : 3);

    const validAudio: string[] = ['singing-bowl', 'zen-bell', 'synth-hum', 'voice-female', 'voice-male', 'silent'];

    return {
      audioGuidance: validAudio.includes(parsed.audioGuidance) ? parsed.audioGuidance : DEFAULT_SETTINGS.audioGuidance,
      ambientSound: ['none', 'brown-noise', 'ocean-surge'].includes(parsed.ambientSound) ? parsed.ambientSound : DEFAULT_SETTINGS.ambientSound,
      ambientVolume: typeof parsed.ambientVolume === 'number' ? Math.max(0, Math.min(1, parsed.ambientVolume)) : DEFAULT_SETTINGS.ambientVolume,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled,
      visualizerMode: ['fluid-orb', 'minimal-rings'].includes(parsed.visualizerMode) ? parsed.visualizerMode : DEFAULT_SETTINGS.visualizerMode,
      themeMode: ['reactive', 'oled'].includes(parsed.themeMode) ? parsed.themeMode : DEFAULT_SETTINGS.themeMode,
      wakeLockEnabled: typeof parsed.wakeLockEnabled === 'boolean' ? parsed.wakeLockEnabled : DEFAULT_SETTINGS.wakeLockEnabled,
      prepCountdown: prepDuration > 0,
      prepDuration: prepDuration,
      safetyFilter: typeof parsed.safetyFilter === 'boolean' ? parsed.safetyFilter : DEFAULT_SETTINGS.safetyFilter,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setIdbItem(STORES.SETTINGS, 'current', settings).catch(() => {});
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
    setIdbItem(STORES.CUSTOM_TECHNIQUES, 'all', list).catch(() => {});
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
      totalHoldSeconds: typeof parsed.totalHoldSeconds === 'number' ? parsed.totalHoldSeconds : 0,
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
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
    holdSeconds: record.holdSeconds || 0,
    avgCycleSeconds: record.avgCycleSeconds || 0,
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
  const updatedHistory = [newRecord, ...current.history].slice(0, 250);
  const updatedTotalHold = (current.totalHoldSeconds || 0) + (record.holdSeconds || 0);

  const updatedStats: UserStats = {
    totalMinutes: updatedMinutes,
    totalSessions: updatedSessions,
    currentStreak: newStreak,
    lastActiveDate: todayStr,
    history: updatedHistory,
    totalHoldSeconds: updatedTotalHold,
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
    setIdbItem(STORES.STATS, 'summary', updatedStats).catch(() => {});
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

export function getLast30DaysDailyMinutes(history: SessionRecord[]): { date: string; shortDate: string; minutes: number; sessions: number }[] {
  const result: { date: string; shortDate: string; minutes: number; sessions: number }[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;

    const matches = history.filter(s => s.date === dateStr);
    const totalSecs = matches.reduce((acc, s) => acc + s.durationSeconds, 0);

    result.push({
      date: dateStr,
      shortDate,
      minutes: Number((totalSecs / 60).toFixed(1)),
      sessions: matches.length,
    });
  }

  return result;
}

export interface SomaticAnalytics {
  avgCycleSeconds: number;
  avgHoldSeconds: number;
  totalHoldSeconds: number;
  circadian: {
    morning: { count: number; pct: number }; // 6am - 12pm
    afternoon: { count: number; pct: number }; // 12pm - 6pm
    evening: { count: number; pct: number }; // 6pm - 10pm
    night: { count: number; pct: number }; // 10pm - 6am
  };
  weeklySessions: number;
  totalCompletedCycles: number;
}

export function calculateSomaticAnalytics(stats: UserStats): SomaticAnalytics {
  const history = stats.history || [];
  const totalSessions = history.length;

  if (totalSessions === 0) {
    return {
      avgCycleSeconds: 0,
      avgHoldSeconds: 0,
      totalHoldSeconds: 0,
      circadian: {
        morning: { count: 0, pct: 0 },
        afternoon: { count: 0, pct: 0 },
        evening: { count: 0, pct: 0 },
        night: { count: 0, pct: 0 },
      },
      weeklySessions: 0,
      totalCompletedCycles: 0,
    };
  }

  let totalCycleSecondsSum = 0;
  let totalHoldSecondsSum = stats.totalHoldSeconds || 0;
  let totalCyclesSum = 0;

  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;
  let nightCount = 0;

  history.forEach(sess => {
    totalCyclesSum += sess.completedCycles || 1;
    if (sess.avgCycleSeconds) {
      totalCycleSecondsSum += sess.avgCycleSeconds;
    } else if (sess.completedCycles > 0) {
      totalCycleSecondsSum += (sess.durationSeconds / sess.completedCycles);
    }

    if (!stats.totalHoldSeconds && sess.holdSeconds) {
      totalHoldSecondsSum += sess.holdSeconds;
    }

    const date = new Date(sess.timestamp || Date.now());
    const hour = date.getHours();

    if (hour >= 6 && hour < 12) morningCount++;
    else if (hour >= 12 && hour < 18) afternoonCount++;
    else if (hour >= 18 && hour < 22) eveningCount++;
    else nightCount++;
  });

  const avgCycle = totalSessions > 0 ? Number((totalCycleSecondsSum / totalSessions).toFixed(1)) : 0;
  const avgHold = totalCyclesSum > 0 ? Number((totalHoldSecondsSum / totalCyclesSum).toFixed(1)) : 0;

  // Weekly frequency calculation
  const oldestTimestamp = history[history.length - 1]?.timestamp || Date.now();
  const daysDiff = Math.max(1, (Date.now() - oldestTimestamp) / (1000 * 60 * 60 * 24));
  const weeks = Math.max(1, daysDiff / 7);
  const weeklySessions = Number((totalSessions / weeks).toFixed(1));

  return {
    avgCycleSeconds: avgCycle || 16.5,
    avgHoldSeconds: avgHold || 5.2,
    totalHoldSeconds: totalHoldSecondsSum,
    circadian: {
      morning: { count: morningCount, pct: Math.round((morningCount / totalSessions) * 100) },
      afternoon: { count: afternoonCount, pct: Math.round((afternoonCount / totalSessions) * 100) },
      evening: { count: eveningCount, pct: Math.round((eveningCount / totalSessions) * 100) },
      night: { count: nightCount, pct: Math.round((nightCount / totalSessions) * 100) },
    },
    weeklySessions,
    totalCompletedCycles: totalCyclesSum,
  };
}

export function evaluateAchievements(stats: UserStats, customCount = 0): Achievement[] {
  const history = stats.history || [];
  const analytics = calculateSomaticAnalytics(stats);

  const nightSessions = history.filter(s => {
    const h = new Date(s.timestamp || Date.now()).getHours();
    return h >= 21 || h < 5;
  }).length;

  return ACHIEVEMENT_DEFINITIONS.map(def => {
    let currentVal = 0;
    let unlocked = false;

    switch (def.id) {
      case 'first_breath':
        currentVal = stats.totalSessions;
        unlocked = stats.totalSessions >= 1;
        break;
      case 'kindled_fire':
        currentVal = stats.currentStreak;
        unlocked = stats.currentStreak >= 3;
        break;
      case 'pranayama_devotee':
        currentVal = stats.currentStreak;
        unlocked = stats.currentStreak >= 7;
        break;
      case 'master_of_stillness':
        currentVal = stats.currentStreak;
        unlocked = stats.currentStreak >= 14;
        break;
      case 'hour_of_mindfulness':
        currentVal = Math.round(stats.totalMinutes);
        unlocked = stats.totalMinutes >= 60;
        break;
      case 'century_practitioner':
        currentVal = Math.round(stats.totalMinutes);
        unlocked = stats.totalMinutes >= 100;
        break;
      case 'co2_knight':
        currentVal = analytics.totalHoldSeconds;
        unlocked = analytics.totalHoldSeconds >= 300;
        break;
      case 'midnight_serenity':
        currentVal = nightSessions;
        unlocked = nightSessions >= 1;
        break;
      case 'zen_architect':
        currentVal = customCount;
        unlocked = customCount >= 1;
        break;
      default:
        break;
    }

    return {
      ...def,
      currentValue: currentVal,
      unlocked,
    };
  });
}
