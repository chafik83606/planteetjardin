import { CatalogPlant, PlantCategory } from '../types';

const CATEGORY_ADVICE: Record<PlantCategory, string> = {
  interior:
    'Engrais liquide équilibré pour plantes vertes (NPK), dilué de moitié au printemps et en été.',
  exterior:
    'Engrais universel jardin ou engrais floraison selon l\'espèce, appliqué au printemps.',
  succulent:
    'Engrais spécial cactées et succulentes, très dilué, 1 à 2 fois en saison de croissance.',
  herb:
    'Engrais pour plantes aromatiques ou universel dilué, riche en azote, en période de croissance.',
};

const PLANT_OVERRIDES: Partial<Record<string, string>> = {
  orchidee: 'Engrais pour orchidées (20-20-20), très dilué, à chaque arrosage en période de croissance.',
  rosier: 'Engrais rosier riche en potassium, du printemps à l\'été, toutes les 2 à 3 semaines.',
  hibiscus: 'Engrais floraison riche en potassium, toutes les 2 semaines en saison.',
  fraisier: 'Engrais pour fraisiers ou tomates, riche en potassium, au printemps.',
  geranium: 'Engrais floraison, toutes les 2 semaines pendant la floraison.',
  tomate: 'Engrais tomates riche en potassium, toutes les 2 semaines en saison.',
  courgette: 'Engrais potager riche en potassium, toutes les 2 semaines en croissance.',
  poivron: 'Engrais potager ou tomates, équilibré, toutes les 2 à 3 semaines.',
  aubergine: 'Engrais potager riche en potassium, toutes les 2 à 3 semaines en été.',
  olivier: 'Engrais pour agrumes/olivier, riche en azote et fer, au printemps.',
  strelitzia: 'Engrais universel dilué ou engrais floraison, une fois par mois en été.',
  jasmin: 'Engrais floraison, toutes les 2 semaines au printemps et en été.',
};

export function getFertilizerAdvice(plant: CatalogPlant): string {
  return PLANT_OVERRIDES[plant.id] ?? CATEGORY_ADVICE[plant.category];
}
