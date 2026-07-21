import { formatISO, parseISO } from 'date-fns';

/** Parse une date YYYY-MM-DD en date locale (évite le décalage UTC de `new Date(str)`). */
export function parseLocalDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function getTodayDateString(): string {
  return formatISO(new Date(), { representation: 'date' });
}

export function formatLocalDateLabel(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    localeMatcher: 'best fit',
  });
}

export function formatLocalDateLabelShort(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
