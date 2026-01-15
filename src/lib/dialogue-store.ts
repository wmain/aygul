import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { ConversationConfig, GeneratedDialogue, Location, Difficulty, SpeakerConfig, Language, LessonFormat, LessonSegment, LessonSegmentType, QuizConfig } from './types';
import { CHARACTER_ROLES, LESSON_SEGMENT_CONFIGS, DEFAULT_QUIZ_CONFIG } from './types';

const storage = new MMKV({ id: 'dialogue-store' });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

interface DialogueState {
  // Configuration
  config: ConversationConfig;
  setLanguage: (language: Language) => void;
  setLocation: (location: Location) => void;
  setSituation: (situation: string) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setFormat: (format: LessonFormat) => void;
  setLessonSegments: (segments: LessonSegment[]) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  setSpeaker1: (speaker: Partial<SpeakerConfig>) => void;
  setSpeaker2: (speaker: Partial<SpeakerConfig>) => void;
  setCharacter: (type: 'you' | 'them', character: SpeakerConfig) => void;
  setQuizConfig: (quizConfig: Partial<QuizConfig>) => void;

  // Generated dialogue
  dialogue: GeneratedDialogue | null;
  setDialogue: (dialogue: GeneratedDialogue | null) => void;

  // Cached last lesson for dev mode
  cachedLesson: GeneratedDialogue | null;
  setCachedLesson: (lesson: GeneratedDialogue | null) => void;

  // Playback state
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  currentLineIndex: number;
  setCurrentLineIndex: (index: number) => void;

  // Reset
  reset: () => void;
}

const defaultConfig: ConversationConfig = {
  language: 'en',
  location: 'coffee_shop',
  situation: 'Ordering a drink',
  difficulty: 'intermediate',
  format: 'quick_dialogue',
  lessonSegments: [{ id: 'seg_0', type: 'natural_speed' }],
  speaker1: {
    name: CHARACTER_ROLES.coffee_shop.you[0].name,
    role: CHARACTER_ROLES.coffee_shop.you[0].role,
  },
  speaker2: {
    name: CHARACTER_ROLES.coffee_shop.them[0].name,
    role: CHARACTER_ROLES.coffee_shop.them[0].role,
  },
  quizConfig: DEFAULT_QUIZ_CONFIG,
};

export const useDialogueStore = create<DialogueState>()(
  persist(
    (set) => ({
  config: defaultConfig,
  setLanguage: (language) =>
    set((state) => ({ config: { ...state.config, language } })),
  setLocation: (location) =>
    set((state) => ({ config: { ...state.config, location } })),
  setSituation: (situation) =>
    set((state) => ({ config: { ...state.config, situation } })),
  setDifficulty: (difficulty) =>
    set((state) => ({ config: { ...state.config, difficulty } })),
  setFormat: (format) =>
    set((state) => {
      // When format changes, update lesson segments to match the preset
      const segmentTypes = LESSON_SEGMENT_CONFIGS[format];
      const lessonSegments: LessonSegment[] = segmentTypes.map((type, i) => ({
        id: `seg_${i}`,
        type,
      }));
      return { config: { ...state.config, format, lessonSegments } };
    }),
  setLessonSegments: (lessonSegments) =>
    set((state) => ({ config: { ...state.config, lessonSegments } })),
  reorderSegments: (fromIndex, toIndex) =>
    set((state) => {
      const segments = [...state.config.lessonSegments];
      const [removed] = segments.splice(fromIndex, 1);
      segments.splice(toIndex, 0, removed);
      return { config: { ...state.config, lessonSegments: segments } };
    }),
  setSpeaker1: (speaker) =>
    set((state) => ({
      config: { ...state.config, speaker1: { ...state.config.speaker1, ...speaker } },
    })),
  setSpeaker2: (speaker) =>
    set((state) => ({
      config: { ...state.config, speaker2: { ...state.config.speaker2, ...speaker } },
    })),
  setCharacter: (type, character) =>
    set((state) => ({
      config: {
        ...state.config,
        [type === 'you' ? 'speaker1' : 'speaker2']: character,
      },
    })),
  setQuizConfig: (quizConfig) =>
    set((state) => ({
      config: {
        ...state.config,
        quizConfig: { ...state.config.quizConfig, ...quizConfig },
      },
    })),

  dialogue: null,
  setDialogue: (dialogue) => set({ dialogue }),

  cachedLesson: null,
  setCachedLesson: (cachedLesson) => set({ cachedLesson }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  currentLineIndex: 0,
  setCurrentLineIndex: (currentLineIndex) => set({ currentLineIndex }),

  reset: () =>
    set({
      config: defaultConfig,
      dialogue: null,
      isGenerating: false,
      currentLineIndex: 0,
    }),
    }),
    {
      name: 'dialogue-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        config: state.config,
        cachedLesson: state.cachedLesson,
      }),
    }
  )
);
