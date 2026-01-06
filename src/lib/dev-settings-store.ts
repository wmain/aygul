import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TTSProvider = 'elevenlabs' | 'openai';
export type AppMode = 'development' | 'production';
export type AudioSystem = 'line-based' | 'section-based'; // NEW: Feature flag

// Languages available in development mode (with pre-bundled audio)
export const DEV_MODE_LANGUAGES = ['en', 'es', 'fr'] as const;
export type DevModeLanguage = typeof DEV_MODE_LANGUAGES[number];

// Locations available in development mode (with pre-bundled audio)
export const DEV_MODE_LOCATIONS = ['coffee_shop', 'restaurant'] as const;
export type DevModeLocation = typeof DEV_MODE_LOCATIONS[number];

interface DevSettings {
  ttsProvider: TTSProvider;
  appMode: AppMode;
  audioSystem: AudioSystem; // NEW: Choose between line-based or section-based
}

interface DevSettingsState {
  settings: DevSettings;
  setTTSProvider: (provider: TTSProvider) => void;
  setAppMode: (mode: AppMode) => void;
  setAudioSystem: (system: AudioSystem) => void; // NEW
  isDevSettingsOpen: boolean;
  openDevSettings: () => void;
  closeDevSettings: () => void;
}

const defaultSettings: DevSettings = {
  ttsProvider: 'elevenlabs',
  appMode: 'development',
  audioSystem: 'line-based', // REVERT: Use line-based (working system)
};

export const useDevSettingsStore = create<DevSettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setTTSProvider: (provider) =>
        set((state) => ({
          settings: { ...state.settings, ttsProvider: provider },
        })),
      setAppMode: (mode) =>
        set((state) => ({
          settings: { ...state.settings, appMode: mode },
        })),
      setAudioSystem: (system) =>
        set((state) => ({
          settings: { ...state.settings, audioSystem: system },
        })),
      isDevSettingsOpen: false,
      openDevSettings: () => set({ isDevSettingsOpen: true }),
      closeDevSettings: () => set({ isDevSettingsOpen: false }),
    }),
    {
      name: 'dev-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }),
      // Merge persisted state with defaults to ensure new fields have values
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DevSettingsState> | undefined;
        return {
          ...currentState,
          settings: {
            ...defaultSettings,
            ...persisted?.settings,
          },
        };
      },
    }
  )
);
