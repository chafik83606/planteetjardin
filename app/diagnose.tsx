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
import { diagnosePlantFromPhoto, isRealAIEnabled } from '../src/services/diagnosis';
import { DiagnosisResult } from '../src/types';
import { Card, Button, Badge } from '../src/components/ui';
import { colors, spacing, radius } from '../src/constants/theme';
import { useSubscription } from '../src/context/SubscriptionContext';

const SEVERITY_COLORS: Record<DiagnosisResult['severity'], string> = {
  faible: colors.success,
  modérée: colors.warning,
  élevée: colors.danger,
};

export default function DiagnoseScreen() {
  const router = useRouter();
  const { canUseDiagnosis } = useSubscription();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

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

  const runDiagnosis = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      const diagnosis = await diagnosePlantFromPhoto(imageUri);
      setResult(diagnosis);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Le diagnostic a échoué. Réessayez plus tard.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Prenez une photo de votre plante pour détecter d'éventuelles maladies ou carences.
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
          <Text style={styles.placeholderEmoji}>📷</Text>
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
          title={loading ? 'Analyse en cours...' : '🔍 Lancer le diagnostic'}
          onPress={runDiagnosis}
          disabled={loading}
        />
      )}

      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {result && (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCondition}>{result.condition}</Text>
            <Badge
              label={result.severity}
              color={SEVERITY_COLORS[result.severity]}
            />
          </View>
          <Text style={styles.confidence}>
            Confiance : {Math.round(result.confidence * 100)}%
          </Text>
          <Text style={styles.resultDescription}>{result.description}</Text>

          <Text style={styles.recommendTitle}>Recommandations</Text>
          {result.recommendations.map((rec: string, i: number) => (
            <Text key={i} style={styles.recommendation}>
              • {rec}
            </Text>
          ))}

          <Button
            title="Nouvelle analyse"
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultCondition: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  confidence: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  resultDescription: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recommendation: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  resetBtn: {
    marginTop: spacing.md,
  },
});
