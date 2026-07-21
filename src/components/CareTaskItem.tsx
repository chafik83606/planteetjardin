import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';
import { CareType, CARE_LABELS } from '../types';
import { formatLocalDateLabelShort } from '../utils/dates';

const CARE_ICONS: Record<CareType, keyof typeof Ionicons.glyphMap> = {
  watering: 'water',
  repotting: 'leaf',
  fertilizing: 'nutrition',
};

const CARE_COLORS: Record<CareType, string> = {
  watering: '#4EA8DE',
  repotting: '#52B788',
  fertilizing: '#F4A261',
};

interface CareTaskItemProps {
  type: CareType;
  plantName: string;
  plantEmoji: string;
  dueDate: string;
  isOverdue?: boolean;
  onComplete?: () => void;
}

export function CareTaskItem({
  type,
  plantName,
  plantEmoji,
  dueDate,
  isOverdue,
  onComplete,
}: CareTaskItemProps) {
  const icon = CARE_ICONS[type];
  const color = CARE_COLORS[type];

  return (
    <View style={[styles.container, isOverdue && styles.overdue]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.plantName}>
          {plantEmoji} {plantName}
        </Text>
        <Text style={styles.careType}>{CARE_LABELS[type]}</Text>
        <Text style={[styles.dueDate, isOverdue && styles.dueDateOverdue]}>
          {isOverdue ? 'En retard — ' : ''}
          {formatLocalDateLabelShort(dueDate)}
        </Text>
      </View>
      {onComplete && (
        <TouchableOpacity onPress={onComplete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  overdue: {
    backgroundColor: colors.danger + '10',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  plantName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  careType: {
    fontSize: 13,
    color: colors.textMuted,
  },
  dueDate: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  dueDateOverdue: {
    color: colors.danger,
    fontWeight: '600',
  },
});
