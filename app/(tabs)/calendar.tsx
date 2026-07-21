import React, { useCallback } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppData } from '../../src/hooks/useAppData';
import { getCatalogPlant } from '../../src/data/plants';
import { getUserPlant, completeCareTask } from '../../src/services/database';
import { scheduleCareReminders } from '../../src/services/notifications';
import { Card, EmptyState } from '../../src/components/ui';
import { CareTaskItem } from '../../src/components/CareTaskItem';
import { colors, spacing } from '../../src/constants/theme';
import { CareTask } from '../../src/types';
import { formatLocalDateLabel, getTodayDateString } from '../../src/utils/dates';

function groupTasksByDate(tasks: CareTask[]) {
  const groups: Record<string, CareTask[]> = {};
  for (const task of tasks) {
    const key = task.dueDate;
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      title: formatLocalDateLabel(date),
      date,
      data,
    }));
}

export default function CalendarScreen() {
  const { upcomingTasks, overdueTasks, refresh } = useAppData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const allTasks = [...overdueTasks, ...upcomingTasks].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );
  const sections = groupTasksByDate(allTasks);

  const handleComplete = async (taskId: string) => {
    completeCareTask(taskId);
    await scheduleCareReminders();
    refresh();
  };

  if (allTasks.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="📅"
          title="Calendrier vide"
          subtitle="Ajoutez des plantes pour générer automatiquement votre calendrier d'entretien."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {overdueTasks.length > 0 && (
        <View style={styles.overdueBanner}>
          <Text style={styles.overdueText}>
            ⚠️ {overdueTasks.length} tâche{overdueTasks.length > 1 ? 's' : ''} en retard
          </Text>
        </View>
      )}

      <Text style={styles.hint}>
        Les dates sont calculées à partir de l'ajout de la plante. Cochez une tâche après l'avoir
        faite pour recalculer le prochain rappel.
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              styles.sectionHeader,
              section.date < getTodayDateString() && styles.sectionHeaderOverdue,
            ]}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const plant = getUserPlant(item.plantId);
          const catalog = plant ? getCatalogPlant(plant.catalogId) : null;
          const isOverdue = overdueTasks.some((t) => t.id === item.id);

          return (
            <Card style={styles.taskCard}>
              <CareTaskItem
                type={item.type}
                plantName={plant?.nickname || catalog?.name || 'Plante'}
                plantEmoji={catalog?.emoji || '🌱'}
                dueDate={item.dueDate}
                isOverdue={isOverdue}
                onComplete={() => handleComplete(item.id)}
              />
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overdueBanner: {
    backgroundColor: colors.danger + '15',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger + '30',
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  list: {
    padding: spacing.md,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  sectionHeaderOverdue: {
    color: colors.danger,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
});
