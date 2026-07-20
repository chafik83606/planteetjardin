import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { Button } from '../src/components/ui';
import { colors, spacing, radius } from '../src/constants/theme';
import { useSubscription } from '../src/context/SubscriptionContext';

import { TRIAL_DURATION_DAYS } from '../src/constants/subscriptions';

const FEATURES = [
  { emoji: '🪴', title: 'Plantes illimitées', desc: 'Gérez toute votre collection sans limite' },
  { emoji: '🔍', title: 'Diagnostic illimité', desc: 'Détection de maladies par photo sans restriction' },
  { emoji: '🔔', title: 'Notifications avancées', desc: 'Rappels personnalisés pour vos plantes' },
  { emoji: '📝', title: 'Journal illimité', desc: 'Conservez tout l\'historique de vos plantes' },
];

const PRIVACY_URL = 'https://chafik83606.github.io/planteetjardin-privacy/';
const EULA_URL = 'https://chafik83606.github.io/planteetjardin-privacy/eula.html';

export default function PremiumScreen() {
  const {
    isPremium,
    isTrialActive,
    trialDaysRemaining,
    trialExpired,
    isLoading,
    purchasesReady,
    monthlyProduct,
    yearlyProduct,
    purchaseMonthly,
    purchaseYearly,
    restore,
  } = useSubscription();

  const monthlyPrice = monthlyProduct?.priceString || '…';
  const yearlyPrice = yearlyProduct?.priceString || '…';

  if (isPremium) {
    return (
      <View style={styles.container}>
        <Text style={styles.premiumActive}>⭐ Vous êtes Premium !</Text>
        <Text style={styles.premiumThanks}>Merci de soutenir Plante & Jardin.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌿</Text>
        <Text style={styles.heroTitle}>Plante & Jardin Premium</Text>
        <Text style={styles.heroSubtitle}>
          {trialExpired
            ? 'Votre essai gratuit est terminé. Abonnez-vous pour continuer à utiliser l\'app.'
            : isTrialActive
              ? `Essai gratuit : ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''} restant${trialDaysRemaining > 1 ? 's' : ''}`
              : 'Débloquez tout le potentiel de votre jardin numérique'}
        </Text>
      </View>

      {isTrialActive && !isPremium && (
        <View style={styles.trialBanner}>
          <Text style={styles.trialBannerText}>
            Profitez de toutes les fonctionnalités pendant {TRIAL_DURATION_DAYS} jours, puis
            abonnez-vous pour continuer.
          </Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.priceCard}>
            <Text style={styles.planTitle}>Premium Mensuel</Text>
            <Text style={styles.planDuration}>Abonnement de 1 mois, renouvellement automatique</Text>
            <Text style={styles.price}>{monthlyPrice}</Text>
            <Text style={styles.pricePeriod}>/ mois</Text>
            <Button title="S'abonner mensuellement" onPress={purchaseMonthly} style={styles.planBtn} />
          </View>

          <View style={[styles.priceCard, styles.priceCardAlt]}>
            <Text style={styles.planTitle}>Premium Annuel</Text>
            <Text style={styles.planDuration}>Abonnement de 1 an, renouvellement automatique</Text>
            <Text style={styles.price}>{yearlyPrice}</Text>
            <Text style={styles.pricePeriod}>/ an</Text>
            <Text style={styles.priceNote}>Économisez par rapport au mensuel</Text>
            <Button
              title="S'abonner annuellement"
              onPress={purchaseYearly}
              variant="secondary"
              style={styles.planBtn}
            />
          </View>
        </>
      )}

      {FEATURES.map((feature) => (
        <View key={feature.title} style={styles.feature}>
          <Text style={styles.featureEmoji}>{feature.emoji}</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
        </View>
      ))}

      <Button title="Restaurer mes achats" onPress={restore} variant="secondary" style={styles.cta} />

      <Text style={styles.disclaimer}>
        L'abonnement se renouvelle automatiquement. Vous pouvez l'annuler à tout moment dans les
        paramètres {Platform.OS === 'ios' ? 'de l\'App Store' : 'Google Play'}. Le paiement est
        débité sur votre compte {Platform.OS === 'ios' ? 'Apple' : 'Google Play'}.
      </Text>

      <View style={styles.legalLinks}>
        <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
          Politique de confidentialité
        </Text>
        <Text style={styles.legalSep}> · </Text>
        <Text style={styles.link} onPress={() => Linking.openURL(EULA_URL)}>
          Conditions d'utilisation (EULA)
        </Text>
      </View>

      {!purchasesReady && !isLoading && (
        <Text style={styles.setupNote}>
          {Platform.OS === 'ios'
            ? 'Les abonnements seront actifs une fois configurés dans App Store Connect (voir IAP.md).'
            : 'Installez l\'app depuis le Play Store pour activer les abonnements.'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  trialBanner: {
    backgroundColor: colors.warning + '20',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  trialBannerText: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceCardAlt: {
    backgroundColor: colors.primaryDark,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  planDuration: {
    fontSize: 12,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.surface,
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.accent,
  },
  priceNote: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  planBtn: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  cta: {
    marginTop: spacing.md,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  link: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  legalSep: {
    fontSize: 12,
    color: colors.textLight,
  },
  setupNote: {
    fontSize: 11,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  premiumActive: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.premium,
    textAlign: 'center',
    marginTop: spacing.xl * 2,
  },
  premiumThanks: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
