import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCatalogPlant } from '../../src/data/plants';
import { getFertilizerAdvice } from '../../src/utils/fertilizerAdvice';
import { addUserPlant } from '../../src/services/database';
import { scheduleCareReminders } from '../../src/services/notifications';
import {
  buildInitialCareHistory,
  CARE_DAYS_OPTIONS,
  CareDaysPreset,
  REPOTTING_OPTIONS,
  RepottingPreset,
} from '../../src/utils/careHistory';
import { PlantCard } from '../../src/components/PlantCard';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/constants/theme';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { useAppData } from '../../src/hooks/useAppData';

export default function CatalogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const plant = getCatalogPlant(id!);
  const { plants } = useAppData();
  const { canAddPlant, trialExpired } = useSubscription();
  const [nickname, setNickname] = useState(plant?.name || '');
  const [location, setLocation] = useState('');
  const [wateringPreset, setWateringPreset] = useState<CareDaysPreset>('unknown');
  const [fertilizingPreset, setFertilizingPreset] = useState<CareDaysPreset>('unknown');
  const [repottingPreset, setRepottingPreset] = useState<RepottingPreset>('unknown');

  if (!plant) {
    return (
      <View style={styles.container}>
        <Text>Plante introuvable</Text>
      </View>
    );
  }

  const handleAdd = async () => {
    if (!canAddPlant(plants.length)) {
      router.push('/premium');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('Erreur', 'Donnez un surnom à votre plante.');
      return;
    }

    const careHistory = buildInitialCareHistory(
      wateringPreset,
      fertilizingPreset,
      repottingPreset
    );
    const added = addUserPlant(plant.id, nickname.trim(), location.trim(), careHistory);
    await scheduleCareReminders();
    Alert.alert('Ajoutée !', `${nickname} a rejoint votre collection.`, [
      { text: 'Voir', onPress: () => router.replace(`/plant/${added.id}`) },
      { text: 'OK' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <PlantCard plant={plant} />
        <Text style={styles.description}>{plant.description}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Besoins</Text>
      <Card>
        <InfoRow icon="💧" label="Arrosage" value={`Tous les ${plant.wateringDays} jours`} />
        <InfoRow icon="🌱" label="Engrais" value={`Tous les ${plant.fertilizingDays} jours`} />
        <AdviceRow icon="🧪" label="Engrais conseillé" value={getFertilizerAdvice(plant)} />
        <InfoRow icon="🪴" label="Rempotage" value={`Tous les ${plant.repottingMonths} mois`} />
        <InfoRow icon="☀️" label="Lumière" value={plant.light} />
        <InfoRow icon="💨" label="Humidité" value={plant.humidity} />
        <InfoRow icon="📊" label="Difficulté" value={plant.difficulty} />
      </Card>

      <Text style={styles.sectionTitle}>Ajouter à ma collection</Text>
      <Card>
        <Text style={styles.inputLabel}>Surnom</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Ex: Mon monstera du salon"
          placeholderTextColor={colors.textLight}
        />
        <Text style={styles.inputLabel}>Emplacement (optionnel)</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Ex: Salon, rebord de fenêtre"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.careSectionTitle}>Votre entretien récent</Text>
        <Text style={styles.careHint}>
          Indiquez quand vous avez arrosé, fertilisé ou rempoté pour la dernière fois. Le calendrier
          sera calculé à partir de vos réponses.
        </Text>

        <CarePresetGroup
          label="💧 Dernier arrosage"
          options={CARE_DAYS_OPTIONS}
          value={wateringPreset}
          onChange={setWateringPreset}
        />
        <CarePresetGroup
          label="🌱 Dernier engrais"
          options={CARE_DAYS_OPTIONS}
          value={fertilizingPreset}
          onChange={setFertilizingPreset}
        />
        <CarePresetGroup
          label="🪴 Dernier rempotage"
          options={REPOTTING_OPTIONS}
          value={repottingPreset}
          onChange={setRepottingPreset}
        />

        <Button title="Ajouter à mes plantes" onPress={handleAdd} />
        {!canAddPlant(plants.length) && (
          <Text style={styles.limitText}>
            {trialExpired
              ? 'Votre essai gratuit est terminé. Abonnez-vous pour ajouter des plantes.'
              : 'Abonnez-vous pour ajouter des plantes.'}
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

function CarePresetGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.presetGroup}>
      <Text style={styles.presetLabel}>{label}</Text>
      <View style={styles.presetRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.presetChip, value === option.id && styles.presetChipActive]}
            onPress={() => onChange(option.id)}
          >
            <Text style={[styles.presetChipText, value === option.id && styles.presetChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AdviceRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.adviceRow}>
      <View style={styles.adviceHeader}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.adviceValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  description: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIcon: {
    fontSize: 18,
    width: 30,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  adviceRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  adviceValue: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    paddingLeft: 30,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  limitText: {
    fontSize: 12,
    color: colors.premium,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  careSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  careHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetGroup: {
    marginBottom: spacing.sm,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: colors.surface,
  },
});
