import * as SQLite from 'expo-sqlite';
import { addDays, addMonths } from 'date-fns';
import { getCatalogPlant } from '../data/plants';
import { CareTask, CareType, JournalEntry, PlantCareIntervals, UserPlant } from '../types';
import { InitialCareHistory } from '../utils/careHistory';
import { formatDateString, getTodayDateString, parseLocalDate } from '../utils/dates';

const db = SQLite.openDatabaseSync('planteetjardin.db');

type DbRow = Record<string, unknown>;

function asRow(row: unknown): DbRow {
  return row as DbRow;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function migrateDatabase(): void {
  const columns = db.getAllSync('PRAGMA table_info(user_plants)');
  const names = columns.map((c) => asRow(c).name as string);

  if (!names.includes('photo_uri')) {
    db.execSync('ALTER TABLE user_plants ADD COLUMN photo_uri TEXT');
  }
  if (!names.includes('custom_watering_days')) {
    db.execSync('ALTER TABLE user_plants ADD COLUMN custom_watering_days INTEGER');
  }
  if (!names.includes('custom_fertilizing_days')) {
    db.execSync('ALTER TABLE user_plants ADD COLUMN custom_fertilizing_days INTEGER');
  }
  if (!names.includes('custom_repotting_months')) {
    db.execSync('ALTER TABLE user_plants ADD COLUMN custom_repotting_months INTEGER');
  }
}

export function initDatabase(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_plants (
      id TEXT PRIMARY KEY NOT NULL,
      catalog_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      location TEXT DEFAULT '',
      acquired_at TEXT NOT NULL,
      last_watered_at TEXT,
      last_fertilized_at TEXT,
      last_repotted_at TEXT,
      notes TEXT DEFAULT '',
      photo_uri TEXT,
      custom_watering_days INTEGER,
      custom_fertilizing_days INTEGER,
      custom_repotting_months INTEGER
    );

    CREATE TABLE IF NOT EXISTS care_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      plant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (plant_id) REFERENCES user_plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      plant_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      photo_uri TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (plant_id) REFERENCES user_plants(id) ON DELETE SET NULL
    );
  `);

  migrateDatabase();
  reconcileCareTasks();
}

function getCareBaseDate(plant: UserPlant, type: CareType): Date {
  const last = getLastCareDate(plant, type);
  if (last) return parseLocalDate(last);
  return parseLocalDate(plant.acquiredAt);
}

function computeNextDueDate(plant: UserPlant, type: CareType, baseDate?: Date): Date {
  const intervals = getPlantCareIntervals(plant);
  const base = baseDate ?? getCareBaseDate(plant, type);

  switch (type) {
    case 'watering':
      return addDays(base, intervals.wateringDays);
    case 'fertilizing':
      return addDays(base, intervals.fertilizingDays);
    case 'repotting':
      return addMonths(base, intervals.repottingMonths);
  }
}

function getExpectedDueDate(plant: UserPlant, type: CareType): string {
  return formatDateString(computeNextDueDate(plant, type));
}

function clearPendingTasks(plantId: string, type: CareType): void {
  db.runSync(
    'DELETE FROM care_tasks WHERE plant_id = ? AND type = ? AND completed = 0',
    [plantId, type]
  );
}

function scheduleNextTask(plantId: string, type: CareType, baseDate?: Date): void {
  const plant = getUserPlant(plantId);
  if (!plant) return;

  const nextDue = computeNextDueDate(plant, type, baseDate);

  clearPendingTasks(plantId, type);
  db.runSync(
    'INSERT INTO care_tasks (id, plant_id, type, due_date, completed) VALUES (?, ?, ?, ?, 0)',
    [generateId(), plantId, type, formatDateString(nextDue)]
  );
}

/** Supprime les doublons et recalcule les tâches sans date de référence. */
function reconcileCareTasks(): void {
  const pending = db.getAllSync(
    'SELECT * FROM care_tasks WHERE completed = 0 ORDER BY due_date ASC'
  );
  const seen = new Set<string>();

  for (const row of pending) {
    const task = asRow(row);
    const key = `${task.plant_id}:${task.type}`;
    if (seen.has(key)) {
      db.runSync('DELETE FROM care_tasks WHERE id = ?', [task.id]);
      continue;
    }
    seen.add(key);
  }

  const plants = getUserPlants();
  for (const plant of plants) {
    for (const type of ['watering', 'fertilizing', 'repotting'] as CareType[]) {
      const expected = getExpectedDueDate(plant, type);
      const existing = db.getFirstSync(
        'SELECT due_date FROM care_tasks WHERE plant_id = ? AND type = ? AND completed = 0 LIMIT 1',
        [plant.id, type]
      ) as DbRow | null;

      if (!existing || existing.due_date !== expected) {
        scheduleNextTask(plant.id, type);
      }
    }
  }
}

function rowToUserPlant(row: DbRow): UserPlant {
  return {
    id: row.id as string,
    catalogId: row.catalog_id as string,
    nickname: row.nickname as string,
    location: (row.location as string) || '',
    acquiredAt: row.acquired_at as string,
    lastWateredAt: (row.last_watered_at as string) || null,
    lastFertilizedAt: (row.last_fertilized_at as string) || null,
    lastRepottedAt: (row.last_repotted_at as string) || null,
    notes: (row.notes as string) || '',
    photoUri: (row.photo_uri as string) || null,
    customWateringDays: row.custom_watering_days != null ? Number(row.custom_watering_days) : null,
    customFertilizingDays: row.custom_fertilizing_days != null ? Number(row.custom_fertilizing_days) : null,
    customRepottingMonths: row.custom_repotting_months != null ? Number(row.custom_repotting_months) : null,
  };
}

function rowToCareTask(row: DbRow): CareTask {
  return {
    id: row.id as string,
    plantId: row.plant_id as string,
    type: row.type as CareType,
    dueDate: row.due_date as string,
    completed: Boolean(row.completed),
    completedAt: (row.completed_at as string) || null,
  };
}

function rowToJournalEntry(row: DbRow): JournalEntry {
  return {
    id: row.id as string,
    plantId: (row.plant_id as string) || null,
    title: row.title as string,
    content: row.content as string,
    photoUri: (row.photo_uri as string) || null,
    createdAt: row.created_at as string,
  };
}

export function getPlantCareIntervals(plant: UserPlant): PlantCareIntervals {
  const catalog = getCatalogPlant(plant.catalogId);
  return {
    wateringDays: plant.customWateringDays ?? catalog?.wateringDays ?? 7,
    fertilizingDays: plant.customFertilizingDays ?? catalog?.fertilizingDays ?? 30,
    repottingMonths: plant.customRepottingMonths ?? catalog?.repottingMonths ?? 12,
  };
}

function scheduleCareTasks(plantId: string): void {
  for (const type of ['watering', 'fertilizing', 'repotting'] as CareType[]) {
    scheduleNextTask(plantId, type);
  }
}

export function getUserPlants(): UserPlant[] {
  const rows = db.getAllSync('SELECT * FROM user_plants ORDER BY acquired_at DESC');
  return rows.map((row) => rowToUserPlant(asRow(row)));
}

export function getUserPlant(id: string): UserPlant | null {
  const row = db.getFirstSync('SELECT * FROM user_plants WHERE id = ?', [id]);
  return row ? rowToUserPlant(asRow(row)) : null;
}

export function addUserPlant(
  catalogId: string,
  nickname: string,
  location: string = '',
  careHistory?: InitialCareHistory
): UserPlant {
  const id = generateId();
  const now = getTodayDateString();

  const lastWateredAt = careHistory?.lastWateredAt ?? null;
  const lastFertilizedAt = careHistory?.lastFertilizedAt ?? null;
  const lastRepottedAt = careHistory?.lastRepottedAt ?? null;

  db.runSync(
    `INSERT INTO user_plants (
      id, catalog_id, nickname, location, acquired_at,
      last_watered_at, last_fertilized_at, last_repotted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, catalogId, nickname, location, now, lastWateredAt, lastFertilizedAt, lastRepottedAt]
  );

  scheduleCareTasks(id);

  return getUserPlant(id)!;
}

export function updatePlantPhoto(plantId: string, photoUri: string | null): void {
  db.runSync('UPDATE user_plants SET photo_uri = ? WHERE id = ?', [photoUri, plantId]);
}

export function updatePlantCareIntervals(
  plantId: string,
  intervals: Partial<PlantCareIntervals>
): void {
  const plant = getUserPlant(plantId);
  if (!plant) return;

  const watering = intervals.wateringDays ?? plant.customWateringDays;
  const fertilizing = intervals.fertilizingDays ?? plant.customFertilizingDays;
  const repotting = intervals.repottingMonths ?? plant.customRepottingMonths;

  db.runSync(
    `UPDATE user_plants SET
      custom_watering_days = ?,
      custom_fertilizing_days = ?,
      custom_repotting_months = ?
    WHERE id = ?`,
    [watering, fertilizing, repotting, plantId]
  );

  reschedulePendingTasks(plantId);
}

function reschedulePendingTasks(plantId: string): void {
  for (const type of ['watering', 'fertilizing', 'repotting'] as CareType[]) {
    scheduleNextTask(plantId, type);
  }
}

function getLastCareDate(plant: UserPlant, type: CareType): string | null {
  switch (type) {
    case 'watering':
      return plant.lastWateredAt;
    case 'fertilizing':
      return plant.lastFertilizedAt;
    case 'repotting':
      return plant.lastRepottedAt;
  }
}

export function deleteUserPlant(id: string): void {
  db.runSync('DELETE FROM care_tasks WHERE plant_id = ?', [id]);
  db.runSync('DELETE FROM user_plants WHERE id = ?', [id]);
}

export function getCareTasks(plantId?: string): CareTask[] {
  if (plantId) {
    const rows = db.getAllSync(
      'SELECT * FROM care_tasks WHERE plant_id = ? ORDER BY due_date ASC',
      [plantId]
    );
    return rows.map((row) => rowToCareTask(asRow(row)));
  }
  const rows = db.getAllSync('SELECT * FROM care_tasks ORDER BY due_date ASC');
  return rows.map((row) => rowToCareTask(asRow(row)));
}

export function getUpcomingTasks(limit = 50): CareTask[] {
  const today = getTodayDateString();
  const rows = db.getAllSync(
    'SELECT * FROM care_tasks WHERE completed = 0 AND due_date >= ? ORDER BY due_date ASC LIMIT ?',
    [today, limit]
  );
  return rows.map((row) => rowToCareTask(asRow(row)));
}

export function getOverdueTasks(): CareTask[] {
  const today = getTodayDateString();
  const rows = db.getAllSync(
    'SELECT * FROM care_tasks WHERE completed = 0 AND due_date < ? ORDER BY due_date ASC',
    [today]
  );
  return rows.map((row) => rowToCareTask(asRow(row)));
}

export function getTodayWateringTasks(limit = 50): CareTask[] {
  const today = getTodayDateString();
  const rows = db.getAllSync(
    `SELECT * FROM care_tasks
     WHERE completed = 0 AND type = 'watering' AND due_date <= ?
     ORDER BY due_date ASC LIMIT ?`,
    [today, limit]
  );
  return rows.map((row) => rowToCareTask(asRow(row)));
}

export function completeCareTask(taskId: string): void {
  const taskRow = db.getFirstSync('SELECT * FROM care_tasks WHERE id = ?', [taskId]);
  if (!taskRow) return;

  const task = asRow(taskRow);
  const now = getTodayDateString();
  db.runSync('UPDATE care_tasks SET completed = 1, completed_at = ? WHERE id = ?', [now, taskId]);

  const plant = getUserPlant(task.plant_id as string);
  if (!plant) return;

  const type = task.type as CareType;

  const columnMap: Record<CareType, string> = {
    watering: 'last_watered_at',
    fertilizing: 'last_fertilized_at',
    repotting: 'last_repotted_at',
  };

  db.runSync(`UPDATE user_plants SET ${columnMap[type]} = ? WHERE id = ?`, [now, plant.id]);
  scheduleNextTask(plant.id, type, parseLocalDate(now));
}

export function getJournalEntries(plantId?: string): JournalEntry[] {
  if (plantId) {
    const rows = db.getAllSync(
      'SELECT * FROM journal_entries WHERE plant_id = ? ORDER BY created_at DESC',
      [plantId]
    );
    return rows.map((row) => rowToJournalEntry(asRow(row)));
  }
  const rows = db.getAllSync('SELECT * FROM journal_entries ORDER BY created_at DESC');
  return rows.map((row) => rowToJournalEntry(asRow(row)));
}

export function addJournalEntry(
  title: string,
  content: string,
  plantId: string | null = null,
  photoUri: string | null = null
): JournalEntry {
  const id = generateId();
  const now = new Date().toISOString();

  db.runSync(
    'INSERT INTO journal_entries (id, plant_id, title, content, photo_uri, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, plantId, title, content, photoUri, now]
  );

  return {
    id,
    plantId,
    title,
    content,
    photoUri,
    createdAt: now,
  };
}

export function deleteJournalEntry(id: string): void {
  db.runSync('DELETE FROM journal_entries WHERE id = ?', [id]);
}

export function getJournalEntryCount(): number {
  const row = db.getFirstSync('SELECT COUNT(*) as count FROM journal_entries');
  if (!row) return 0;
  return Number(asRow(row).count) || 0;
}
