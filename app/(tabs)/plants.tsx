import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppData } from '../../src/hooks/useAppData';
import { getCatalogPlant } from '../../src/data/plants';
import { deleteUserPlant } from '../../src/services/database';
import { Card, EmptyState } from '../../src/components/ui';
import { colors, spacing } from '../../src/constants/theme';
import { useSubscription } from '../../src/context/SubscriptionContext';

export default function PlantsScreen() {
  const router = useRouter();
  const { plants, refresh } = useAppData();
  const { plantLimit, isPremium } = useSubscription();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Supprimer', `Retirer "${name}" de votre collection ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteUserPlant(id);
          refresh();
        },
      },
    ]);
  };

  if (plants.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🪴"
          title="Aucune plante"
          subtitle="Parcourez le catalogue pour ajouter vos premières plantes et recevoir des rappels d'entretien."
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/catalog')}
        >
          <Text style={styles.addButtonText}>Parcourir le catalogue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>
        {plants.length}
        {!isPremium && ` / ${plantLimit}`} plante{plants.length > 1 ? 's' : ''}
      </Text>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const catalog = getCatalogPlant(item.catalogId);
          return (
            <Card
              style={styles.plantCard}
              onPress={() => router.push(`/plant/${item.id}`)}
            >
              <View style={styles.plantRow}>
                {item.photoUri ? (
                  <Image source={{ uri: item.photoUri }} style={styles.photo} />
                ) : (
                  <Text style={styles.emoji}>{catalog?.emoji || '🌱'}</Text>
                )}
                <View style={styles.plantInfo}>
                  <Text style={styles.nickname}>{item.nickname}</Text>
                  <Text style={styles.catalogName}>{catalog?.name}</Text>
                  {item.location ? (
                    <Text style={styles.location}>📍 {item.location}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.nickname)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
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
  counter: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  plantCard: {
    marginBottom: spacing.sm,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 40,
    width: 48,
    textAlign: 'center',
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  plantInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  catalogName: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  location: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
