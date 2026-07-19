import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isAfter, subDays } from 'date-fns';
import { useAppData } from '../../src/hooks/useAppData';
import { addJournalEntry, deleteJournalEntry } from '../../src/services/database';
import { getCatalogPlant } from '../../src/data/plants';
import { Card, Button, EmptyState } from '../../src/components/ui';
import { ShareableJournalCard } from '../../src/components/ShareableJournalCard';
import { colors, spacing, radius } from '../../src/constants/theme';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { showPhotoPickerOptions } from '../../src/utils/pickImage';
import { shareViewAsImage } from '../../src/utils/share';
import { JournalEntry } from '../../src/types';

type DateFilter = 'all' | 'week' | 'month';

export default function JournalScreen() {
  const router = useRouter();
  const { journalEntries, plants, refresh } = useAppData();
  const { canAddJournalEntry, journalLimit, isPremium } = useSubscription();
  const shareRef = useRef<View>(null);
  const [sharingEntry, setSharingEntry] = useState<JournalEntry | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [plantFilter, setPlantFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredEntries = useMemo(() => {
    const now = new Date();
    return journalEntries.filter((entry) => {
      const matchesSearch =
        !search.trim() ||
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.content.toLowerCase().includes(search.toLowerCase());

      const matchesPlant =
        plantFilter === 'all' || entry.plantId === plantFilter;

      const entryDate = new Date(entry.createdAt);
      let matchesDate = true;
      if (dateFilter === 'week') {
        matchesDate = isAfter(entryDate, subDays(now, 7));
      } else if (dateFilter === 'month') {
        matchesDate = isAfter(entryDate, subDays(now, 30));
      }

      return matchesSearch && matchesPlant && matchesDate;
    });
  }, [journalEntries, search, plantFilter, dateFilter]);

  const resetModal = () => {
    setTitle('');
    setContent('');
    setPhotoUri(null);
    setSelectedPlantId(null);
    setModalVisible(false);
  };

  const handleAdd = () => {
    if (!canAddJournalEntry(journalEntries.length)) {
      router.push('/premium');
      return;
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre.');
      return;
    }
    addJournalEntry(title.trim(), content.trim(), selectedPlantId, photoUri);
    resetModal();
    refresh();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette entrée ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteJournalEntry(id);
          refresh();
        },
      },
    ]);
  };

  const handleShare = async (entry: JournalEntry) => {
    setSharingEntry(entry);
    setTimeout(async () => {
      await shareViewAsImage(shareRef, `journal-${entry.title}`);
      setSharingEntry(null);
    }, 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.counter}>
          {journalEntries.length}
          {!isPremium && ` / ${journalLimit}`} entrée{journalEntries.length > 1 ? 's' : ''}
        </Text>
        <Button title="+ Nouvelle entrée" onPress={handleAdd} style={styles.addBtn} />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Rechercher dans le journal..."
        placeholderTextColor={colors.textLight}
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {(['all', 'week', 'month'] as DateFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, dateFilter === f && styles.chipActive]}
            onPress={() => setDateFilter(f)}
          >
            <Text style={[styles.chipText, dateFilter === f && styles.chipTextActive]}>
              {f === 'all' ? 'Toutes dates' : f === 'week' ? '7 jours' : '30 jours'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, plantFilter === 'all' && styles.chipActive]}
          onPress={() => setPlantFilter('all')}
        >
          <Text style={[styles.chipText, plantFilter === 'all' && styles.chipTextActive]}>
            Toutes plantes
          </Text>
        </TouchableOpacity>
        {plants.map((p) => {
          const catalog = getCatalogPlant(p.catalogId);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, plantFilter === p.id && styles.chipActive]}
              onPress={() => setPlantFilter(p.id)}
            >
              <Text style={[styles.chipText, plantFilter === p.id && styles.chipTextActive]}>
                {catalog?.emoji} {p.nickname}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {journalEntries.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="Journal vide"
          subtitle="Notez l'évolution de vos plantes, vos observations et vos réussites."
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Aucun résultat"
          subtitle="Essayez d'autres filtres ou termes de recherche."
        />
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const plant = item.plantId ? plants.find((p) => p.id === item.plantId) : null;
            const catalog = plant ? getCatalogPlant(plant.catalogId) : null;

            return (
              <Card style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{item.title}</Text>
                  <View style={styles.entryActions}>
                    <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionIcon}>
                      <Ionicons name="share-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {plant && (
                  <Text style={styles.plantRef}>
                    {catalog?.emoji} {plant.nickname}
                  </Text>
                )}
                {item.photoUri && (
                  <Image source={{ uri: item.photoUri }} style={styles.entryPhoto} />
                )}
                <Text style={styles.entryContent}>{item.content}</Text>
                <Text style={styles.entryDate}>
                  {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </Card>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouvelle entrée</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre"
                placeholderTextColor={colors.textLight}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Vos observations..."
                placeholderTextColor={colors.textLight}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Plante associée (optionnel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plantPicker}>
                <TouchableOpacity
                  style={[styles.plantChip, !selectedPlantId && styles.plantChipActive]}
                  onPress={() => setSelectedPlantId(null)}
                >
                  <Text style={styles.plantChipText}>Aucune</Text>
                </TouchableOpacity>
                {plants.map((p) => {
                  const catalog = getCatalogPlant(p.catalogId);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.plantChip, selectedPlantId === p.id && styles.plantChipActive]}
                      onPress={() => setSelectedPlantId(p.id)}
                    >
                      <Text style={styles.plantChipText}>
                        {catalog?.emoji} {p.nickname}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => showPhotoPickerOptions((uri) => setPhotoUri(uri))}
              >
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={styles.photoBtnText}>
                  {photoUri ? 'Changer la photo' : 'Ajouter une photo'}
                </Text>
              </TouchableOpacity>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.modalPhoto} />
              )}

              <View style={styles.modalActions}>
                <Button title="Annuler" variant="outline" onPress={resetModal} style={styles.modalBtn} />
                <Button title="Enregistrer" onPress={handleSave} style={styles.modalBtn} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {sharingEntry && (
        <View style={styles.offscreen} pointerEvents="none">
          <ShareableJournalCard
            ref={shareRef}
            entry={sharingEntry}
            plantName={
              sharingEntry.plantId
                ? plants.find((p) => p.id === sharingEntry.plantId)?.nickname
                : undefined
            }
            plantEmoji={
              sharingEntry.plantId
                ? getCatalogPlant(
                    plants.find((p) => p.id === sharingEntry.plantId)?.catalogId || ''
                  )?.emoji
                : undefined
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: 0,
  },
  counter: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  addBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    height: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.surface,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  entryCard: {
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    padding: 4,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  plantRef: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  entryPhoto: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  entryContent: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  entryDate: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 100,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  plantPicker: {
    marginBottom: spacing.md,
    maxHeight: 40,
  },
  plantChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  plantChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  plantChipText: {
    fontSize: 13,
    color: colors.text,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  modalPhoto: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtn: {
    flex: 1,
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
