import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
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
import {
  formatDateString,
  formatLocalDateLabelShort,
  getTodayDateString,
  parseLocalDate,
} from '../../src/utils/dates';
import { PlantCard } from '../../src/components/PlantCard';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing, radius } from '../../src/constants/theme';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { useAppData } from '../../src/hooks/useAppData';

type CareDateField = 'watering' | 'fertilizing' | 'repotting';

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
  const [wateringCustomDate, setWateringCustomDate] = useState<string | null>(null);
  const [fertilizingCustomDate, setFertilizingCustomDate] = useState<string | null>(null);
  const [repottingCustomDate, setRepottingCustomDate] = useState<string | null>(null);
  const [datePickerField, setDatePickerField] = useState<CareDateField | null>(null);
  const [pendingPickerDate, setPendingPickerDate] = useState<Date>(() =>
    parseLocalDate(getTodayDateString())
  );

  const customDates: Record<CareDateField, string | null> = {
    watering: wateringCustomDate,
    fertilizing: fertilizingCustomDate,
    repotting: repottingCustomDate,
  };

  const customDateSetters: Record<CareDateField, (date: string | null) => void> = {
    watering: setWateringCustomDate,
    fertilizing: setFertilizingCustomDate,
    repotting: setRepottingCustomDate,
  };

  const openDatePicker = (field: CareDateField) => {
    setPendingPickerDate(getPickerValue(field, customDates));
    setDatePickerField(field);
  };

  const confirmPickerDate = () => {
    if (!datePickerField) return;
    customDateSetters[datePickerField](formatDateString(pendingPickerDate));
    setDatePickerField(null);
  };

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

    const careHistory = buildInitialCareHistory({
      wateringPreset,
      wateringCustomDate,
      fertilizingPreset,
      fertilizingCustomDate,
      repottingPreset,
      repottingCustomDate,
    });
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
          preset={wateringPreset}
          customDate={wateringCustomDate}
          onPresetChange={(value) => {
            setWateringCustomDate(null);
            setWateringPreset(value);
          }}
          onCalendarPress={() => openDatePicker('watering')}
          onClearCustomDate={() => setWateringCustomDate(null)}
        />
        <CarePresetGroup
          label="🌱 Dernier engrais"
          options={CARE_DAYS_OPTIONS}
          preset={fertilizingPreset}
          customDate={fertilizingCustomDate}
          onPresetChange={(value) => {
            setFertilizingCustomDate(null);
            setFertilizingPreset(value);
          }}
          onCalendarPress={() => openDatePicker('fertilizing')}
          onClearCustomDate={() => setFertilizingCustomDate(null)}
        />
        <CarePresetGroup
          label="🪴 Dernier rempotage"
          options={REPOTTING_OPTIONS}
          preset={repottingPreset}
          customDate={repottingCustomDate}
          onPresetChange={(value) => {
            setRepottingCustomDate(null);
            setRepottingPreset(value);
          }}
          onCalendarPress={() => openDatePicker('repotting')}
          onClearCustomDate={() => setRepottingCustomDate(null)}
        />

        {datePickerField && (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={pendingPickerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setDatePickerField(null);
                  if (event.type === 'dismissed' || !selectedDate) return;
                  customDateSetters[datePickerField](formatDateString(selectedDate));
                  return;
                }
                if (selectedDate) setPendingPickerDate(selectedDate);
              }}
            />
            {Platform.OS === 'ios' && (
              <Button title="Valider la date" onPress={confirmPickerDate} />
            )}
          </View>
        )}

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

function getPickerValue(
  field: CareDateField,
  customDates: Record<CareDateField, string | null>
): Date {
  const customDate = customDates[field];
  if (customDate) return parseLocalDate(customDate);
  return parseLocalDate(getTodayDateString());
}

function CarePresetGroup<T extends string>({
  label,
  options,
  preset,
  customDate,
  onPresetChange,
  onCalendarPress,
  onClearCustomDate,
}: {
  label: string;
  options: { id: T; label: string }[];
  preset: T;
  customDate: string | null;
  onPresetChange: (value: T) => void;
  onCalendarPress: () => void;
  onClearCustomDate: () => void;
}) {
  return (
    <View style={styles.presetGroup}>
      <View style={styles.presetHeader}>
        <Text style={styles.presetLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.calendarButton, customDate != null && styles.calendarButtonActive]}
          onPress={onCalendarPress}
          accessibilityLabel="Choisir une date précise"
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={customDate != null ? colors.surface : colors.primary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.presetRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.presetChip,
              preset === option.id && customDate == null && styles.presetChipActive,
            ]}
            onPress={() => onPresetChange(option.id)}
          >
            <Text
              style={[
                styles.presetChipText,
                preset === option.id && customDate == null && styles.presetChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {customDate && (
        <View style={styles.customDateRow}>
          <TouchableOpacity style={[styles.presetChip, styles.presetChipActive]} onPress={onCalendarPress}>
            <Text style={[styles.presetChipText, styles.presetChipTextActive]}>
              {formatLocalDateLabelShort(customDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearDateButton} onPress={onClearCustomDate}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
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
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  calendarButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  calendarButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  clearDateButton: {
    padding: 2,
  },
  datePickerWrap: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
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
