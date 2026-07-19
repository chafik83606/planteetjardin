# Abonnements Premium — Google Play + App Store (sans RevenueCat)

Guide pour activer les paiements **4,99 €/mois** et **39,99 €/an** directement via **Google Play Billing** et **App Store**.

---

## Vue d'ensemble

| Étape | Où |
|-------|-----|
| 1. Créer les abonnements | Play Console + App Store Connect |
| 2. IDs dans le code | `src/constants/subscriptions.ts` |
| 3. Nouveau build | EAS (`.aab` / `.ipa`) |

Les achats **ne fonctionnent pas** dans Expo Go — uniquement dans le build installé depuis Play Store ou TestFlight.

---

## IDs produits (déjà dans le code)

| Plateforme | Mensuel | Annuel |
|------------|---------|--------|
| **Android** | `planteetjardin_premium_monthly` | `planteetjardin.annuel` |
| **iOS** | `planteetjardin.mensuel` | `planteetjardin.annuel` |

Fichier : `src/constants/subscriptions.ts`

---

## Android — Google Play Console

1. **Monétiser** → **Abonnements** — créer / activer les 2 abonnements
2. Formules de base : `monthly` et `yearly` — **Actives** avec prix (4,99 € / 39,99 €)
3. **Compte marchand** lié
4. **Testeurs de licence** → ajoutez votre Gmail
5. Uploadez le `.aab` en **test interne**

### Test Android

- Installez depuis le **lien test interne** Play
- Les testeurs de licence voient parfois **0,00 €** (normal — pas débité)
- Appuyez sur S'abonner pour vérifier que Premium se débloque

---

## iOS — App Store Connect

1. **Abonnements** → groupe Premium
2. `planteetjardin.mensuel` (1 mois) + `planteetjardin.annuel` (1 an)
3. Localisation française + prix
4. Build via TestFlight

### Test iOS

- Compte **sandbox** Apple (Réglages → App Store → Sandbox)

---

## Build

```powershell
npm run build:android:production
npm run build:ios:production
npm run submit:ios
```

**Pas de clé RevenueCat** — plus besoin de `goog_...` ni `appl_...` dans EAS.

Seule clé EAS utile : `EXPO_PUBLIC_OPENAI_API_KEY` (diagnostic / identification).

---

## Technique

- Bibliothèque : **expo-iap** (Play Billing + StoreKit direct)
- Service : `src/services/purchases.ts`
- Premium actif = abonnement actif détecté par le store

---

## Dépannage

| Problème | Solution |
|----------|----------|
| « Abonnement indisponible » | App pas installée depuis le store, ou abonnements pas actifs |
| 0,00 € sur Android | Testeur de licence — essayez quand même S'abonner |
| Expo Go | Ne supporte pas les IAP — utilisez un build EAS |
| Prix incorrect | Vérifier formules de base dans Play Console |

---

## iOS détaillé

Voir **`APPSTORE.md`** pour la fiche App Store et TestFlight.
