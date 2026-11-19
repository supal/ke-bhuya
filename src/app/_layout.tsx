import { BalooDa2_700Bold, BalooDa2_800ExtraBold } from '@expo-google-fonts/baloo-da-2';
import {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold,
} from '@expo-google-fonts/hind-siliguri';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider, useGame } from '@/game/GameContext';
import { CharadesProvider } from '@/game/charades/CharadesContext';
import { RajaProvider } from '@/game/raja/RajaContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { ready } = useGame();
  const [fontsLoaded, fontError] = useFonts({
    BalooDa2_700Bold,
    BalooDa2_800ExtraBold,
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold,
  });
  const loaded = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="imposter/setup" />
      <Stack.Screen name="imposter/play" options={{ gestureEnabled: false }} />
      <Stack.Screen name="raja/setup" />
      <Stack.Screen name="raja/play" options={{ gestureEnabled: false }} />
      <Stack.Screen name="charades/setup" />
      <Stack.Screen name="charades/play" options={{ gestureEnabled: false }} />
      <Stack.Screen name="how-to-play" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <RajaProvider>
          <CharadesProvider>
            <StatusBar style="light" />
            <RootStack />
          </CharadesProvider>
        </RajaProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}
