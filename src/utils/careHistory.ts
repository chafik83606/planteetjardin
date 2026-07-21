export type CareDaysPreset = 'unknown' | 'today' | 'yesterday' | '3days' | '1week';

export type RepottingPreset = 'unknown' | '6months' | '1year' | '2years';

export interface InitialCareHistory {
  lastWateredDaysAgo: number | null;
  lastFertilizedDaysAgo: number | null;
  lastRepottedMonthsAgo: number | null;
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

export function buildInitialCareHistory(
  watering: CareDaysPreset,
  fertilizing: CareDaysPreset,
  repotting: RepottingPreset
): InitialCareHistory {
  const wateringOpt = CARE_DAYS_OPTIONS.find((o) => o.id === watering)!;
  const fertilizingOpt = CARE_DAYS_OPTIONS.find((o) => o.id === fertilizing)!;
  const repottingOpt = REPOTTING_OPTIONS.find((o) => o.id === repotting)!;

  return {
    lastWateredDaysAgo: wateringOpt.daysAgo,
    lastFertilizedDaysAgo: fertilizingOpt.daysAgo,
    lastRepottedMonthsAgo: repottingOpt.monthsAgo,
  };
}
