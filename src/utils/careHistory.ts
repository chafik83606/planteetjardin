import { subDays, subMonths } from 'date-fns';
import { formatDateString, getTodayDateString, parseLocalDate } from './dates';

export type CareDaysPreset = 'unknown' | 'today' | 'yesterday' | '3days' | '1week';

export type RepottingPreset = 'unknown' | '6months' | '1year' | '2years';

export interface InitialCareHistory {
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  lastRepottedAt: string | null;
}

export const CARE_DAYS_OPTIONS: { id: CareDaysPreset; label: string; daysAgo: number | null }[] = [
  { id: 'unknown', label: 'Je ne sais pas', daysAgo: null },
  { id: 'today', label: "Aujourd'hui", daysAgo: 0 },
  { id: 'yesterday', label: 'Hier', daysAgo: 1 },
  { id: '3days', label: 'Il y a 3 jours', daysAgo: 3 },
  { id: '1week', label: 'Il y a 1 semaine', daysAgo: 7 },
];

export const REPOTTING_OPTIONS: { id: RepottingPreset; label: string; monthsAgo: number | null }[] = [
  { id: 'unknown', label: 'Je ne sais pas', monthsAgo: null },
  { id: '6months', label: 'Il y a 6 mois', monthsAgo: 6 },
  { id: '1year', label: 'Il y a 1 an', monthsAgo: 12 },
  { id: '2years', label: 'Il y a 2 ans', monthsAgo: 24 },
];

function resolveDaysPreset(
  preset: CareDaysPreset,
  customDate: string | null
): string | null {
  if (customDate) return customDate;
  const option = CARE_DAYS_OPTIONS.find((o) => o.id === preset);
  if (!option || option.daysAgo == null) return null;
  const today = parseLocalDate(getTodayDateString());
  return formatDateString(subDays(today, option.daysAgo));
}

function resolveRepottingPreset(
  preset: RepottingPreset,
  customDate: string | null
): string | null {
  if (customDate) return customDate;
  const option = REPOTTING_OPTIONS.find((o) => o.id === preset);
  if (!option || option.monthsAgo == null) return null;
  const today = parseLocalDate(getTodayDateString());
  return formatDateString(subMonths(today, option.monthsAgo));
}

export function buildInitialCareHistory(params: {
  wateringPreset: CareDaysPreset;
  wateringCustomDate: string | null;
  fertilizingPreset: CareDaysPreset;
  fertilizingCustomDate: string | null;
  repottingPreset: RepottingPreset;
  repottingCustomDate: string | null;
}): InitialCareHistory {
  return {
    lastWateredAt: resolveDaysPreset(params.wateringPreset, params.wateringCustomDate),
    lastFertilizedAt: resolveDaysPreset(params.fertilizingPreset, params.fertilizingCustomDate),
    lastRepottedAt: resolveRepottingPreset(params.repottingPreset, params.repottingCustomDate),
  };
}
