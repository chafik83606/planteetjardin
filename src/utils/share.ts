import { RefObject } from 'react';
import { Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareViewAsImage(
  viewRef: RefObject<unknown>,
  filename: string
): Promise<void> {
  try {
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Partage indisponible', 'Le partage n\'est pas supporté sur cet appareil.');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: filename,
      UTI: 'public.png',
    });
  } catch {
    Alert.alert('Erreur', 'Impossible de partager l\'image.');
  }
}
