/**
 * Haptic Vibration API Helper
 */

import { BreathPhaseType } from '../types/breathwork';

export function triggerHaptic(phase: BreathPhaseType, enabled: boolean) {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (phase) {
      case 'inhale':
        // Gentle initial tactile cue (25ms)
        navigator.vibrate(25);
        break;
      case 'micro-inhale':
        // Crisp double tap
        navigator.vibrate([18, 30, 18]);
        break;
      case 'hold-in':
      case 'hold-out':
        // Delicate rhythmic tick
        navigator.vibrate([20, 40, 20]);
        break;
      case 'exhale':
        // Grounding release vibration
        navigator.vibrate(35);
        break;
      case 'complete':
        // Celebratory completion pattern
        navigator.vibrate([40, 60, 40, 60, 80]);
        break;
      default:
        navigator.vibrate(20);
        break;
    }
  } catch {
    // Graceful silent fail on unsupported devices
  }
}
