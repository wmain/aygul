# Language Learning Conversation App

## What This App Does
Users select a language, location, and lesson format, then get a 15-20 minute audio lesson with synchronized text. Think Pimsleur meets Duolingo with AI-generated content.

## The Core Innovation: Section-Based Caching

**READ THIS BEFORE TOUCHING AUDIO/GENERATION CODE.**

Each lesson is assembled from independently cached SECTIONS, not generated as a whole:

```
Cache Key = {language}_{sectionType}_{location}_{speakerA}_{speakerB}
Example: en_welcome_coffeeshop_maria_jordan
```

### Why This Matters
- ElevenLabs API is called **ONCE per unique section, ever** (across all users)
- 7 section files per lesson instead of 43 line-by-line files
- Sections are reusable across lesson formats (removing Vocabulary still uses cached Welcome, etc.)
- After initial generation, lessons are **instant** (no API calls)

### The 7 Section Types
`welcome` | `vocabulary` | `slow_dialogue` | `breakdown` | `natural_speed` | `quiz` | `cultural_note`

### 3-Tier Caching Flow
```
User Request → Device Cache → Server Cache (MongoDB) → Generate via ElevenLabs
                    ↓              ↓                         ↓
              (instant)      (instant)            (store permanently, then instant forever)
```

### Critical Files
| File | Purpose |
|------|---------|
| `src/lib/dialogue-service.ts` | Lesson generation logic, `generateConversationWithSections()` |
| `src/lib/section-audio-service.ts` | 3-tier cache lookup, device caching |
| `backend/routes/audio_cache.py` | Server cache API, MongoDB storage |
| `backend/services/elevenlabs_dialogue.py` | ElevenLabs text-to-dialogue API calls |

### DO NOT
- Revert to line-by-line audio generation (the old `generateConversation()` path)
- Change the cache key format without understanding the implications
- Skip the cache lookup and call ElevenLabs directly

---

## Project Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx             # Configuration screen (language, location, format, characters)
│   └── playback.tsx          # Lesson playback with section-aware UI
├── components/
│   ├── DevSettingsModal.tsx  # Shake to open dev settings
│   └── LessonBuilder.tsx     # Drag-and-drop segment builder
└── lib/
    ├── types.ts              # Domain model - READ THIS FIRST
    ├── dialogue-store.ts     # Zustand store for config & state
    ├── dialogue-service.ts   # Generation logic
    └── section-audio-service.ts # Section caching layer

backend/
├── server.py                 # FastAPI server
├── routes/audio_cache.py     # Section cache endpoints
├── services/elevenlabs_dialogue.py # ElevenLabs integration
└── models/audio_cache.py     # MongoDB schemas
```

---

## Tech Stack
- Expo SDK 53, React Native 0.76.7, **bun** (not npm)
- NativeWind + Tailwind v3 for styling
- Zustand for local state, React Query for async state
- react-native-reanimated v3 for animations
- expo-audio for playback
- FastAPI backend with MongoDB

---

## Current State (Update This Section)

**Launch Target:** 3 languages (English, Spanish, French) × 10 locations

**What Works:**
- Config screen UI complete
- Playback screen UI complete with section headers, flashcards, quiz cards
- Line-by-line generation works (but expensive)
- Backend cache infrastructure exists

**What's Incomplete:**
- Section-based generation needs ElevenLabs text-to-dialogue integration verified
- Pre-generation script for launch content not built
- Feature flag `audioSystem` is set to `line-based`, needs to switch to `section-based`

---

## Technical Guidelines

<stack>
  All packages are pre-installed. DO NOT install new packages unless they are @expo-google-fonts packages or pure JavaScript helpers.
</stack>

<typescript>
  Explicit type annotations for useState: `useState<Type[]>([])` not `useState([])`
  Null/undefined handling: use optional chaining `?.` and nullish coalescing `??`
  TypeScript strict mode is enabled.
</typescript>

<state>
  Zustand for local state. Always use selectors: `useStore(s => s.foo)` not `useStore()`
  React Query for server/async state. Always use object API: `useQuery({ queryKey, queryFn })`
</state>

<styling>
  Use NativeWind. Use cn() helper from src/lib/cn.ts for conditional classNames.
  CameraView, LinearGradient, Animated components DO NOT support className - use style prop.
</styling>

<audio>
  Use expo-audio (not expo-av). Duration is in MILLISECONDS.
  Section audio uses timestamps for UI sync - each line has startTime/endTime within the section file.
</audio>

<environment>
  Vibecode manages git and dev server. DO NOT manage git or touch the dev server.
  Backend runs on port 8001. Frontend on port 8081.
</environment>

<forbidden_files>
  Do not edit: patches/, babel.config.js, metro.config.js, app.json, tsconfig.json, nativewind-env.d.ts
</forbidden_files>

---

## Common Mistakes to Avoid

1. **Segment type case mismatch** - GPT returns `VOCAB`, types use `vocabulary`. Map between them.
2. **spokenText vs text** - For Vocabulary/Breakdown/Quiz, `text` is display, `spokenText` is what gets spoken. Always use `spokenText || text` for audio.
3. **Duration units** - Audio duration must be in milliseconds (2000+), not seconds.
4. **Zustand selectors** - Always use selectors to prevent unnecessary re-renders.

---

## Skills Available
- `ai-apis-like-chatgpt`: For AI API integration
- `expo-docs`: For Expo SDK modules
- `frontend-app-design`: For UI/UX design
