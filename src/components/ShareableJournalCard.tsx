import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { JournalEntry } from '../types';

interface ShareableJournalCardProps {
  entry: JournalEntry;
  plantName?: string;
  plantEmoji?: string;
}

export const ShareableJournalCard = forwardRef<View, ShareableJournalCardProps>(
  function ShareableJournalCard({ entry, plantName, plantEmoji }, ref) {
    const date = new Date(entry.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <Text style={styles.brand}>🌱 Plante & Jardin</Text>
        <Text style={styles.title}>{entry.title}</Text>
        {plantName && (
          <Text style={styles.plant}>
            {plantEmoji || '🪴'} {plantName}
          </Text>
        )}
        {entry.photoUri && (
          <Image source={{ uri: entry.photoUri }} style={styles.photo} />
        )}
        <Text style={styles.content}>{entry.content}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    width: 340,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  plant: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  content: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  date: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
  },
});
