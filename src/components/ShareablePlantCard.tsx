import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { CatalogPlant } from '../types';
import { UserPlant } from '../types';

interface ShareablePlantCardProps {
  plant: UserPlant;
  catalog: CatalogPlant;
  wateringDays: number;
}

export const ShareablePlantCard = forwardRef<View, ShareablePlantCardProps>(
  function ShareablePlantCard({ plant, catalog, wateringDays }, ref) {
    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <Text style={styles.brand}>🌱 Plante & Jardin</Text>
        {plant.photoUri ? (
          <Image source={{ uri: plant.photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.emoji}>{catalog.emoji}</Text>
        )}
        <Text style={styles.name}>{plant.nickname}</Text>
        <Text style={styles.scientific}>{catalog.scientificName}</Text>
        {plant.location ? <Text style={styles.location}>📍 {plant.location}</Text> : null}
        <View style={styles.specs}>
          <Text style={styles.spec}>💧 Arrosage : tous les {wateringDays} jours</Text>
          <Text style={styles.spec}>☀️ {catalog.light}</Text>
          <Text style={styles.spec}>📊 Difficulté : {catalog.difficulty}</Text>
        </View>
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
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  scientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  specs: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  spec: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
