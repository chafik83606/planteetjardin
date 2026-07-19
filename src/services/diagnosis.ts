import { DiagnosisResult } from '../types';
import { imageUriToBase64 } from '../utils/imageToBase64';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const MOCK_DIAGNOSES: DiagnosisResult[] = [
  {
    condition: 'Arrosage excessif',
    confidence: 0.82,
    description: 'Les feuilles jaunissent et le sol semble détrempé. Signes typiques d\'un excès d\'eau.',
    recommendations: [
      'Réduire la fréquence d\'arrosage',
      'Vérifier que le pot a des trous de drainage',
      'Laisser le sol sécher entre deux arrosages',
      'Retirer les feuilles abîmées',
    ],
    severity: 'modérée',
  },
  {
    condition: 'Carence en lumière',
    confidence: 0.75,
    description: 'Tiges allongées et feuilles pâles indiquent un manque de luminosité.',
    recommendations: [
      'Placer la plante près d\'une fenêtre lumineuse',
      'Éviter le soleil direct en milieu de journée',
      'Tourner le pot régulièrement',
    ],
    severity: 'faible',
  },
  {
    condition: 'Thrips (insectes)',
    confidence: 0.68,
    description: 'Petites traces argentées sur les feuilles, possible infestation de thrips.',
    recommendations: [
      'Isoler la plante des autres',
      'Nettoyer les feuilles à l\'eau tiède',
      'Appliquer un insecticide naturel (savon noir)',
      'Surveiller les nouvelles pousses',
    ],
    severity: 'modérée',
  },
];

async function diagnoseWithOpenAI(imageBase64: string): Promise<DiagnosisResult> {
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
          content: `Tu es un expert botaniste. Analyse la photo de plante et réponds UNIQUEMENT en JSON valide avec ce format:
{
  "condition": "nom du problème ou 'Plante en bonne santé'",
  "confidence": 0.0 à 1.0,
  "description": "description courte en français",
  "recommendations": ["conseil 1", "conseil 2"],
  "severity": "faible" | "modérée" | "élevée"
}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Diagnostique l\'état de santé de cette plante.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 500,
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

  return JSON.parse(jsonMatch[0]) as DiagnosisResult;
}

function mockDiagnose(): DiagnosisResult {
  return MOCK_DIAGNOSES[Math.floor(Math.random() * MOCK_DIAGNOSES.length)];
}

export async function diagnosePlantFromPhoto(imageUri: string): Promise<DiagnosisResult> {
  if (!OPENAI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return mockDiagnose();
  }

  const base64 = await imageUriToBase64(imageUri);
  return diagnoseWithOpenAI(base64);
}

export function isDiagnosisAvailable(): boolean {
  return true;
}

export function isRealAIEnabled(): boolean {
  return Boolean(OPENAI_API_KEY);
}
