export type CareType = 'watering' | 'repotting' | 'fertilizing';

export type PlantCategory = 'interior' | 'exterior' | 'succulent' | 'herb';

export interface CatalogPlant {
  id: string;
  name: string;
  scientificName: string;
  /** Noms courants supplémentaires pour la recherche (ex. « rose » → Rosier) */
  aliases?: string[];
  category: PlantCategory;
  description: string;
  wateringDays: number;
  fertilizingDays: number;
  repottingMonths: number;
  light: string;
  humidity: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  emoji: string;
}

export interface UserPlant {
  id: string;
  catalogId: string;
  nickname: string;
  location: string;
  acquiredAt: string;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  lastRepottedAt: string | null;
  notes: string;
  photoUri: string | null;
  customWateringDays: number | null;
  customFertilizingDays: number | null;
  customRepottingMonths: number | null;
}

export interface PlantCareIntervals {
  wateringDays: number;
  fertilizingDays: number;
  repottingMonths: number;
}

export interface CareTask {
  id: string;
  plantId: string;
  type: CareType;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
}

export interface JournalEntry {
  id: string;
  plantId: string | null;
  title: string;
  content: string;
  photoUri: string | null;
  createdAt: string;
}

export interface DiagnosisResult {
  condition: string;
  confidence: number;
  description: string;
  recommendations: string[];
  severity: 'faible' | 'modérée' | 'élevée';
}

export interface IdentificationResult {
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  catalogId: string | null;
  category: PlantCategory | null;
}

export const CARE_LABELS: Record<CareType, string> = {
  watering: 'Arrosage',
  repotting: 'Rempotage',
  fertilizing: 'Engrais',
};

export const CATEGORY_LABELS: Record<PlantCategory, string> = {
  interior: 'Intérieur',
  exterior: 'Extérieur',
  succulent: 'Succulente',
  herb: 'Aromatique',
};
