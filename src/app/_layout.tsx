import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useShakeDetector } from '@/lib/use-shake-detector';
import { useDevSettingsStore } from '@/lib/dev-settings-store';
import { DevSettingsModal } from '@/components/DevSettingsModal';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const openDevSettings = useDevSettingsStore((s) => s.openDevSettings);

  // Shake device to open dev settings
  useShakeDetector({
    onShake: openDevSettings,
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="playback" />
      </Stack>
      <DevSettingsModal />
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <RootLayoutNav colorScheme={colorScheme} />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}