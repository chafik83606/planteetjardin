import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCatalogPlant } from '../../src/data/plants';
import { getFertilizerAdvice } from '../../src/utils/fertilizerAdvice';
import { addUserPlant } from '../../src/services/database';
import { scheduleCareReminders } from '../../src/services/notifications';
import { PlantCard } from '../../src/components/PlantCard';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing } from '../../src/constants/theme';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { useAppData } from '../../src/hooks/useAppData';

export default function CatalogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const plant = getCatalogPlant(id!);
  const { plants } = useAppData();
  const { canAddPlant, plantLimit } = useSubscription();
  const [nickname, setNickname] = useState(plant?.name || '');
  const [location, setLocation] = useState('');

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

    const added = addUserPlant(plant.id, nickname.trim(), location.trim());
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
        <Button title="Ajouter à mes plantes" onPress={handleAdd} />
        {!canAddPlant(plants.length) && (
          <Text style={styles.limitText}>
            Limite gratuite atteinte ({plantLimit} plantes). Passez Premium pour en ajouter plus.
          </Text>
        )}
      </Card>
    </ScrollView>
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
});
