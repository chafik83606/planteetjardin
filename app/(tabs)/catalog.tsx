import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PLANT_CATALOG } from '../../src/data/plants';
import { PlantCard } from '../../src/components/PlantCard';
import { Card } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/constants/theme';
import { CatalogPlant, PlantCategory, CATEGORY_LABELS } from '../../src/types';

const CATEGORIES: (PlantCategory | 'all')[] = ['all', 'interior', 'succulent', 'herb', 'exterior'];

/** Correspondance sur le début d'un mot (évite « rose » → Petroselinum / Persil). */
function plantMatchesQuery(plant: CatalogPlant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fields = [plant.name, plant.scientificName, ...(plant.aliases ?? [])];
  return fields.some((field) => {
    const words = field.toLowerCase().split(/[\s\-×/',.()]+/).filter(Boolean);
    return words.some((word) => word.startsWith(q) || q.startsWith(word));
  });
}

export default function CatalogScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PlantCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return PLANT_CATALOG.filter((plant) => {
      const matchesSearch = plantMatchesQuery(plant, search);
      const matchesCategory = category === 'all' || plant.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Rechercher une plante..."
        placeholderTextColor={colors.textLight}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, category === item && styles.filterChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>
              {item === 'all' ? 'Toutes' : CATEGORY_LABELS[item]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => router.push(`/catalog/${item.id}`)}>
            <PlantCard plant={item} />
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>💧 {item.wateringDays}j</Text>
              <Text style={styles.metaText}>🌿 {item.difficulty}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune plante trouvée</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  search: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filters: {
    maxHeight: 44,
    marginBottom: spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.surface,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
