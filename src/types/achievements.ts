/**
 * Somatic Milestone Badges & Achievements Definitions
 */

export interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'streak' | 'volume' | 'mastery' | 'circadian' | 'creator';
  icon: string; // Lucide icon identifier or emoji
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  targetValue: number;
  currentValue: number;
  unit: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'currentValue' | 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_breath',
    title: 'First Awakening',
    subtitle: 'Completed 1st Session',
    description: 'Began your conscious breathwork journey with Dhyaan Mudra.',
    category: 'mastery',
    icon: 'Sparkles',
    tier: 'bronze',
    targetValue: 1,
    unit: 'session',
  },
  {
    id: 'kindled_fire',
    title: 'Kindled Rhythm',
    subtitle: '3-Day Consistency Streak',
    description: 'Maintained your breathwork practice for 3 consecutive days.',
    category: 'streak',
    icon: 'Flame',
    tier: 'bronze',
    targetValue: 3,
    unit: 'days',
  },
  {
    id: 'pranayama_devotee',
    title: 'Pranayama Devotee',
    subtitle: '7-Day Autonomic Streak',
    description: 'Anchored 7 consecutive days of vagal tone regulation.',
    category: 'streak',
    icon: 'Zap',
    tier: 'silver',
    targetValue: 7,
    unit: 'days',
  },
  {
    id: 'master_of_stillness',
    title: 'Master of Stillness',
    subtitle: '14-Day Sovereign Streak',
    description: 'Completed a full two-week neuro-respiratory transformation.',
    category: 'streak',
    icon: 'Crown',
    tier: 'gold',
    targetValue: 14,
    unit: 'days',
  },
  {
    id: 'hour_of_mindfulness',
    title: 'Hour of Mindfulness',
    subtitle: '60 Total Mindful Minutes',
    description: 'Accumulated one solid hour of oxygenating practice.',
    category: 'volume',
    icon: 'Clock',
    tier: 'silver',
    targetValue: 60,
    unit: 'minutes',
  },
  {
    id: 'century_practitioner',
    title: 'Century Practitioner',
    subtitle: '100 Mindful Minutes',
    description: 'Surpassed 100 mindful minutes across multiple disciplines.',
    category: 'volume',
    icon: 'Award',
    tier: 'gold',
    targetValue: 100,
    unit: 'minutes',
  },
  {
    id: 'co2_knight',
    title: 'CO2 Resilience Knight',
    subtitle: '300s Cumulative Breath Hold',
    description: 'Trained your chemoreceptors with 5+ minutes of conscious retention.',
    category: 'mastery',
    icon: 'Shield',
    tier: 'silver',
    targetValue: 300,
    unit: 'sec hold',
  },
  {
    id: 'midnight_serenity',
    title: 'Midnight Serenity',
    subtitle: 'Deep Night Wind-Down',
    description: 'Completed a restorative parasympathetic practice between 9 PM and 5 AM.',
    category: 'circadian',
    icon: 'Moon',
    tier: 'bronze',
    targetValue: 1,
    unit: 'night session',
  },
  {
    id: 'zen_architect',
    title: 'Zen Architect',
    subtitle: 'Custom Pattern Creator',
    description: 'Crafted and saved your own personalized breathing rhythm in Pattern Studio.',
    category: 'creator',
    icon: 'PlusCircle',
    tier: 'bronze',
    targetValue: 1,
    unit: 'custom rhythm',
  },
];
