# Publication App Store — Plante & Jardin (iOS)

Guide pour **TestFlight** puis **App Store**, en parallèle de la config Android.

---

## Identifiants (déjà configurés)

| Champ | Valeur |
|-------|--------|
| Nom | Plante & Jardin |
| Bundle ID | `com.planteetjardin.app` |
| SKU App Store Connect | `planteetjardin` |
| Version | `1.1.4` / build `6` |

À chaque nouvelle release : incrémenter `ios.buildNumber` dans `app.json` (obligatoire) et éventuellement `version`.

---

## Où vous en êtes

- [x] App créée dans **App Store Connect**
- [x] Build **1.1.4 (6)** sur **TestFlight** (via EAS)
- [ ] Abonnements iOS dans App Store Connect
- [ ] Build iOS + TestFlight
- [ ] Captures d'écran iPhone (obligatoire pour la review)
- [ ] Fiche App Store complète → soumission review

---

## Étape 1 — Abonnements App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps** → **Plante & Jardin**
2. **Monétisation** (ou **Fonctionnalités** → **Abonnements**) → **Groupes d'abonnements**
3. **Créer** un groupe : `Premium` (nom affiché, pas l'ID technique)

### Abonnement mensuel

| Champ | Valeur |
|-------|--------|
| ID de référence | `mensuel` |
| ID produit | `planteetjardin.mensuel` |
| Durée | 1 mois |
| Prix | **4,99 €** |

### Abonnement annuel

| Champ | Valeur |
|-------|--------|
| ID de référence | `annuel` |
| ID produit | `planteetjardin.annuel` |
| Durée | 1 an |
| Prix | **39,99 €** |

4. Pour chaque abonnement : ajoutez une **localisation française** (nom + description)
5. **Enregistrer** — les abonnements seront validés avec la **première version** de l'app

> IDs dans le code : `src/constants/subscriptions.ts`

---

## Étape 2 — Build iOS

```powershell
npm run build:ios:production
```

Puis envoi TestFlight :

```powershell
eas submit --platform ios --profile production
```

(EAS vous demandera vos identifiants Apple la première fois.)

---

## Étape 3 — Fiche App Store (obligatoire avant review)

App Store Connect → **Plante & Jardin** → **App Store** (onglet Distribution)

### Textes prêts

**Nom** (30 car. max) : `Plante & Jardin`

**Sous-titre** (30 car.) : `Rappels, identification, journal`

**Description** : reprendre la description Play Store de `PLAYSTORE.md` (adapter si besoin).

**Mots-clés** (100 car., virgules sans espace) :
```
plantes,jardin,arroser,plante,intérieur,rappel,identification,journal,balcon
```

**URL assistance** : `https://w-dynaweb.com/` ou votre email support

**URL confidentialité** (obligatoire) :
```
https://chafik83606.github.io/planteetjardin-privacy/
```

### Captures d'écran

| Format | Taille | Obligatoire |
|--------|--------|-------------|
| iPhone 6,7" | 1290 × 2796 | Oui (iPhone 15 Pro Max) |
| iPhone 6,5" | 1284 × 2778 | Recommandé (iPhone 11 Pro Max) |

Minimum **3 captures** par taille. Mêmes écrans que Play Store :
1. Accueil
2. Catalogue
3. Fiche plante / identification
4. Journal
5. Calendrier

**Astuce** : simulateur Xcode (iPhone 15 Pro Max) → Cmd+S, ou appareil réel.

### Classification

- **Catégorie principale** : Style de vie
- **Catégorie secondaire** : Utilitaires (optionnel)
- **Classification par âge** : questionnaire → généralement **4+**

### Confidentialité (App Privacy)

- Données stockées **sur l'appareil** (pas de compte)
- Photos : liées à la fonctionnalité (diagnostic / journal)
- Pas de suivi publicitaire

---

## Étape 5 — TestFlight

1. **TestFlight** → build **1.1.4 (6)** ou le nouveau build
2. **Informations de test** : décrivez identification, diagnostic, abonnements
3. **Connexion requise** : **décocher** (pas de login dans l'app)
4. Ajoutez-vous comme testeur interne
5. Installez via l'app **TestFlight** sur iPhone et testez

---

## Étape 6 — Soumettre pour review

1. **App Store** → version **1.1.4** (ou nouvelle)
2. Sélectionnez le **build**
3. **Abonnements** : associez le groupe Premium à cette version
4. **Export compliance** : non (déjà `ITSAppUsesNonExemptEncryption: false`)
5. **Soumettre pour examen**

Délai review Apple : souvent **24–48 h**.

---

## Compte démo pour Apple (si demandé)

L'app n'a pas de login. Dans les **notes pour l'examinateur** :

```
Aucune connexion requise. Toutes les données sont locales.
Premium : abonnement via App Store (sandbox). Tester achat mensuel ou annuel depuis l'écran Premium.
Identification/diagnostic : nécessite une clé API configurée côté développeur.
```

---

## Checklist rapide

- [ ] Abonnements `planteetjardin.mensuel` + `planteetjardin.annuel` créés
- [ ] Build iOS production + submit TestFlight
- [ ] Build iOS production + submit TestFlight
- [ ] 3+ captures iPhone 6,7"
- [ ] Politique de confidentialité URL
- [ ] Build sélectionné + abonnements liés → Submit

---

## Commandes utiles

```powershell
# Build iOS production (.ipa)
npm run build:ios:production

# Envoyer sur TestFlight
npm run submit:ios

# Vérifier config Expo
npx expo-doctor
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| « Abonnement indisponible » sur iPhone | Abonnements pas actifs dans App Store Connect, ou app pas installée via TestFlight |
| Build rejeté (screenshots) | Ajouter captures 6,7" |
| Achats TestFlight | Compte sandbox Apple (Réglages → App Store → Sandbox) |
| Métadonnées abonnement manquantes | Localisation FR sur chaque abonnement |
