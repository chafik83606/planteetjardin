import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../src/hooks/useAppData';
import { getCatalogPlant } from '../../src/data/plants';
import { getUserPlant, completeCareTask } from '../../src/services/database';
import { scheduleCareReminders } from '../../src/services/notifications';
import { getTodayDateString } from '../../src/utils/dates';
import { Card, Button, EmptyState } from '../../src/components/ui';
import { CareTaskItem } from '../../src/components/CareTaskItem';
import { colors, spacing, radius } from '../../src/constants/theme';
import { useSubscription } from '../../src/context/SubscriptionContext';

export default function HomeScreen() {
  const router = useRouter();
  const { plants, upcomingTasks, overdueTasks, todayWatering, refresh } = useAppData();
  const { isPremium, isTrialActive, trialDaysRemaining } = useSubscription();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleCompleteTask = async (taskId: string) => {
    completeCareTask(taskId);
    await scheduleCareReminders();
    refresh();
  };

  const otherTasks = [...overdueTasks, ...upcomingTasks]
    .filter((t) => t.type !== 'watering' || !todayWatering.some((w) => w.id === t.id))
    .slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 🌱</Text>
          <Text style={styles.subtitle}>
            {plants.length === 0
              ? 'Commencez par ajouter vos plantes'
              : `${plants.length} plante${plants.length > 1 ? 's' : ''} sous votre garde`}
          </Text>
        </View>
        {isTrialActive && !isPremium ? (
          <TouchableOpacity style={styles.trialBadge} onPress={() => router.push('/premium')}>
            <Text style={styles.trialText}>Essai {trialDaysRemaining}j</Text>
          </TouchableOpacity>
        ) : !isPremium ? (
          <TouchableOpacity style={styles.premiumBadge} onPress={() => router.push('/premium')}>
            <Ionicons name="star" size={14} color={colors.premium} />
            <Text style={styles.premiumText}>Premium</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.wateringTitle}>💧 À arroser aujourd'hui</Text>
      {todayWatering.length === 0 ? (
        <Card style={styles.wateringCard}>
          <Text style={styles.wateringEmpty}>Aucun arrosage prévu — vos plantes sont heureuses !</Text>
        </Card>
      ) : (
        <Card style={styles.wateringCard}>
          {todayWatering.map((task) => {
            const plant = getUserPlant(task.plantId);
            const catalog = plant ? getCatalogPlant(plant.catalogId) : null;
            const isOverdue = task.dueDate < getTodayDateString();

            return (
              <TouchableOpacity
                key={task.id}
                style={styles.wateringRow}
                onPress={() => plant && router.push(`/plant/${plant.id}`)}
                activeOpacity={0.7}
              >
                {plant?.photoUri ? (
                  <Image source={{ uri: plant.photoUri }} style={styles.wateringPhoto} />
                ) : (
                  <View style={styles.wateringEmojiBox}>
                    <Text style={styles.wateringEmoji}>{catalog?.emoji || '🌱'}</Text>
                  </View>
                )}
                <View style={styles.wateringInfo}>
                  <Text style={styles.wateringName}>{plant?.nickname || 'Plante'}</Text>
                  <Text style={[styles.wateringStatus, isOverdue && styles.wateringOverdue]}>
                    {isOverdue ? 'En retard' : 'À arroser'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCompleteTask(task.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      <View style={styles.aiRow}>
        <TouchableOpacity
          style={[styles.aiBanner, styles.identifyBanner]}
          onPress={() => router.push('/identify')}
          activeOpacity={0.8}
        >
          <Text style={styles.aiEmoji}>🌿</Text>
          <View style={styles.aiText}>
            <Text style={styles.aiTitle}>Identifier cette plante</Text>
            <Text style={styles.aiSubtitle}>Reconnaissance par photo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aiBanner, styles.diagnoseBanner]}
          onPress={() => router.push('/diagnose')}
          activeOpacity={0.8}
        >
          <Ionicons name="medkit" size={24} color={colors.surface} />
          <View style={styles.aiText}>
            <Text style={[styles.aiTitle, styles.diagnoseTitle]}>Diagnostic santé</Text>
            <Text style={[styles.aiSubtitle, styles.diagnoseSubtitle]}>Détecter maladies & carences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Autres tâches</Text>
      <Text style={styles.tasksHint}>
        Dates calculées selon ce que vous avez indiqué à l'ajout de la plante. Cochez ✓ après chaque
        entretien pour recalculer.
      </Text>
      {otherTasks.length === 0 ? (
        <Card>
          <EmptyState
            emoji="✅"
            title="Tout est à jour !"
            subtitle="Aucune autre tâche d'entretien prévue."
          />
        </Card>
      ) : (
        <Card>
          {otherTasks.map((task) => {
            const plant = getUserPlant(task.plantId);
            const catalog = plant ? getCatalogPlant(plant.catalogId) : null;
            return (
              <CareTaskItem
                key={task.id}
                type={task.type}
                plantName={plant?.nickname || catalog?.name || 'Plante'}
                plantEmoji={catalog?.emoji || '🌱'}
                dueDate={task.dueDate}
                isOverdue={overdueTasks.includes(task)}
                onComplete={() => handleCompleteTask(task.id)}
              />
            );
          })}
        </Card>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/catalog')}
          >
            <Text style={styles.actionEmoji}>📚</Text>
            <Text style={styles.actionLabel}>Catalogue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/plants')}
          >
            <Text style={styles.actionEmoji}>🪴</Text>
            <Text style={styles.actionLabel}>Mes plantes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/journal')}
          >
            <Text style={styles.actionEmoji}>📝</Text>
            <Text style={styles.actionLabel}>Journal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {plants.length === 0 && (
        <Button
          title="Ajouter ma première plante"
          onPress={() => router.push('/(tabs)/catalog')}
          style={styles.ctaButton}
        />
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.premium + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.premium,
  },
  trialBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  wateringTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  wateringCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  wateringEmpty: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  wateringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  wateringPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  wateringEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wateringEmoji: {
    fontSize: 24,
  },
  wateringInfo: {
    flex: 1,
  },
  wateringName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  wateringStatus: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  wateringOverdue: {
    color: colors.danger,
  },
  diagnoseBanner: {
    backgroundColor: colors.primary,
  },
  identifyBanner: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  aiRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  aiEmoji: {
    fontSize: 28,
  },
  aiText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  aiSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  diagnoseTitle: {
    color: colors.surface,
  },
  diagnoseSubtitle: {
    color: colors.accent,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tasksHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  quickActions: {
    marginTop: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: spacing.lg,
  },
});
