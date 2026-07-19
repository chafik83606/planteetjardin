# Publication Play Store — Plante & Jardin

Guide pour créer votre **première version** sur Google Play Console.  
Le projet est déjà configuré côté code ; vous faites le dépôt sur la console.

---

## Identifiants (déjà configurés)

| Champ | Valeur |
|-------|--------|
| Nom | Plante & Jardin |
| Package | `com.planteetjardin.app` |
| Version nom | `1.1.6` |
| Version code | `8` |

À chaque nouvelle release : incrémenter `versionCode` dans `app.json` (5, 6, 7…) et éventuellement `version` (1.1.4, 1.2.0…).

---

## Dépannage build EAS

Si le build échoue à « Install dependencies », le projet inclut un fichier `.npmrc` avec `legacy-peer-deps=true` (conflit React / react-dom). Relancez :

```bash
npm run build:android:production
```

---

## Étape 1 — Générer le fichier AAB (vous)

```bash
npm install -g eas-cli
eas login
eas init
npm run build:android:production
```

- `eas init` lie le projet à votre compte Expo (une seule fois).
- Le build produit un **.aab** (Android App Bundle) requis par Google Play.
- Téléchargez le fichier depuis [expo.dev](https://expo.dev) une fois le build terminé.

**Test interne avant production :**

```bash
npm run build:android:preview
```

Produit un APK plus simple à installer sur un appareil de test.

---

## Étape 2 — Play Console : créer la version (vous)

1. Ouvrez **Plante & Jardin** dans la Play Console.
2. Menu **Tester et publier** → **Tests internes** (recommandé pour la 1ʳᵉ fois) ou **Production**.
3. **Créer une version**.
4. **Importer** le fichier `.aab` téléchargé depuis EAS.
5. Renseignez les **notes de version** (exemple ci-dessous).
6. **Enregistrer** → **Examiner la version** → **Déployer** (quand tout est vert).

### Notes de version (exemple v1.0.0)

```
Première version de Plante & Jardin :
• Catalogue de 50 plantes avec fiches d'entretien
• Calendrier d'arrosage, engrais et rempotage
• Identification de plante par photo (IA)
• Diagnostic santé des plantes
• Journal de bord avec photos
• Rappels d'entretien
```

### Notes de version (exemple v1.1.0)

```
Plante & Jardin 1.1.0 :

• Catalogue élargi à 50 plantes
• Identification d'espèce par photo (IA)
• Photos personnelles sur vos plantes et le journal
• Rappels d'entretien personnalisables par plante
• Accueil : plantes à arroser aujourd'hui
• Recherche et filtres dans le journal
• Partage des fiches plante et entrées journal en image
• Stabilité et corrections diverses
```

### Notes de version (exemple v1.1.1)

```
Plante & Jardin 1.1.1 :

• Nouvelle icône et visuels Play Store
• Politique de confidentialité et page suppression des données
• Stabilité et corrections diverses
```

### Notes de version (exemple v1.1.2)

```
Plante & Jardin 1.1.2 :

• Corrections et améliorations de stabilité
```

### Notes de version (exemple v1.1.3)

```
Plante & Jardin 1.1.3 :

• Corrections et améliorations de stabilité
```

### Notes de version (exemple v1.1.4)

```
Plante & Jardin 1.1.4 :

• Abonnements Premium (4,99 €/mois ou 39,99 €/an)
• Paiements Google Play intégrés
• Corrections et améliorations
```

### Notes de version (v1.1.6) — prochaine release production

```
Plante & Jardin 1.1.6 :

• Abonnements Premium via Google Play (paiement direct, sans intermédiaire)
• Diagnostic et identification IA activés
• Corrections et améliorations de stabilité
```

---

## Étape 3 — Checklist obligatoire Play Console

Cochez chaque section avant publication en production :

### Fiche Play Store (Présence sur le Play Store)

- [ ] **Titre** : Plante & Jardin (max 30 car.)
- [ ] **Description courte** (max 80 car.) — voir texte ci-dessous
- [ ] **Description complète** — voir texte ci-dessous
- [ ] **Icône** 512×512 px
- [ ] **Graphique** 1024×500 px (bannière)
- [ ] **Captures d'écran** : minimum 2 (téléphone), idéal 4–8
- [ ] **Catégorie** : Maison et jardin
- [ ] **E-mail de contact** développeur
- [ ] **URL politique de confidentialité** (obligatoire)

### Contenu de l'application

- [ ] **Questionnaire classification du contenu** (PEGI / âge)
- [ ] **Public cible** et conformité enfants
- [ ] **Sécurité des données** (formulaire données collectées)

### Technique

- [ ] **Signature** : gérée par EAS (recommandé) ou upload clé Play App Signing
- [ ] **Permissions** déclarées : caméra, notifications

---

## Textes prêts pour la fiche Play Store

### Description courte

```
Entretenez vos plantes : rappels, identification photo, journal et diagnostic IA.
```

### Description complète

```
Plante & Jardin est l'application idéale pour les jardiniers amateurs et les amoureux des plantes d'intérieur.

🌿 CATALOGUE
Découvrez 50 plantes courantes avec fiches détaillées : arrosage, engrais, lumière, humidité et niveau de difficulté.

🪴 MES PLANTES
Ajoutez vos plantes, personnalisez les rappels et suivez leur entretien avec photos.

📅 CALENDRIER
Arrosage, rempotage et engrais planifiés automatiquement. Validez chaque tâche en un tap.

🔍 IDENTIFICATION IA
Photographiez une plante inconnue pour découvrir son espèce et accéder à sa fiche.

🩺 DIAGNOSTIC SANTÉ
Détectez maladies et carences grâce à l'analyse photo par intelligence artificielle.

📝 JOURNAL
Notez l'évolution de vos plantes, ajoutez des photos et partagez vos réussites.

🔔 RAPPELS
Notifications pour ne jamais oublier d'arroser vos plantes.

Gratuit avec options Premium à venir. Vos données restent sur votre appareil.

Développé par Dynaweb.
```

---

## Politique de confidentialité

Google exige une **URL publique**. Contenu minimum à mentionner :

- Données stockées **localement** sur l'appareil (plantes, journal, photos)
- Utilisation **optionnelle** de l'API OpenAI si l'utilisateur configure une clé (identification / diagnostic)
- Pas de compte utilisateur pour l'instant
- Permissions : caméra, galerie, notifications

Hébergez la page sur votre site Dynaweb ou GitHub Pages, puis collez l'URL dans la Play Console.

---

## Captures d'écran suggérées

1. Accueil — « À arroser aujourd'hui »
2. Catalogue de plantes
3. Fiche plante avec photo
4. Identification par photo
5. Journal
6. Calendrier d'entretien

Format : PNG ou JPEG, ratio téléphone (ex. 1080×1920).

---

## Après la 1ʳᵉ publication

| Action | Où |
|--------|-----|
| Nouvelle version | Incrémenter `versionCode` + rebuild AAB |
| Test interne | Tests internes → nouvelle version |
| Production | Production → créer version → déployer |
| Crashs | Play Console → Qualité → Rapports Android vitals |

---

## Commandes utiles

```bash
# Vérifier la config Expo
npx expo-doctor

# Build production (AAB pour Play Store)
npm run build:android:production

# Build test (APK)
npm run build:android:preview
```
