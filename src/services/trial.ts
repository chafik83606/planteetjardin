import * as SQLite from 'expo-sqlite';
import { TRIAL_DURATION_DAYS } from '../constants/subscriptions';

const db = SQLite.openDatabaseSync('planteetjardin.db');
const TRIAL_START_KEY = 'trial_start_at';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function ensureSettingsTable(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export function getTrialStartDate(): string {
  ensureSettingsTable();
  const row = db.getFirstSync('SELECT value FROM app_settings WHERE key = ?', [TRIAL_START_KEY]);
  if (row) return row.value as string;

  const now = new Date().toISOString();
  db.runSync('INSERT INTO app_settings (key, value) VALUES (?, ?)', [TRIAL_START_KEY, now]);
  return now;
}

export function getTrialDaysRemaining(): number {
  const start = new Date(getTrialStartDate()).getTime();
  const daysElapsed = Math.floor((Date.now() - start) / MS_PER_DAY);
  return Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
}

export function isTrialActive(): boolean {
  return getTrialDaysRemaining() > 0;
}

export function hasTrialExpired(): boolean {
  return !isTrialActive();
}
