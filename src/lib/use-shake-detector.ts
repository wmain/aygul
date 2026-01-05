import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

const SHAKE_THRESHOLD = 1.8; // Acceleration threshold for shake detection
const SHAKE_TIMEOUT = 500; // Minimum time between shakes in ms

interface UseShakeDetectorOptions {
  onShake: () => void;
  enabled?: boolean;
}

export function useShakeDetector({ onShake, enabled = true }: UseShakeDetectorOptions) {
  const lastShakeTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // On web, listen for 'D' key press instead of shake
    if (Platform.OS === 'web') {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Press 'D' to open dev settings (only when not typing in an input)
        if (
          event.key.toLowerCase() === 'd' &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          const now = Date.now();
          if (now - lastShakeTime.current > SHAKE_TIMEOUT) {
            lastShakeTime.current = now;
            onShake();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }

    // On native, use accelerometer for shake detection
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const startListening = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('Accelerometer not available');
        return;
      }

      // Set update interval to 100ms
      Accelerometer.setUpdateInterval(100);

      subscription = Accelerometer.addListener((data) => {
        const { x, y, z } = data;

        // Calculate total acceleration magnitude
        const acceleration = Math.sqrt(x * x + y * y + z * z);

        // Check if acceleration exceeds threshold (accounting for gravity ~1g)
        if (acceleration > SHAKE_THRESHOLD) {
          const now = Date.now();

          // Debounce shakes
          if (now - lastShakeTime.current > SHAKE_TIMEOUT) {
            lastShakeTime.current = now;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onShake();
          }
        }
      });
    };

    startListening();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [onShake, enabled]);
}
