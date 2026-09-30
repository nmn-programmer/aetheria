/**
 * Cloud Synchronization & Data Migration Service
 * Connects Firebase Firestore with Aetheria state and migrates Guest data smoothly
 */

import { 
  db, doc, setDoc, getDoc, collection, getDocs, writeBatch, serverTimestamp 
} from '../firebase/firebase';
import { AppSettings, Technique, UserStats, SessionRecord, AuthUser } from '../types/breathwork';
import { dumpGuestData, setIdbItem, STORES } from '../utils/indexedDb';
import { loadSettings, loadCustomTechniques, loadUserStats, saveSettings, saveCustomTechniques } from '../utils/storage';

export class CloudSyncService {
  private static instance: CloudSyncService;
  private currentUid: string | null = null;
  private isSyncing = false;

  private constructor() {}

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  public setUser(user: AuthUser | null) {
    this.currentUid = user && !user.isGuest ? user.uid : null;
  }

  /**
   * Seamlessly migrates Guest offline records (IndexedDB / LocalStorage) to Cloud Firestore
   */
  public async migrateGuestDataToCloud(user: AuthUser): Promise<{ migratedSessions: number; migratedCustoms: number }> {
    if (!user || user.isGuest) return { migratedSessions: 0, migratedCustoms: 0 };
    const uid = user.uid;

    try {
      // 1. Fetch guest data from IndexedDB or localStorage fallback
      const guestDump = await dumpGuestData();
      const localCustoms: Technique[] = (guestDump?.customTechniques && guestDump.customTechniques.length > 0) 
        ? guestDump.customTechniques 
        : loadCustomTechniques();
      const localStats: UserStats = (guestDump?.stats && typeof guestDump.stats === 'object') 
        ? guestDump.stats 
        : loadUserStats();
      const localSettings: AppSettings = (guestDump?.settings && typeof guestDump.settings === 'object') 
        ? guestDump.settings 
        : loadSettings();

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      // Create / update user profile doc
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastActiveAt: serverTimestamp(),
      }, { merge: true });

      const batch = writeBatch(db);
      let sessionCount = 0;
      let customCount = 0;

      // 2. Save settings to Firestore
      const settingsRef = doc(db, 'users', uid, 'settings', 'current');
      batch.set(settingsRef, {
        ...localSettings,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 3. Migrate Custom Techniques
      if (localCustoms && localCustoms.length > 0) {
        for (const ct of localCustoms) {
          const techRef = doc(db, 'users', uid, 'custom_techniques', ct.id);
          batch.set(techRef, {
            ...ct,
            isCustom: true,
            syncedAt: serverTimestamp(),
          }, { merge: true });
          customCount++;
        }
      }

      // 4. Migrate Session History
      if (localStats.history && localStats.history.length > 0) {
        for (const session of localStats.history) {
          const sessRef = doc(db, 'users', uid, 'sessions', session.id);
          batch.set(sessRef, {
            ...session,
            syncedAt: serverTimestamp(),
          }, { merge: true });
          sessionCount++;
        }
      }

      // 5. Aggregate Stats
      const statsRef = doc(db, 'users', uid, 'stats', 'summary');
      batch.set(statsRef, {
        totalMinutes: localStats.totalMinutes,
        totalSessions: localStats.totalSessions,
        currentStreak: localStats.currentStreak,
        lastActiveDate: localStats.lastActiveDate,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
      return { migratedSessions: sessionCount, migratedCustoms: customCount };
    } catch (err) {
      console.warn('Error during cloud migration:', err);
      return { migratedSessions: 0, migratedCustoms: 0 };
    }
  }

  /**
   * Fetches latest user data from Firestore when signing in
   */
  public async pullUserDataFromCloud(uid: string): Promise<{
    settings?: AppSettings;
    customTechniques?: Technique[];
    stats?: UserStats;
  } | null> {
    try {
      const [settingsSnap, statsSnap, customsSnap, sessionsSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid, 'settings', 'current')),
        getDoc(doc(db, 'users', uid, 'stats', 'summary')),
        getDocs(collection(db, 'users', uid, 'custom_techniques')),
        getDocs(collection(db, 'users', uid, 'sessions')),
      ]);

      const cloudSettings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : undefined;
      const customTechniques: Technique[] = [];
      customsSnap.forEach(docSnap => {
        customTechniques.push(docSnap.data() as Technique);
      });

      const sessions: SessionRecord[] = [];
      sessionsSnap.forEach(docSnap => {
        sessions.push(docSnap.data() as SessionRecord);
      });
      // Sort newest first
      sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      const statsData = statsSnap.exists() ? statsSnap.data() : null;
      const stats: UserStats = {
        totalMinutes: statsData?.totalMinutes ?? 0,
        totalSessions: statsData?.totalSessions ?? sessions.length,
        currentStreak: statsData?.currentStreak ?? 0,
        lastActiveDate: statsData?.lastActiveDate ?? null,
        history: sessions,
      };

      return {
        settings: cloudSettings,
        customTechniques,
        stats,
      };
    } catch (err) {
      console.warn('Error pulling cloud data:', err);
      return null;
    }
  }

  /**
   * Syncs a single completed session to Firestore
   */
  public async syncCompletedSession(session: SessionRecord, updatedStats: UserStats): Promise<void> {
    if (!this.currentUid) return;

    try {
      const batch = writeBatch(db);
      const sessionRef = doc(db, 'users', this.currentUid, 'sessions', session.id);
      batch.set(sessionRef, {
        ...session,
        syncedAt: serverTimestamp(),
      });

      const statsRef = doc(db, 'users', this.currentUid, 'stats', 'summary');
      batch.set(statsRef, {
        totalMinutes: updatedStats.totalMinutes,
        totalSessions: updatedStats.totalSessions,
        currentStreak: updatedStats.currentStreak,
        lastActiveDate: updatedStats.lastActiveDate,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
    } catch (err) {
      console.warn('Error syncing session to cloud:', err);
    }
  }

  /**
   * Syncs updated settings to Firestore
   */
  public async syncSettings(settings: AppSettings): Promise<void> {
    if (!this.currentUid) return;
    try {
      const ref = doc(db, 'users', this.currentUid, 'settings', 'current');
      await setDoc(ref, {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Error syncing settings to cloud:', err);
    }
  }

  /**
   * Syncs a custom technique to Firestore
   */
  public async syncCustomTechnique(technique: Technique): Promise<void> {
    if (!this.currentUid) return;
    try {
      const ref = doc(db, 'users', this.currentUid, 'custom_techniques', technique.id);
      await setDoc(ref, {
        ...technique,
        isCustom: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Error syncing custom technique to cloud:', err);
    }
  }

  /**
   * Deletes a custom technique from Firestore
   */
  public async deleteCustomTechnique(id: string): Promise<void> {
    if (!this.currentUid) return;
    try {
      const { deleteDoc } = await import('../firebase/firebase');
      const ref = doc(db, 'users', this.currentUid, 'custom_techniques', id);
      await deleteDoc(ref);
    } catch (err) {
      console.warn('Error deleting custom technique from cloud:', err);
    }
  }
}

export const cloudSync = CloudSyncService.getInstance();
