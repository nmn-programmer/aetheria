/**
 * Aetheria IndexedDB Engine (Guest / Offline Mode)
 * Provides robust, non-volatile offline storage exceeding localStorage limits
 */

import { AppSettings, SessionRecord, Technique, UserStats } from '../types/breathwork';

const DB_NAME = 'aetheria_guest_db';
const DB_VERSION = 1;

export const STORES = {
  SETTINGS: 'settings',
  HISTORY: 'history',
  CUSTOM_TECHNIQUES: 'customTechniques',
  STATS: 'stats',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CUSTOM_TECHNIQUES)) {
        db.createObjectStore(STORES.CUSTOM_TECHNIQUES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        db.createObjectStore(STORES.STATS);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getIdbItem<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB read error for ${storeName}/${String(key)}:`, err);
    return null;
  }
}

export async function setIdbItem<T>(storeName: StoreName, key: IDBValidKey | null, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = key !== null ? store.put(value, key) : store.put(value);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB write error for ${storeName}:`, err);
  }
}

export async function getAllIdbItems<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB getAll error for ${storeName}:`, err);
    return [];
  }
}

export async function deleteIdbItem(storeName: StoreName, key: IDBValidKey): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB delete error for ${storeName}/${String(key)}:`, err);
  }
}

export async function clearIdbStore(storeName: StoreName): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB clear error for ${storeName}:`, err);
  }
}

/**
 * Dumps all guest data for cloud migration
 */
export async function dumpGuestData(): Promise<{
  settings: AppSettings | null;
  history: SessionRecord[];
  customTechniques: Technique[];
  stats: UserStats | null;
} | null> {
  try {
    const [settings, history, customTechniques, stats] = await Promise.all([
      getIdbItem<AppSettings>(STORES.SETTINGS, 'current'),
      getAllIdbItems<SessionRecord>(STORES.HISTORY),
      getAllIdbItems<Technique>(STORES.CUSTOM_TECHNIQUES),
      getIdbItem<UserStats>(STORES.STATS, 'summary'),
    ]);

    return {
      settings,
      history,
      customTechniques,
      stats,
    };
  } catch (err) {
    console.warn('Error dumping guest data from IndexedDB:', err);
    return null;
  }
}
