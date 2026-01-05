# Claude Handoff Document - Language Learning Conversation App

## How to Use This Document

This document is designed for continuity when working with Claude (Claude Code CLI, Claude Desktop, or API). Use it when:

1. **Starting a new Claude session** — Paste this into your first message or system prompt
2. **Claude loses context** — Reference this to re-establish project understanding
3. **Onboarding a new AI assistant** — Complete architecture and decision history

**Keep this document updated** as you make significant changes.

---

## Project Overview

A React Native Expo app for language learning through realistic conversation practice. Users configure a lesson scenario (language, location, difficulty, format) and the app generates a full lesson with audio using AI APIs (OpenAI for dialogue generation, ElevenLabs or OpenAI for TTS).

### Core User Flow
1. User configures lesson on main screen (language, difficulty, format, location, characters)
2. User taps "Generate Lesson"
3. App generates dialogue text via OpenAI, then TTS audio for each line
4. Playback screen shows synchronized transcript with audio playback
5. Different segment types have different UI treatments (flashcards, quiz cards, dialogue bubbles)

### Tech Stack
- **Framework**: Expo SDK 53, React Native 0.76.7
- **Package Manager**: bun (not npm)
- **Styling**: NativeWind + Tailwind v3
- **State Management**: Zustand (local), React Query (server/async)
- **Animations**: react-native-reanimated v3
- **Gestures**: react-native-gesture-handler
- **Icons**: lucide-react-native
- **Router**: Expo Router (file-based routing in `src/app/`)
- **Audio**: expo-av

---

## File Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout, providers, shake detection
│   ├── index.tsx            # Configuration screen
│   ├── playback.tsx         # Lesson playback screen
│   └── +not-found.tsx       # 404 page
├── components/
│   ├── DevSettingsModal.tsx # Dev settings UI (shake to open)
│   ├── LessonBuilder.tsx    # Drag-and-drop segment builder
│   └── Themed.tsx           # Themed text/view components
└── lib/
    ├── types.ts             # TypeScript types (CRITICAL - read this first)
    ├── cn.ts                # Tailwind className merge utility
    ├── dialogue-store.ts    # Zustand store for lesson config & state
    ├── dev-settings-store.ts # Zustand store for dev settings
    ├── dialogue-service.ts  # Core lesson generation service
    ├── bundled-lessons.ts   # Pre-defined offline lessons (incomplete)
    └── use-shake-detector.ts # Shake gesture hook for dev settings

scripts/
└── generate-bundled-audio.ts # Script to pre-generate audio files

assets/
└── bundled-audio/           # Pre-generated audio (to be populated)
    ├── en_coffee_shop/
    ├── en_restaurant/
    ├── es_coffee_shop/
    ├── es_restaurant/
    ├── fr_coffee_shop/
    └── fr_restaurant/
```

---

## Type System (`src/lib/types.ts`)

**Read this file first when onboarding.** It defines the entire domain model.

### Languages
50 supported languages with emoji flags. In dev mode, limited to: `en`, `es`, `fr`

### Locations
10 locations: `coffee_shop`, `restaurant`, `airport`, `hotel`, `grocery`, `doctor`, `pharmacy`, `bank`, `transit`, `clothing`

Each location has associated situations and predefined character roles.

### Lesson Formats
```typescript
type LessonFormat = 'quick_dialogue' | 'vocabulary_first' | 'classroom_style' | 'immersion' | 'custom';
```
- `quick_dialogue`: Welcome + natural conversation
- `vocabulary_first`: Welcome + vocabulary + natural conversation
- `classroom_style`: Full lesson with all segments (DEFAULT for dev mode)
- `immersion`: Long natural conversation only
- `custom`: User arranges segments via drag-and-drop

### Lesson Segments
```typescript
type LessonSegmentType = 'welcome' | 'vocabulary' | 'slow_dialogue' | 'breakdown' | 'natural_speed' | 'quiz' | 'cultural_note';
```

Each format maps to preset segments via `LESSON_SEGMENT_CONFIGS`.

### DialogueLine Structure
```typescript
interface DialogueLine {
  id: string;
  speakerId: 1 | 2;
  text: string;           // Display text (e.g., "coffee - a hot beverage")
  spokenText?: string;    // What's actually spoken (longer explanation)
  emotion?: string;       // Optional emotion tag for voice variation
  segmentType?: string;   // WELCOME, VOCAB, SLOW, BREAKDOWN, NATURAL, QUIZ, CULTURAL
  audioUri?: string;      // Path to audio file
  startTime: number;      // Milliseconds
  endTime: number;        // Milliseconds
  duration: number;       // Milliseconds
}
```

**Critical distinction**: `text` is for display (flashcard content), `spokenText` is what gets spoken aloud. Always use `spokenText || text` for audio generation.

### Character System
Each location has predefined roles with fixed names:
```typescript
CHARACTER_ROLES: Record<Location, { you: Character[]; them: Character[] }>
```

---

## State Management

### Dialogue Store (`src/lib/dialogue-store.ts`)
Zustand store managing:
- **Configuration**: language, location, situation, difficulty, format, segments, speakers, quiz config
- **Generated Dialogue**: Full lesson data after generation
- **Cached Lesson**: Last generated lesson for replay
- **Playback State**: isGenerating, currentLineIndex

Key pattern - format changes auto-update segments:
```typescript
setFormat: (format) => set((state) => {
  const segmentTypes = LESSON_SEGMENT_CONFIGS[format];
  const lessonSegments = segmentTypes.map((type, i) => ({
    id: `seg_${i}`,
    type,
  }));
  return { config: { ...state.config, format, lessonSegments } };
}),
```

### Dev Settings Store (`src/lib/dev-settings-store.ts`)
```typescript
type TTSProvider = 'elevenlabs' | 'openai';
type AppMode = 'development' | 'production';

// Defaults
ttsProvider: 'elevenlabs'
appMode: 'development'
```

**Always use Zustand selectors** to prevent unnecessary re-renders:
```typescript
// Good
const appMode = useDevSettingsStore((s) => s.settings.appMode);
// Bad - causes re-render on any store change
const { settings } = useDevSettingsStore();
```

---

## Dialogue Service (`src/lib/dialogue-service.ts`)

### Generation Flow
1. Generate dialogue text via OpenAI (`gpt-4o-mini`)
2. Get TTS provider from dev settings
3. Generate audio for each line via ElevenLabs or OpenAI TTS
4. Return `GeneratedDialogue` with all lines and audio URIs

### Voice Mappings
Character names map to specific voice IDs for both providers:
```typescript
const ELEVENLABS_SPEAKER1_VOICE_MAP: Record<string, string> = {
  'Maria': 'EXAVITQu4vr4xnSDxMaL',  // Bella
  'Alex': 'pNInz6obpgDQGcFmaJgB',   // Adam
  // ...
};
```

### Section Transitions
Two lookup tables ensure smooth audio flow between sections:
- `SECTION_TRANSITIONS` - How to start each section after another
- `SECTION_CLOSINGS` - How to end each section before another

### Mock Generation
For testing without API calls:
- `generateMockConversation()` - Full mock with delays
- `generateInstantMockConversation()` - Instant mock, no audio

**IMPORTANT**: Duration must be in MILLISECONDS (2000+), not seconds, or playback skips instantly.

---

## Playback Screen (`src/app/playback.tsx`)

### Segment View Modes
- `content`: Pedagogical view (flashcards, quiz cards)
- `transcript`: What's actually being spoken

Toggle only appears for segments with alternate views:
- **Has alternate view**: VOCAB, BREAKDOWN, QUIZ, CULTURAL
- **No alternate view**: WELCOME, SLOW, NATURAL (dialogue IS the content)

### Audio Playback Logic
```typescript
const playLineAudio = async (index: number) => {
  const line = dialogue.lines[index];
  if (line.audioUri) {
    const { sound } = await Audio.Sound.createAsync({ uri: line.audioUri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) playNextLine();
    });
  } else {
    // No audio - use timeout
    setTimeout(() => playNextLine(), line.duration || 2000);
  }
};
```

### Features
- Segmented progress bar (colored by segment type, tap to seek)
- Auto-scroll with manual override detection
- Playback speed control (1x, 0.75x, 0.5x)
- Haptic feedback on interactions

---

## Development vs Production Mode

### Development Mode (default)
- Limited to 3 languages: English, Spanish, French
- Limited to 2 locations: Coffee Shop, Restaurant
- Forces "Classroom Style" format
- **INTENDED**: Should use pre-bundled audio (NO API calls)
- **CURRENT STATE**: Falls through to real API calls because bundled audio doesn't exist yet

### Production Mode
- All languages and locations available
- Any format selectable
- Always uses real API calls

Access via shake gesture or 'D' key on web.

---

## Primary Incomplete Task: Bundled Audio Generation

### The Problem
Development mode was designed to work **offline** with pre-bundled audio files. Currently, it falls through to making real API calls because the audio files don't exist.

### What Needs to Be Done

1. **Run the generation script** (requires ElevenLabs API key):
   ```bash
   EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=your_key bun scripts/generate-bundled-audio.ts
   ```

2. **Script generates** MP3 files for all 6 lesson combinations:
   - `assets/bundled-audio/en_coffee_shop/line_0.mp3` through `line_N.mp3`
   - Similar for `en_restaurant`, `es_coffee_shop`, `es_restaurant`, `fr_coffee_shop`, `fr_restaurant`

3. **Update `bundled-lessons.ts`** to use proper asset URIs (currently uses placeholder `bundled://` format)

4. **Update `dialogue-service.ts`** to load bundled audio in dev mode:
   ```typescript
   if (appMode === 'development') {
     const bundledKey = getBundledLessonKey(config.language, config.location);
     if (bundledKey) {
       const bundledLesson = getBundledLesson(bundledKey);
       if (bundledLesson?.lines[0]?.audioUri) {
         return bundledLesson;
       }
     }
   }
   ```

### Audio Asset Loading Options in Expo
1. **Static require()**: `require('../assets/bundled-audio/en_coffee_shop/line_0.mp3')`
2. **expo-asset**: Load from assets folder at runtime
3. **Base64 in code**: Larger bundle but simpler (not recommended for many files)

---

## API Integration Details

### OpenAI (Dialogue Generation)
- Endpoint: `https://api.openai.com/v1/responses`
- Model: `gpt-4o-mini`
- Environment variable: `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`

### ElevenLabs (Primary TTS)
- Endpoint: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- Model: `eleven_flash_v2_5`
- Output format: `mp3_44100_128`
- Voice settings: stability=0.5, similarity_boost=0.75
- Environment variable: `EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY`

### OpenAI TTS (Fallback)
- Endpoint: `https://api.openai.com/v1/audio/speech`
- Model: `tts-1`
- Voices: alloy, echo, fable, onyx, nova, shimmer

---

## Known Issues / Gotchas

1. **Zustand selectors** — Always use selectors to prevent unnecessary re-renders

2. **LinearGradient** — Cannot use `className`, must use `style` prop

3. **CameraView** — Must use `style={{ flex: 1 }}`, not className

4. **Horizontal ScrollViews** — Add `style={{ flexGrow: 0 }}` to constrain height

5. **AsyncStorage persistence** — Dev settings persist; use `merge` option to handle missing fields

6. **Audio duration** — Mock lessons need duration in MILLISECONDS (2000+), not seconds

7. **Segment type strings** — GPT returns uppercase (`VOCAB`), but LessonSegmentType uses snake_case (`vocabulary`). Mapping is required.

8. **spokenText vs text** — For Vocabulary/Breakdown/Quiz, `text` is display, `spokenText` is audio. Always use `spokenText || text` for TTS.

9. **SafeArea** — Skip SafeAreaView inside tab stacks with navigation headers; add when using custom/hidden headers

10. **React Native Reanimated** — Training data may be outdated; look up current docs before implementing animations

---

## Codebase Rules

### Forbidden Files (Do Not Edit)
`patches/`, `babel.config.js`, `metro.config.js`, `app.json`, `tsconfig.json`, `nativewind-env.d.ts`

### Styling
- Use NativeWind/Tailwind for styling
- Use `cn()` helper from `src/lib/cn.ts` for conditional classNames
- CameraView, LinearGradient, Animated components DO NOT support className — use style prop

### State
- React Query for server/async state (always use object API: `useQuery({ queryKey, queryFn })`)
- Zustand for local state with selectors
- Never wrap RootLayoutNav directly with providers

### Routing
- Expo Router file-based routing in `src/app/`
- Never delete RootLayoutNav from `_layout.tsx`
- Only ONE route can map to "/" — can't have both `src/app/index.tsx` and `src/app/(tabs)/index.tsx`

### UX
- Use Pressable over TouchableOpacity
- Use custom modals, not Alert.alert()
- Ensure keyboard is dismissable and doesn't obscure inputs

---

## User Preferences Learned

These preferences were established during development:

1. **When blocked on a task, SAY YOU'RE BLOCKED** rather than implementing a workaround
2. Development mode should work **without API calls** using pre-bundled content
3. Both Development and Production modes should have access to TTS provider selection
4. Default app mode should be Development
5. Classroom Style format is default for Development (tests all segment types)
6. Don't change the implementation approach without explicit approval
7. Keep responses concise — user may be on mobile
8. Don't over-engineer or add features beyond what's requested

---

## Commands

```bash
# Install dependencies
bun install

# Start dev server
bun start

# Generate bundled audio (requires valid API key)
EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=your_key bun scripts/generate-bundled-audio.ts

# TypeScript check
bun tsc --noEmit
```

---

## Design Principles

1. **iOS Human Interface Guidelines** — Follow Apple's design patterns
2. **Mobile-first** — Optimized for touch, thumb zones, glanceability
3. **No web-like designs** — Native mobile patterns only
4. **Cohesive themes** — Dominant colors with sharp accents
5. **Micro-interactions** — Haptic feedback, button animations
6. **SafeArea handling** — Careful management based on navigation structure

Avoid: Purple gradients on white, generic centered layouts, overused fonts (Space Grotesk, Inter), predictable AI aesthetic.

---

## Session Continuity Notes

When starting a new session with this codebase:

1. **Read `src/lib/types.ts` first** — It defines the entire domain model
2. **Check `src/lib/dialogue-service.ts`** — Core generation logic lives here
3. **Review the playback screen** — Most complexity is in `src/app/playback.tsx`
4. **The bundled audio task is incomplete** — This is the main outstanding work

If making changes:
- Update this CLAUDE_HANDOFF.md with significant architectural decisions
- Update README.md with user-facing feature changes
- Maintain the separation between dev mode (offline) and production mode (API calls)
