import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { Check, Zap, RotateCcw, Volume2, X, Code, Rocket } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useDevSettingsStore, type TTSProvider, type AppMode } from '@/lib/dev-settings-store';
import { useDialogueStore } from '@/lib/dialogue-store';
import { useRouter } from 'expo-router';
import { cn } from '@/lib/cn';

const MODE_OPTIONS: { value: AppMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'development',
    label: 'Development',
    description: 'Pre-bundled audio, limited languages (EN/ES/FR)',
    icon: <Code size={16} color="#0EA5E9" />,
  },
  {
    value: 'production',
    label: 'Production',
    description: 'Real API calls, all languages available',
    icon: <Rocket size={16} color="#10B981" />,
  },
];

const TTS_OPTIONS: { value: TTSProvider; label: string; description: string }[] = [
  {
    value: 'elevenlabs',
    label: 'ElevenLabs',
    description: 'Higher quality, better emotions & accents',
  },
  {
    value: 'openai',
    label: 'OpenAI TTS',
    description: 'Lower cost, good quality',
  },
];

export function DevSettingsModal() {
  const router = useRouter();
  const isOpen = useDevSettingsStore((s) => s.isDevSettingsOpen);
  const closeDevSettings = useDevSettingsStore((s) => s.closeDevSettings);
  const ttsProvider = useDevSettingsStore((s) => s.settings.ttsProvider);
  const setTTSProvider = useDevSettingsStore((s) => s.setTTSProvider);
  const appMode = useDevSettingsStore((s) => s.settings.appMode);
  const setAppMode = useDevSettingsStore((s) => s.setAppMode);

  const cachedLesson = useDialogueStore((s) => s.cachedLesson);
  const setDialogue = useDialogueStore((s) => s.setDialogue);

  const handleSelectMode = (mode: AppMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppMode(mode);
  };

  const handleSelectProvider = (provider: TTSProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTTSProvider(provider);
  };

  const handleReplayLastLesson = () => {
    if (cachedLesson) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDialogue(cachedLesson);
      closeDevSettings();
      router.push('/playback');
    }
  };

  const handleQuickMockLesson = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeDevSettings();
    router.push('/playback?mock=instant');
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={closeDevSettings}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
              <View className="w-8" />
              <View className="items-center">
                <Text className="text-lg font-semibold text-slate-800">
                  Dev Settings
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {Platform.OS === 'web' ? 'Press D to open' : 'Triple-tap header to open'}
                </Text>
              </View>
              <Pressable
                onPress={closeDevSettings}
                className="w-8 h-8 items-center justify-center"
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView className="max-h-[70%]">
              {/* App Mode Section */}
              <View className="p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-full bg-sky-100 items-center justify-center mr-2">
                    <Code size={16} color="#0EA5E9" />
                  </View>
                  <Text className="text-base font-semibold text-slate-800">
                    App Mode
                  </Text>
                </View>

                <View className="gap-2">
                  {MODE_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelectMode(option.value)}
                      className={cn(
                        'flex-row items-center p-4 rounded-xl border',
                        appMode === option.value
                          ? option.value === 'development'
                            ? 'bg-sky-50 border-sky-300'
                            : 'bg-emerald-50 border-emerald-300'
                          : 'bg-slate-50 border-slate-200'
                      )}
                    >
                      <View
                        className={cn(
                          'w-8 h-8 rounded-full items-center justify-center mr-3',
                          appMode === option.value
                            ? option.value === 'development'
                              ? 'bg-sky-100'
                              : 'bg-emerald-100'
                            : 'bg-slate-100'
                        )}
                      >
                        {option.icon}
                      </View>
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'font-semibold',
                            appMode === option.value
                              ? option.value === 'development'
                                ? 'text-sky-700'
                                : 'text-emerald-700'
                              : 'text-slate-700'
                          )}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {option.description}
                        </Text>
                      </View>
                      {appMode === option.value && (
                        <Check
                          size={20}
                          color={option.value === 'development' ? '#0EA5E9' : '#10B981'}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Divider */}
              <View className="h-2 bg-slate-100" />

              {/* TTS Provider Section - Available in both modes */}
              <View className="p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-full bg-violet-100 items-center justify-center mr-2">
                    <Volume2 size={16} color="#7C3AED" />
                  </View>
                  <Text className="text-base font-semibold text-slate-800">
                    TTS Provider
                  </Text>
                </View>

                <View className="gap-2">
                  {TTS_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelectProvider(option.value)}
                      className={cn(
                        'flex-row items-center p-4 rounded-xl border',
                        ttsProvider === option.value
                          ? 'bg-violet-50 border-violet-300'
                          : 'bg-slate-50 border-slate-200'
                      )}
                    >
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'font-semibold',
                            ttsProvider === option.value
                              ? 'text-violet-700'
                              : 'text-slate-700'
                          )}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {option.description}
                        </Text>
                      </View>
                      {ttsProvider === option.value && (
                        <Check size={20} color="#7C3AED" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Divider */}
              <View className="h-2 bg-slate-100" />

              {/* Quick Actions Section */}
              <View className="p-4">
                <Text className="text-base font-semibold text-slate-800 mb-3">
                  Quick Actions
                </Text>

                <View className="gap-3">
                  {/* Replay Last Lesson */}
                  <Pressable
                    onPress={handleReplayLastLesson}
                    disabled={!cachedLesson}
                    className={cn(
                      'flex-row items-center p-4 rounded-xl border',
                      cachedLesson
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 opacity-50'
                    )}
                  >
                    <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                      <RotateCcw size={20} color="#059669" />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={cn(
                          'font-semibold',
                          cachedLesson ? 'text-emerald-700' : 'text-slate-400'
                        )}
                      >
                        Replay Last Lesson
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {cachedLesson
                          ? `${cachedLesson.lines.length} lines cached`
                          : 'No cached lesson available'}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Quick Mock Lesson */}
                  <Pressable
                    onPress={handleQuickMockLesson}
                    className="flex-row items-center p-4 rounded-xl border bg-amber-50 border-amber-200"
                  >
                    <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                      <Zap size={20} color="#D97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-amber-700">
                        Instant Mock Lesson
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        Skip generation, use mock data instantly
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Close Button */}
            <View className="p-4 pb-8">
              <Pressable
                onPress={closeDevSettings}
                className="bg-slate-100 py-3 rounded-xl"
              >
                <Text className="text-slate-600 font-semibold text-center">
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
