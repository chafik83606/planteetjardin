import { File } from 'expo-file-system';

export async function imageUriToBase64(imageUri: string): Promise<string> {
  const file = new File(imageUri);
  return file.base64();
}
