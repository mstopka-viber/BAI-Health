import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  _resetDbConnection,
  addEntry,
  deleteAllEntries,
  deleteEntry,
  getAllEntries,
  getEntryCount,
  getLatestEntry,
  getProfile,
  saveProfile,
  type NewEntryInput,
} from '../db';

const DB_NAME = 'bai-health';

async function wipeDatabase(): Promise<void> {
  await _resetDbConnection();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

function makeEntry(overrides: Partial<NewEntryInput> = {}): NewEntryInput {
  return {
    createdAt: Date.now(),
    heightCm: 175,
    weightKg: 70,
    waistCm: 82,
    bmi: 22.857,
    bri: 2.79,
    bmiAlign: 94.58,
    briAlign: 73.61,
    bai: 84.1,
    bmiMid: 21.7,
    briMid: 3.93,
    cohortKey: 'universal',
    unitsAtEntry: 'metric',
    ...overrides,
  };
}

beforeEach(async () => {
  await wipeDatabase();
});

describe('entries store', () => {
  it('returns empty list and undefined latest when fresh', async () => {
    expect(await getAllEntries()).toEqual([]);
    expect(await getLatestEntry()).toBeUndefined();
    expect(await getEntryCount()).toBe(0);
  });

  it('adds an entry and assigns an auto-incrementing id', async () => {
    const id = await addEntry(makeEntry());
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
    expect(await getEntryCount()).toBe(1);
  });

  it('getLatestEntry returns the most recently created entry', async () => {
    await addEntry(makeEntry({ createdAt: 1000, bai: 50 }));
    await addEntry(makeEntry({ createdAt: 3000, bai: 80 }));
    await addEntry(makeEntry({ createdAt: 2000, bai: 70 }));

    const latest = await getLatestEntry();
    expect(latest?.createdAt).toBe(3000);
    expect(latest?.bai).toBe(80);
  });

  it('getAllEntries returns entries ordered by createdAt ascending', async () => {
    await addEntry(makeEntry({ createdAt: 3000 }));
    await addEntry(makeEntry({ createdAt: 1000 }));
    await addEntry(makeEntry({ createdAt: 2000 }));

    const all = await getAllEntries();
    expect(all.map(e => e.createdAt)).toEqual([1000, 2000, 3000]);
  });

  it('deleteAllEntries clears the store', async () => {
    await addEntry(makeEntry());
    await addEntry(makeEntry());
    expect(await getEntryCount()).toBe(2);
    await deleteAllEntries();
    expect(await getEntryCount()).toBe(0);
  });

  it('deleteEntry removes only the matching record', async () => {
    const id1 = await addEntry(makeEntry({ createdAt: 1000, bai: 50 }));
    const id2 = await addEntry(makeEntry({ createdAt: 2000, bai: 70 }));
    await deleteEntry(id1);

    const remaining = await getAllEntries();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id2);
    expect(remaining[0].bai).toBe(70);
  });

  it('deleteEntry is a no-op for unknown ids', async () => {
    await addEntry(makeEntry());
    await deleteEntry(9999);
    expect(await getEntryCount()).toBe(1);
  });

  it('persists snapshot midpoints alongside the entry', async () => {
    await addEntry(
      makeEntry({ bmiMid: 23, briMid: 4.3, cohortKey: 'male_40-64' }),
    );
    const latest = await getLatestEntry();
    expect(latest?.bmiMid).toBe(23);
    expect(latest?.briMid).toBe(4.3);
    expect(latest?.cohortKey).toBe('male_40-64');
  });
});

describe('profile store', () => {
  it('returns undefined when no profile exists yet', async () => {
    expect(await getProfile()).toBeUndefined();
  });

  it('saveProfile creates a new profile with defaults on first call', async () => {
    const saved = await saveProfile({});
    expect(saved.id).toBe('profile');
    expect(saved.unitSystem).toBe('metric');
    expect(saved.sex).toBeUndefined();
    expect(saved.ageBand).toBeUndefined();
    expect(saved.createdAt).toBeGreaterThan(0);
    expect(saved.updatedAt).toBeGreaterThan(0);
  });

  it('saveProfile preserves createdAt across updates', async () => {
    const first = await saveProfile({ unitSystem: 'imperial' });
    await new Promise(r => setTimeout(r, 5));
    const second = await saveProfile({ sex: 'female' });
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.updatedAt).toBeGreaterThanOrEqual(first.updatedAt);
  });

  it('saveProfile merges updates without losing prior fields', async () => {
    await saveProfile({ unitSystem: 'imperial', sex: 'male', ageBand: '40-64' });
    const updated = await saveProfile({ unitSystem: 'metric' });
    expect(updated.unitSystem).toBe('metric');
    expect(updated.sex).toBe('male');
    expect(updated.ageBand).toBe('40-64');
  });

  it('saveProfile clears an optional field when passed explicit undefined', async () => {
    await saveProfile({ sex: 'male' });
    const cleared = await saveProfile({ sex: undefined });
    expect(cleared.sex).toBeUndefined();
  });

  it('getProfile reads back the saved record', async () => {
    await saveProfile({ unitSystem: 'imperial', sex: 'female', ageBand: '20-39' });
    const loaded = await getProfile();
    expect(loaded?.unitSystem).toBe('imperial');
    expect(loaded?.sex).toBe('female');
    expect(loaded?.ageBand).toBe('20-39');
  });
});
