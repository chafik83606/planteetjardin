import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogPlant } from '../types';
import { CATEGORY_LABELS } from '../types';
import { colors, spacing } from '../constants/theme';
import { Badge } from './ui';

interface PlantCardProps {
  plant: CatalogPlant;
  compact?: boolean;
}

export function PlantCard({ plant, compact }: PlantCardProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={styles.emoji}>{plant.emoji}</Text>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {plant.name}
        </Text>
        <Text style={styles.scientific} numberOfLines={1}>
          {plant.scientificName}
        </Text>
        {!compact && (
          <View style={styles.badges}>
            <Badge label={CATEGORY_LABELS[plant.category]} />
            <Badge label={plant.difficulty} color={colors.textMuted} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  compact: {
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 36,
    width: 48,
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
