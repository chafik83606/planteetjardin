import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  identifyPlantFromPhoto,
  isRealAIEnabled,
  getCategoryLabel,
} from '../src/services/identification';
import { getCatalogPlant } from '../src/data/plants';
import { IdentificationResult } from '../src/types';
import { Card, Button, Badge } from '../src/components/ui';
import { colors, spacing, radius } from '../src/constants/theme';
import { useSubscription } from '../src/context/SubscriptionContext';

export default function IdentifyScreen() {
  const router = useRouter();
  const { canUseDiagnosis } = useSubscription();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);

  const pickImage = async (useCamera: boolean) => {
    if (!canUseDiagnosis()) {
      router.push('/premium');
      return;
    }

    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra ou à la galerie.');
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const runIdentification = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      const identification = await identifyPlantFromPhoto(imageUri);
      setResult(identification);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'L\'identification a échoué. Réessayez plus tard.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const catalog = result?.catalogId ? getCatalogPlant(result.catalogId) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Photographiez une plante inconnue pour découvrir son espèce et accéder à sa fiche d'entretien.
      </Text>

      {!isRealAIEnabled() && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>
            Mode démo — Ajoutez EXPO_PUBLIC_OPENAI_API_KEY pour activer l'IA réelle
          </Text>
        </View>
      )}

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🌿</Text>
          <Text style={styles.placeholderText}>Aucune photo sélectionnée</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button title="📷 Prendre une photo" onPress={() => pickImage(true)} style={styles.actionBtn} />
        <Button
          title="🖼️ Galerie"
          variant="outline"
          onPress={() => pickImage(false)}
          style={styles.actionBtn}
        />
      </View>

      {imageUri && !result && (
        <Button
          title={loading ? 'Analyse en cours...' : '🔍 Identifier cette plante'}
          onPress={runIdentification}
          disabled={loading}
        />
      )}

      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {result && (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>{catalog?.emoji || '🌱'}</Text>
            <View style={styles.resultTitles}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultScientific}>{result.scientificName}</Text>
            </View>
          </View>

          <Text style={styles.confidence}>
            Confiance : {Math.round(result.confidence * 100)}%
          </Text>

          {result.category && (
            <Badge label={getCategoryLabel(result.category)} color={colors.primary} />
          )}

          <Text style={styles.resultDescription}>{result.description}</Text>

          {result.catalogId && catalog ? (
            <Button
              title={`📖 Voir la fiche ${catalog.name}`}
              onPress={() => router.push(`/catalog/${result.catalogId}`)}
              style={styles.catalogBtn}
            />
          ) : (
            <Text style={styles.noCatalog}>
              Cette plante n'est pas encore dans notre catalogue. Consultez l'onglet Catalogue pour des espèces similaires.
            </Text>
          )}

          <Button
            title="Nouvelle identification"
            variant="outline"
            onPress={() => {
              setImageUri(null);
              setResult(null);
            }}
            style={styles.resetBtn}
          />
        </Card>
      )}
    </ScrollView>
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
  intro: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  demoBanner: {
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  demoText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  placeholder: {
    height: 200,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderText: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  resultCard: {
    marginTop: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  resultEmoji: {
    fontSize: 48,
  },
  resultTitles: {
    flex: 1,
  },
  resultName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  resultScientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 2,
  },
  confidence: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  resultDescription: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  catalogBtn: {
    marginBottom: spacing.sm,
  },
  noCatalog: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: spacing.sm,
  },
});
