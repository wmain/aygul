import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  MapPin,
  ChevronRight,
  ChevronDown,
  Check,
  Users,
  Globe,
  Gauge,
  Layout,
  BookOpen,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useDialogueStore } from '@/lib/dialogue-store';
import { useDevSettingsStore, DEV_MODE_LANGUAGES, DEV_MODE_LOCATIONS } from '@/lib/dev-settings-store';
import LessonBuilder from '@/components/LessonBuilder';
import {
  LOCATIONS,
  DIFFICULTIES,
  CHARACTER_ROLES,
  LANGUAGES,
  LESSON_FORMATS,
  type Location,
  type Difficulty,
  type Character,
  type LessonFormat,
  type LessonSegment,
  type LessonSegmentType,
  type QuizConfig,
} from '@/lib/types';

interface DropdownProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; description?: string }[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  iconBgColor?: string;
  compact?: boolean;
}

function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  icon,
  iconBgColor,
  compact = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (newValue: T) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(newValue);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <View className="flex-1">
        <Text className="text-xs text-slate-500 mb-1">{label}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsOpen(true);
          }}
          className="flex-row items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-slate-200"
        >
          <Text className="text-slate-800 text-sm font-medium flex-1 mr-2" numberOfLines={1}>
            {selectedOption?.label || 'Select...'}
          </Text>
          <ChevronDown size={16} color="#64748B" />
        </Pressable>

        <Modal visible={isOpen} transparent animationType="fade">
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setIsOpen(false)}
          >
            <View className="bg-white rounded-t-3xl max-h-[70%]">
              <View className="p-4 border-b border-slate-100">
                <Text className="text-lg font-semibold text-slate-800 text-center">{label}</Text>
              </View>
              <ScrollView className="p-2" showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className={cn(
                      'flex-row items-center justify-between p-4 rounded-xl mx-2 mb-1',
                      value === option.value ? 'bg-cyan-50' : 'bg-white'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-base font-medium flex-1',
                        value === option.value ? 'text-cyan-700' : 'text-slate-800'
                      )}
                    >
                      {option.label}
                    </Text>
                    {value === option.value && <Check size={20} color="#0891B2" />}
                  </Pressable>
                ))}
              </ScrollView>
              <View className="p-4 pb-8">
                <Pressable
                  onPress={() => setIsOpen(false)}
                  className="bg-slate-100 py-3 rounded-xl"
                >
                  <Text className="text-slate-600 font-semibold text-center">Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return (
    <View className="p-5 border-b border-slate-100">
      <View className="flex-row items-center mb-3">
        {icon && iconBgColor && (
          <View className={cn('w-8 h-8 rounded-full items-center justify-center mr-3', iconBgColor)}>
            {icon}
          </View>
        )}
        <Text className="text-lg font-semibold text-slate-800">{label}</Text>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(true);
        }}
        className="flex-row items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200"
      >
        <View className="flex-1 mr-3">
          <Text className="text-slate-800 text-base font-medium">
            {selectedOption?.label || 'Select...'}
          </Text>
          {selectedOption?.description && (
            <Text className="text-sm text-slate-500 mt-0.5">{selectedOption.description}</Text>
          )}
        </View>
        <ChevronDown size={20} color="#64748B" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="p-4 border-b border-slate-100">
              <Text className="text-lg font-semibold text-slate-800 text-center">{label}</Text>
            </View>
            <ScrollView className="p-2" showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  className={cn(
                    'flex-row items-center justify-between p-4 rounded-xl mx-2 mb-1',
                    value === option.value ? 'bg-cyan-50' : 'bg-white'
                  )}
                >
                  <View className="flex-1 mr-3">
                    <Text
                      className={cn(
                        'text-base font-medium',
                        value === option.value ? 'text-cyan-700' : 'text-slate-800'
                      )}
                    >
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text className="text-sm text-slate-500 mt-0.5">{option.description}</Text>
                    )}
                  </View>
                  {value === option.value && <Check size={20} color="#0891B2" />}
                </Pressable>
              ))}
            </ScrollView>
            <View className="p-4 pb-8">
              <Pressable
                onPress={() => setIsOpen(false)}
                className="bg-slate-100 py-3 rounded-xl"
              >
                <Text className="text-slate-600 font-semibold text-center">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Helper to create dropdown label from character
function formatCharacterLabel(char: Character): string {
  return `${char.role} (${char.name})`;
}

// Filter complementary roles based on "You" selection
function getComplementaryRoles(location: Location, youRole: string): Character[] {
  const allThem = CHARACTER_ROLES[location].them;
  // Filter out the same role as "You" to encourage different perspectives
  return allThem.filter((char) => char.role !== youRole);
}

export default function ConfigureScreen() {
  const router = useRouter();
  const appMode = useDevSettingsStore((s) => s.settings.appMode);
  const language = useDialogueStore((s) => s.config.language);
  const location = useDialogueStore((s) => s.config.location);
  const difficulty = useDialogueStore((s) => s.config.difficulty);
  const format = useDialogueStore((s) => s.config.format);
  const lessonSegments = useDialogueStore((s) => s.config.lessonSegments);
  const speaker1Name = useDialogueStore((s) => s.config.speaker1.name);
  const speaker1Role = useDialogueStore((s) => s.config.speaker1.role);
  const speaker2Name = useDialogueStore((s) => s.config.speaker2.name);
  const speaker2Role = useDialogueStore((s) => s.config.speaker2.role);
  const quizConfig = useDialogueStore((s) => s.config.quizConfig);

  const setLanguage = useDialogueStore((s) => s.setLanguage);
  const setLocation = useDialogueStore((s) => s.setLocation);
  const setDifficulty = useDialogueStore((s) => s.setDifficulty);
  const setFormat = useDialogueStore((s) => s.setFormat);
  const setLessonSegments = useDialogueStore((s) => s.setLessonSegments);
  const reorderSegments = useDialogueStore((s) => s.reorderSegments);
  const setCharacter = useDialogueStore((s) => s.setCharacter);
  const setQuizConfig = useDialogueStore((s) => s.setQuizConfig);

  // Filter languages and locations based on app mode
  const availableLanguages = useMemo(() => {
    if (appMode === 'development') {
      return LANGUAGES.filter((lang) =>
        (DEV_MODE_LANGUAGES as readonly string[]).includes(lang.value)
      );
    }
    return LANGUAGES;
  }, [appMode]);

  const availableLocations = useMemo(() => {
    if (appMode === 'development') {
      return LOCATIONS.filter((loc) =>
        (DEV_MODE_LOCATIONS as readonly string[]).includes(loc.value)
      );
    }
    return LOCATIONS;
  }, [appMode]);

  // When switching to development mode, ensure valid selections
  useEffect(() => {
    if (appMode === 'development') {
      // Set format to classroom_style in development for full segment testing
      if (format !== 'classroom_style') {
        setFormat('classroom_style');
      }
      // Ensure language is valid for dev mode
      if (!(DEV_MODE_LANGUAGES as readonly string[]).includes(language)) {
        setLanguage('en');
      }
      // Ensure location is valid for dev mode
      if (!(DEV_MODE_LOCATIONS as readonly string[]).includes(location)) {
        handleLocationChange('coffee_shop');
      }
    }
  }, [appMode]);

  const handleLocationChange = (loc: Location) => {
    setLocation(loc);
    // Auto-select first characters for new location
    const chars = CHARACTER_ROLES[loc];
    if (chars.you.length > 0) {
      setCharacter('you', { name: chars.you[0].name, role: chars.you[0].role });
    }
    // Get complementary roles for "them"
    const complementaryRoles = getComplementaryRoles(loc, chars.you[0]?.role ?? '');
    if (complementaryRoles.length > 0) {
      setCharacter('them', { name: complementaryRoles[0].name, role: complementaryRoles[0].role });
    } else if (chars.them.length > 0) {
      setCharacter('them', { name: chars.them[0].name, role: chars.them[0].role });
    }
  };

  const handleYouChange = (label: string) => {
    const char = CHARACTER_ROLES[location].you.find(
      (c) => formatCharacterLabel(c) === label
    );
    if (char) {
      setCharacter('you', { name: char.name, role: char.role });
      // Update "them" to complementary role
      const complementaryRoles = getComplementaryRoles(location, char.role);
      if (complementaryRoles.length > 0 && complementaryRoles[0].role !== speaker2Role) {
        setCharacter('them', { name: complementaryRoles[0].name, role: complementaryRoles[0].role });
      }
    }
  };

  const handleThemChange = (label: string) => {
    const allThem = CHARACTER_ROLES[location].them;
    const char = allThem.find((c) => formatCharacterLabel(c) === label);
    if (char) {
      setCharacter('them', { name: char.name, role: char.role });
    }
  };

  const handleAddSegment = (type: LessonSegmentType) => {
    const newSegment: LessonSegment = {
      id: `seg_${Date.now()}`,
      type,
    };

    if (type === 'welcome') {
      // Welcome always goes at the start
      setLessonSegments([newSegment, ...lessonSegments]);
    } else if (type === 'quiz') {
      // Quiz always goes at the end
      setLessonSegments([...lessonSegments, newSegment]);
    } else {
      // Regular segments: insert before quiz if it exists, otherwise at end
      const quizIndex = lessonSegments.findIndex((s) => s.type === 'quiz');
      if (quizIndex !== -1) {
        const updated = [...lessonSegments];
        updated.splice(quizIndex, 0, newSegment);
        setLessonSegments(updated);
      } else {
        setLessonSegments([...lessonSegments, newSegment]);
      }
    }
  };

  const handleRemoveSegment = (index: number) => {
    const updated = lessonSegments.filter((_, i) => i !== index);
    setLessonSegments(updated);
  };

  const handleToggleQuizCard = (key: keyof QuizConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuizConfig({ [key]: !quizConfig[key] });
  };

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/playback');
  };

  // Character options
  const youOptions = CHARACTER_ROLES[location].you.map((char) => ({
    value: formatCharacterLabel(char),
    label: formatCharacterLabel(char),
  }));

  // Get complementary "them" options based on current "you" selection
  const complementaryThem = getComplementaryRoles(location, speaker1Role);
  const themOptions = (complementaryThem.length > 0 ? complementaryThem : CHARACTER_ROLES[location].them).map((char) => ({
    value: formatCharacterLabel(char),
    label: formatCharacterLabel(char),
  }));

  // Current selection labels
  const currentYouLabel = formatCharacterLabel({ role: speaker1Role, name: speaker1Name });
  const currentThemLabel = formatCharacterLabel({ role: speaker2Role, name: speaker2Name });

  // Language options with flags (filtered by app mode)
  const languageOptions = availableLanguages.map((l) => ({
    value: l.value,
    label: `${l.flag}  ${l.label}`,
  }));

  // Format options
  const formatOptions = LESSON_FORMATS.map((f) => ({
    value: f.value,
    label: f.label,
    description: f.description,
  }));

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0EA5E9', '#06B6D4', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} className="px-6 pt-4 pb-6">
            <Text className="text-3xl font-bold text-white">Conversation</Text>
            <Text className="text-3xl font-bold text-white">Practice</Text>
            <Text className="text-white/80 mt-2 text-base">
              Create realistic dialogues to practice any language
            </Text>
          </Animated.View>

          {/* Main Card */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            className="mx-4 bg-white rounded-3xl shadow-lg shadow-black/10 overflow-hidden"
          >
            {/* 1. Language Dropdown */}
            <Dropdown
              label="Language"
              value={language}
              options={languageOptions}
              onChange={setLanguage}
              icon={<Globe size={16} color="#8B5CF6" />}
              iconBgColor="bg-violet-100"
            />

            {/* 2. Difficulty Section */}
            <View className="p-5 border-b border-slate-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center mr-3">
                  <Gauge size={16} color="#D97706" />
                </View>
                <Text className="text-lg font-semibold text-slate-800">Difficulty</Text>
              </View>
              <View className="flex-row gap-2">
                {DIFFICULTIES.map((diff) => (
                  <Pressable
                    key={diff.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDifficulty(diff.value);
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl border items-center',
                      difficulty === diff.value
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-semibold text-sm',
                        difficulty === diff.value ? 'text-amber-700' : 'text-slate-600'
                      )}
                    >
                      {diff.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-xs text-slate-500 mt-2 text-center">
                {DIFFICULTIES.find((d) => d.value === difficulty)?.description}
              </Text>
            </View>

            {/* 3. Format Dropdown */}
            <Dropdown
              label="Format"
              value={format}
              options={formatOptions}
              onChange={setFormat}
              icon={<Layout size={16} color="#0891B2" />}
              iconBgColor="bg-cyan-100"
            />

            {/* 4. Location Dropdown */}
            <Dropdown
              label="Location"
              value={location}
              options={availableLocations}
              onChange={handleLocationChange}
              icon={<MapPin size={16} color="#059669" />}
              iconBgColor="bg-emerald-100"
            />

            {/* 5. Characters Section */}
            <View className="p-5 border-b border-slate-100">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3">
                  <Users size={16} color="#7C3AED" />
                </View>
                <Text className="text-lg font-semibold text-slate-800">Characters</Text>
              </View>

              <View className="flex-row gap-3">
                <Dropdown
                  label="You"
                  value={currentYouLabel}
                  options={youOptions}
                  onChange={handleYouChange}
                  compact
                />
                <Dropdown
                  label="Them"
                  value={currentThemLabel}
                  options={themOptions}
                  onChange={handleThemChange}
                  compact
                />
              </View>
            </View>

            {/* 6. Lesson Builder */}
            <View className="p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-rose-100 items-center justify-center mr-3">
                  <BookOpen size={16} color="#E11D48" />
                </View>
                <Text className="text-lg font-semibold text-slate-800">Lesson Builder</Text>
              </View>

              <LessonBuilder
                format={format}
                segments={lessonSegments}
                onReorder={reorderSegments}
                onRemove={format === 'custom' ? handleRemoveSegment : undefined}
                onAdd={format === 'custom' ? handleAddSegment : undefined}
                quizConfig={quizConfig}
                onToggleQuizCard={handleToggleQuizCard}
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Generate Button */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-slate-50">
          <Pressable
            onPress={handleGenerate}
            className="flex-row items-center justify-center py-4 rounded-2xl bg-cyan-500"
          >
            <Text className="text-white font-bold text-lg mr-2">
              Generate Lesson
            </Text>
            <ChevronRight size={20} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
