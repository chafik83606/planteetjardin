import { PLANT_CATALOG, getCatalogPlant } from '../data/plants';
import { IdentificationResult, PlantCategory } from '../types';
import { imageUriToBase64 } from '../utils/imageToBase64';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const CATALOG_PROMPT = PLANT_CATALOG.map(
  (p) => `${p.id}: ${p.name} (${p.scientificName})`
).join('\n');

function findCatalogMatch(name: string, scientificName: string): string | null {
  const lowerName = name.toLowerCase();
  const lowerSci = scientificName.toLowerCase();

  const exact = PLANT_CATALOG.find(
    (p) =>
      p.name.toLowerCase() === lowerName ||
      p.scientificName.toLowerCase() === lowerSci ||
      lowerName.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(lowerName)
  );
  return exact?.id ?? null;
}

async function identifyWithOpenAI(imageBase64: string): Promise<IdentificationResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un botaniste expert en identification de plantes. Analyse la photo et identifie l'espèce.
Réponds UNIQUEMENT en JSON valide :
{
  "name": "nom commun en français",
  "scientificName": "nom scientifique",
  "confidence": 0.0 à 1.0,
  "description": "courte description en français",
  "catalogId": "id du catalogue si correspondance, sinon null",
  "category": "interior" | "exterior" | "succulent" | "herb" | null
}

Catalogue disponible (utilise catalogId si la plante correspond) :
${CATALOG_PROMPT}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identifie cette plante.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 401) {
      throw new Error('Clé OpenAI invalide ou expirée (401).');
    }
    if (response.status === 429) {
      throw new Error('Quota OpenAI dépassé ou trop de requêtes (429).');
    }
    if (response.status === 402 || body.toLowerCase().includes('billing')) {
      throw new Error('Compte OpenAI sans crédit / facturation inactive.');
    }
    throw new Error(`API OpenAI erreur ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid API response');

  const parsed = JSON.parse(jsonMatch[0]) as IdentificationResult;
  const catalogId =
    (parsed.catalogId && getCatalogPlant(parsed.catalogId) ? parsed.catalogId : null) ||
    findCatalogMatch(parsed.name, parsed.scientificName);

  const catalog = catalogId ? getCatalogPlant(catalogId) : null;

  return {
    name: parsed.name,
    scientificName: parsed.scientificName,
    confidence: parsed.confidence,
    description: parsed.description,
    catalogId,
    category: catalog?.category ?? parsed.category,
  };
}

function mockIdentify(): IdentificationResult {
  const candidates = PLANT_CATALOG.filter((p) =>
    ['monstera', 'pothos', 'aloe-vera', 'spathiphyllum', 'basilic'].includes(p.id)
  );
  const plant = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    name: plant.name,
    scientificName: plant.scientificName,
    confidence: 0.75 + Math.random() * 0.15,
    description: plant.description,
    catalogId: plant.id,
    category: plant.category,
  };
}

export async function identifyPlantFromPhoto(imageUri: string): Promise<IdentificationResult> {
  if (!OPENAI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return mockIdentify();
  }

  const base64 = await imageUriToBase64(imageUri);
  return identifyWithOpenAI(base64);
}

export function isRealAIEnabled(): boolean {
  return Boolean(OPENAI_API_KEY);
}

export function getCategoryLabel(category: PlantCategory | null): string {
  if (!category) return 'Non classée';
  const labels: Record<PlantCategory, string> = {
    interior: 'Intérieur',
    exterior: 'Extérieur',
    succulent: 'Succulente',
    herb: 'Aromatique',
  };
  return labels[category];
}
