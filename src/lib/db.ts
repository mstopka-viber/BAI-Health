/**
 * Local-first persistence layer (IndexedDB via `idb`).
 *
 * Two stores:
 *   - `entries`: one record per measurement, keyed by auto-incrementing id.
 *     Each record snapshots the cohort midpoints used at compute time so
 *     historical entries stay interpretable if the profile or reference table
 *     changes later.
 *   - `profile`: a singleton record (key `'profile'`) holding unit preference
 *     and optional sex / age band for personalized cohort resolution.
 *
 * All functions are async and safe to call from client components. Server
 * components must not import this module directly — IndexedDB is client-only.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AgeBand, CohortKey, Sex } from './references';

export type UnitSystem = 'metric' | 'imperial';

export interface EntryRecord {
  id: number;
  createdAt: number;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm?: number;
  bmi: number;
  bri: number;
  bmiAlign: number;
  briAlign: number;
  bai: number;
  /** Midpoint used for the BMI alignment at compute time. */
  bmiMid: number;
  /** Midpoint used for the BRI alignment at compute time. */
  briMid: number;
  cohortKey: CohortKey;
  unitsAtEntry: UnitSystem;
}

export type NewEntryInput = Omit<EntryRecord, 'id'>;

export interface ProfileRecord {
  /** Singleton key — always the literal string 'profile'. */
  id: 'profile';
  unitSystem: UnitSystem;
  sex?: Sex;
  ageBand?: AgeBand;
  createdAt: number;
  updatedAt: number;
}

interface BaiDBSchema extends DBSchema {
  entries: {
    key: number;
    value: EntryRecord;
    indexes: { 'by-createdAt': number };
  };
  profile: {
    key: string;
    value: ProfileRecord;
  };
}

const DB_NAME = 'bai-health';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BaiDBSchema>> | null = null;

function openDatabase(): Promise<IDBPDatabase<BaiDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<BaiDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          const entries = db.createObjectStore('entries', {
            keyPath: 'id',
            autoIncrement: true,
          });
          entries.createIndex('by-createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Test helper: closes the cached connection (if any) and clears the cache so
 * tests can start from a fresh database. Must be awaited before any
 * `indexedDB.deleteDatabase` call or the delete will block indefinitely.
 */
export async function _resetDbConnection(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // If the connection failed to open, just clear the cache.
    }
    dbPromise = null;
  }
}

// --- Entries ---

export async function addEntry(entry: NewEntryInput): Promise<number> {
  const db = await openDatabase();
  // autoIncrement fills id at runtime; cast bridges the types cleanly.
  const id = await db.add('entries', entry as unknown as EntryRecord);
  return id as number;
}

export async function getAllEntries(): Promise<EntryRecord[]> {
  const db = await openDatabase();
  return db.getAllFromIndex('entries', 'by-createdAt');
}

export async function getLatestEntry(): Promise<EntryRecord | undefined> {
  const db = await openDatabase();
  const tx = db.transaction('entries', 'readonly');
  const cursor = await tx.store.index('by-createdAt').openCursor(null, 'prev');
  const value = cursor?.value;
  await tx.done;
  return value;
}

export async function getEntryCount(): Promise<number> {
  const db = await openDatabase();
  return db.count('entries');
}

export async function deleteAllEntries(): Promise<void> {
  const db = await openDatabase();
  await db.clear('entries');
}

/** Remove a single entry by id. Missing ids are a no-op. */
export async function deleteEntry(id: number): Promise<void> {
  const db = await openDatabase();
  await db.delete('entries', id);
}

// --- Profile ---

export type ProfileUpdate = Partial<
  Pick<ProfileRecord, 'unitSystem' | 'sex' | 'ageBand'>
>;

export async function getProfile(): Promise<ProfileRecord | undefined> {
  const db = await openDatabase();
  return db.get('profile', 'profile');
}

/**
 * Create or update the singleton profile. Fields not present in `update` are
 * preserved; to clear an optional field, pass `undefined` explicitly (e.g.
 * `{ sex: undefined }` vs. omitting `sex`).
 */
export async function saveProfile(update: ProfileUpdate): Promise<ProfileRecord> {
  const db = await openDatabase();
  const existing = await db.get('profile', 'profile');
  const now = Date.now();
  const next: ProfileRecord = {
    id: 'profile',
    unitSystem: update.unitSystem ?? existing?.unitSystem ?? 'metric',
    sex: 'sex' in update ? update.sex : existing?.sex,
    ageBand: 'ageBand' in update ? update.ageBand : existing?.ageBand,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put('profile', next);
  return next;
}
