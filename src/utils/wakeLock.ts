/**
 * Screen Wake Lock API Helper
 * Keeps screen awake during mindful breathing sessions
 */

class ScreenWakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isActive = false;
  private isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isActive) {
          this.requestLock();
        }
      });
    }
  }

  public async requestLock(): Promise<boolean> {
    this.isActive = true;
    if (!this.isSupported) return false;

    try {
      if (this.wakeLock && !this.wakeLock.released) {
        return true;
      }
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        // Sentinel released
      });
      return true;
    } catch {
      return false;
    }
  }

  public async releaseLock() {
    this.isActive = false;
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {
        // Ignore
      }
      this.wakeLock = null;
    }
  }
}

export const wakeLockManager = new ScreenWakeLockManager();
