import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SubscriptionProvider } from '../src/context/SubscriptionContext';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="catalog/[id]"
          options={{ title: 'Fiche plante', presentation: 'card' }}
        />
        <Stack.Screen
          name="plant/[id]"
          options={{ title: 'Ma plante', presentation: 'card' }}
        />
        <Stack.Screen
          name="diagnose"
          options={{ title: 'Diagnostic IA', presentation: 'modal' }}
        />
        <Stack.Screen
          name="identify"
          options={{ title: 'Identifier une plante', presentation: 'modal' }}
        />
        <Stack.Screen
          name="premium"
          options={{ title: 'Premium', presentation: 'modal' }}
        />
      </Stack>
    </SubscriptionProvider>
  );
}
