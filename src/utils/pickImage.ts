import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickPlantPhoto(useCamera: boolean): Promise<string | null> {
  const permission = useCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra ou à la galerie.');
    return null;
  }

  const result = useCamera
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

export function showPhotoPickerOptions(
  onPick: (uri: string) => void
): void {
  Alert.alert('Ajouter une photo', 'Choisissez une source', [
    {
      text: 'Caméra',
      onPress: async () => {
        const uri = await pickPlantPhoto(true);
        if (uri) onPick(uri);
      },
    },
    {
      text: 'Galerie',
      onPress: async () => {
        const uri = await pickPlantPhoto(false);
        if (uri) onPick(uri);
      },
    },
    { text: 'Annuler', style: 'cancel' },
  ]);
}
