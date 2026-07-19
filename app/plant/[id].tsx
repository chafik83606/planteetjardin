import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCatalogPlant } from '../../src/data/plants';
import { getFertilizerAdvice } from '../../src/utils/fertilizerAdvice';
import {
  getUserPlant,
  getCareTasks,
  getPlantCareIntervals,
  updatePlantPhoto,
  updatePlantCareIntervals,
} from '../../src/services/database';
import { useAppData } from '../../src/hooks/useAppData';
import { Card, Button } from '../../src/components/ui';
import { CareTaskItem } from '../../src/components/CareTaskItem';
import { ShareablePlantCard } from '../../src/components/ShareablePlantCard';
import { colors, spacing, radius } from '../../src/constants/theme';
import { showPhotoPickerOptions } from '../../src/utils/pickImage';
import { shareViewAsImage } from '../../src/utils/share';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refresh } = useAppData();
  const shareRef = useRef<View>(null);
  const [editingCare, setEditingCare] = useState(false);
  const [wateringDays, setWateringDays] = useState('');
  const [fertilizingDays, setFertilizingDays] = useState('');
  const [repottingMonths, setRepottingMonths] = useState('');

  const plant = getUserPlant(id!);
  const catalog = plant ? getCatalogPlant(plant.catalogId) : null;
  const intervals = plant ? getPlantCareIntervals(plant) : null;
  const tasks = plant ? getCareTasks(plant.id).filter((t) => !t.completed).slice(0, 3) : [];

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!plant || !catalog || !intervals) {
    return (
      <View style={styles.container}>
        <Text>Plante introuvable</Text>
      </View>
    );
  }

  const startEditingCare = () => {
    setWateringDays(String(intervals.wateringDays));
    setFertilizingDays(String(intervals.fertilizingDays));
    setRepottingMonths(String(intervals.repottingMonths));
    setEditingCare(true);
  };

  const saveCareIntervals = () => {
    const w = parseInt(wateringDays, 10);
    const f = parseInt(fertilizingDays, 10);
    const r = parseInt(repottingMonths, 10);

    if (isNaN(w) || isNaN(f) || isNaN(r) || w < 1 || f < 1 || r < 1) {
      Alert.alert('Erreur', 'Saisissez des valeurs valides (nombres positifs).');
      return;
    }

    updatePlantCareIntervals(plant.id, {
      wateringDays: w,
      fertilizingDays: f,
      repottingMonths: r,
    });
    setEditingCare(false);
    refresh();
    Alert.alert('Enregistré', 'Vos rappels personnalisés ont été mis à jour.');
  };

  const handlePhoto = () => {
    showPhotoPickerOptions((uri) => {
      updatePlantPhoto(plant.id, uri);
      refresh();
    });
  };

  const handleShare = () => {
    shareViewAsImage(shareRef, `plante-${plant.nickname}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={handlePhoto} activeOpacity={0.8} style={styles.photoWrapper}>
          {plant.photoUri ? (
            <Image source={{ uri: plant.photoUri }} style={styles.heroPhoto} />
          ) : (
            <View style={styles.heroPhotoPlaceholder}>
              <Text style={styles.heroEmoji}>{catalog.emoji}</Text>
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={16} color={colors.surface} />
          </View>
        </TouchableOpacity>
        <Text style={styles.heroName}>{plant.nickname}</Text>
        <Text style={styles.heroScientific}>{catalog.scientificName}</Text>
        {plant.location ? <Text style={styles.location}>📍 {plant.location}</Text> : null}
        <Button title="📤 Partager la fiche" variant="outline" onPress={handleShare} style={styles.shareBtn} />
      </View>

      <Text style={styles.sectionTitle}>Prochaines tâches</Text>
      {tasks.length === 0 ? (
        <Card>
          <Text style={styles.emptyTasks}>Aucune tâche planifiée</Text>
        </Card>
      ) : (
        <Card>
          {tasks.map((task) => (
            <CareTaskItem
              key={task.id}
              type={task.type}
              plantName={plant.nickname}
              plantEmoji={catalog.emoji}
              dueDate={task.dueDate}
            />
          ))}
        </Card>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleInline}>Rappels personnalisés</Text>
        {!editingCare && (
          <TouchableOpacity onPress={startEditingCare}>
            <Text style={styles.editLink}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
      <Card>
        {editingCare ? (
          <>
            <CareInput label="Arrosage (jours)" value={wateringDays} onChange={setWateringDays} />
            <CareInput label="Engrais (jours)" value={fertilizingDays} onChange={setFertilizingDays} />
            <CareInput label="Rempotage (mois)" value={repottingMonths} onChange={setRepottingMonths} />
            <View style={styles.editActions}>
              <Button title="Annuler" variant="outline" onPress={() => setEditingCare(false)} style={styles.editBtn} />
              <Button title="Enregistrer" onPress={saveCareIntervals} style={styles.editBtn} />
            </View>
          </>
        ) : (
          <>
            <SpecRow label="Arrosage" value={`Tous les ${intervals.wateringDays} jours`} />
            <SpecRow label="Engrais" value={`Tous les ${intervals.fertilizingDays} jours`} />
            <SpecRow label="Rempotage" value={`Tous les ${intervals.repottingMonths} mois`} />
            {(plant.customWateringDays != null ||
              plant.customFertilizingDays != null ||
              plant.customRepottingMonths != null) && (
              <Text style={styles.customNote}>✏️ Fréquences personnalisées</Text>
            )}
          </>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Historique</Text>
      <Card>
        <HistoryRow label="Dernier arrosage" date={plant.lastWateredAt} />
        <HistoryRow label="Dernier engrais" date={plant.lastFertilizedAt} />
        <HistoryRow label="Dernier rempotage" date={plant.lastRepottedAt} />
        <HistoryRow label="Acquise le" date={plant.acquiredAt} />
      </Card>

      <Text style={styles.sectionTitle}>Fiche catalogue</Text>
      <Card>
        <SpecRow label="Lumière" value={catalog.light} />
        <SpecRow label="Humidité" value={catalog.humidity} />
        <SpecRow label="Engrais conseillé" value={getFertilizerAdvice(catalog)} />
        <SpecRow label="Difficulté" value={catalog.difficulty} />
      </Card>

      {plant.notes ? (
        <>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Card>
            <Text style={styles.notes}>{plant.notes}</Text>
          </Card>
        </>
      ) : null}

      <View style={styles.offscreen} pointerEvents="none">
        <ShareablePlantCard
          ref={shareRef}
          plant={plant}
          catalog={catalog}
          wateringDays={intervals.wateringDays}
        />
      </View>
    </ScrollView>
  );
}

function CareInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.careInput}>
      <Text style={styles.careLabel}>{label}</Text>
      <TextInput
        style={styles.careField}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
      />
    </View>
  );
}

function HistoryRow({ label, date }: { label: string; date: string | null }) {
  return (
    <View style={styles.historyRow}>
      <Text style={styles.historyLabel}>{label}</Text>
      <Text style={styles.historyDate}>
        {date
          ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'Jamais'}
      </Text>
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
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
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  photoWrapper: {
    position: 'relative',
  },
  heroPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  heroPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  heroEmoji: {
    fontSize: 56,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  heroScientific: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  location: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  shareBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyTasks: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  careInput: {
    marginBottom: spacing.md,
  },
  careLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  careField: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editBtn: {
    flex: 1,
  },
  customNote: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  notes: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
