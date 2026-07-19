# Plante & Jardin 🌱

Application mobile d'entretien des plantes pour jardiniers amateurs et propriétaires de plantes d'intérieur.

## Fonctionnalités

- **Catalogue** — 50 plantes courantes (intérieur, succulentes, aromatiques, extérieur) avec fiches détaillées
- **Mes plantes** — Ajoutez vos plantes et suivez leur entretien
- **Calendrier** — Rappels automatiques d'arrosage, rempotage et engrais
- **Notifications push** — Alertes locales pour ne rien oublier
- **Diagnostic IA** — Détection de maladies par photo (OpenAI GPT-4o-mini ou mode démo)
- **Journal de bord** — Notes et observations sur vos plantes
- **Freemium** — 5 plantes, 20 entrées journal, 3 diagnostics/mois en gratuit

## Démarrage

```bash
npm install
npm start
```

Scannez le QR code avec **Expo Go** (iOS/Android) ou lancez sur émulateur :

```bash
npm run android
npm run ios
```

## Configuration IA (optionnel)

Copiez `.env.example` vers `.env` et ajoutez votre clé OpenAI :

```
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

Sans clé API, le diagnostic fonctionne en **mode démo** avec des résultats simulés.

## Structure du projet

```
app/                  # Écrans (Expo Router)
  (tabs)/             # Navigation principale
  catalog/[id].tsx    # Fiche catalogue
  plant/[id].tsx      # Détail plante utilisateur
  diagnose.tsx        # Diagnostic photo IA
  premium.tsx         # Abonnement freemium
src/
  components/         # Composants UI réutilisables
  constants/          # Thème et couleurs
  context/            # Gestion abonnement
  data/               # Catalogue de plantes
  hooks/              # Hooks React
  services/           # SQLite, notifications, diagnostic
  types/              # Types TypeScript
```

## Prochaines étapes

- [ ] Authentification utilisateur (Supabase / Firebase)
- [ ] Synchronisation cloud et sauvegarde
- [ ] Paiements réels (Google Play / App Store via expo-iap)
- [ ] Plus de plantes dans le catalogue
- [ ] Widget météo pour adapter l'arrosage
- [ ] Partage social (photos du journal)
- [ ] Publication App Store / Play Store

## Stack technique

- **Expo SDK 56** + React Native
- **Expo Router** — navigation par fichiers
- **expo-sqlite** — stockage local
- **expo-notifications** — rappels push
- **expo-image-picker** — photos pour diagnostic
- **OpenAI API** — analyse d'images (optionnel)

## Licence

MIT
