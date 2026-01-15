# Language Learning Conversation App

## What This App Does

Users select a language, location, and lesson format, then get a 15-20 minute audio lesson with synchronized text. Think Pimsleur meets Duolingo with AI-generated content.

**Philosophy:** "Listen First, Then Practice" - users hear AI-to-AI conversations with subtitles before speaking.

---

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
User Request → Device Cache → Supabase Storage → Generate via ElevenLabs
                    ↓              ↓                       ↓
              (instant)      (instant)        (store permanently, then instant forever)
```

### Critical Files
| File | Purpose |
|------|---------|
| `src/lib/dialogue-service.ts` | Lesson generation logic, `generateConversationWithSections()` |
| `src/lib/section-audio-service.ts` | 3-tier cache lookup, device caching |
| `supabase/functions/` | Edge Functions for API logic (cache checks, ElevenLabs calls) |

### DO NOT
- Revert to line-by-line audio generation (the old `generateConversation()` path)
- Change the cache key format without understanding the implications
- Skip the cache lookup and call ElevenLabs directly

---

## Project Structure

```
src/
├── app/                      # Expo Router pages
│   ├── _layout.tsx           # Root layout with providers
│   ├── index.tsx             # Configuration screen (language, location, format, characters)
│   └── playback.tsx          # Lesson playback with section-aware UI
├── components/
│   ├── DevSettingsModal.tsx  # Shake to open dev settings
│   └── LessonBuilder.tsx     # Drag-and-drop segment builder
└── lib/
    ├── types.ts              # Domain model - READ THIS FIRST
    ├── dialogue-store.ts     # Zustand store for config & state
    ├── dialogue-service.ts   # Generation logic
    ├── section-audio-service.ts # Section caching layer
    └── supabase.ts           # Supabase client

supabase/
├── functions/                # Edge Functions (TypeScript, Deno)
│   └── ...                   # API endpoints for cache, generation, etc.
└── migrations/               # Database schema migrations

docs/                         # Project documentation
├── MIGRATION_PLAN.md         # Supabase migration details
└── AI_ONBOARDING_README.md   # How to use these docs with AI tools

.cursor/rules/                # Cursor-specific configuration
└── expo-patterns.mdc         # Expo/React Native patterns
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Expo SDK 53, React Native 0.76.7 |
| Package Manager | **bun** (not npm/yarn) |
| Styling | NativeWind + Tailwind v3 |
| Client State | Zustand |
| Server State | React Query |
| Animations | react-native-reanimated v3 |
| Audio | expo-av |
| Backend | **Supabase** (PostgreSQL + Auth + Storage + Edge Functions) |
| Audio Storage | **Supabase Storage** |

### Backend Architecture (Simplified)

**Everything lives in Supabase.** One dashboard, one vendor, minimal wiring.

- **Auth**: Supabase Auth (JWT tokens, user management)
- **Database**: Supabase PostgreSQL (lesson metadata, cache index, user data)
- **Storage**: Supabase Storage (audio files)
- **API Logic**: Supabase Edge Functions (TypeScript, Deno runtime)

This is optimized for speed of development, not cost optimization. If egress costs become a problem at scale, migrate storage to Cloudflare R2 later.

---

## TypeScript Conventions

### Strict Mode
TypeScript strict mode is enabled. All code must pass strict type checking.

### Explicit Type Annotations
```typescript
// Good
const [items, setItems] = useState<Item[]>([]);
const [user, setUser] = useState<User | null>(null);

// Bad - implicit any[]
const [items, setItems] = useState([]);
```

### Null/Undefined Handling
```typescript
// Good - use optional chaining and nullish coalescing
const name = user?.profile?.name ?? 'Anonymous';
const lines = dialogue?.lines ?? [];

// Bad - unsafe access
const name = user.profile.name;
```

### Functional Components Only
```typescript
// Good
export function MyComponent({ title }: Props) {
  return <View><Text>{title}</Text></View>;
}

// Also good
export const MyComponent = ({ title }: Props) => {
  return <View><Text>{title}</Text></View>;
};

// Bad - class components
export class MyComponent extends React.Component { }
```

---

## State Management

### Zustand for Client State
```typescript
// Always use selectors - prevents unnecessary re-renders
const language = useDialogueStore(s => s.config.language);
const setLanguage = useDialogueStore(s => s.setLanguage);

// Bad - subscribes to entire store
const store = useDialogueStore();
```

### React Query for Server/Async State
```typescript
// Always use object API
const { data, isLoading } = useQuery({
  queryKey: ['lesson', lessonId],
  queryFn: () => fetchLesson(lessonId),
});

// For mutations
const mutation = useMutation({
  mutationFn: (data: CreateLessonData) => createLesson(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
  },
});
```

---

## NativeWind Styling

### Use cn() Helper for Conditional Classes
```typescript
import { cn } from '@/lib/cn';

<View className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50'
)} />
```

### Components That Don't Support className
These components require the `style` prop instead:
- `CameraView`
- `LinearGradient`
- `Animated.View` (and other Animated.* components)
- Third-party native components

```typescript
// LinearGradient - use style prop
<LinearGradient
  colors={['#000', '#333']}
  style={{ flex: 1, padding: 16 }}
/>

// Animated.View - use style prop
<Animated.View style={[styles.container, animatedStyle]} />
```

---

## Audio Patterns (expo-av)

### Duration Units
**All durations are in MILLISECONDS** (2000+ for typical phrases, not seconds like 2.0)

```typescript
// Good
const duration = 2500; // 2.5 seconds in milliseconds

// Bad - this is only 2.5 milliseconds!
const duration = 2.5;
```

### Section Audio with Timestamps
Each line has `startTime` and `endTime` within the section audio file:
```typescript
interface DialogueLine {
  text: string;
  startTime: number;    // milliseconds from section start
  endTime: number;      // milliseconds from section start
  duration: number;     // milliseconds
  sectionAudioStart?: number; // for seeking within section file
}
```

### spokenText vs text
For Vocabulary, Breakdown, and Quiz sections, display text differs from spoken audio:
```typescript
// Always use spokenText for audio, fall back to text
const audioText = line.spokenText || line.text;
```

---

## Supabase Patterns

### Row Level Security (RLS)
All tables must have RLS enabled. Define policies for each operation:

```sql
-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Users can only see their own lessons
CREATE POLICY "Users can view own lessons"
  ON lessons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own lessons
CREATE POLICY "Users can insert own lessons"
  ON lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Client Usage
```typescript
import { supabase } from '@/lib/supabase';

// Queries
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('language', 'en');

// Inserts
const { data, error } = await supabase
  .from('lessons')
  .insert({ title: 'Coffee Shop', language: 'en' })
  .select()
  .single();
```

---

## Error Handling

### Use try/catch with Specific Error Types
```typescript
try {
  const result = await generateLesson(config);
  return result;
} catch (error) {
  if (error instanceof ElevenLabsError) {
    // Handle API-specific error
    console.error('ElevenLabs API error:', error.message);
  } else if (error instanceof NetworkError) {
    // Handle network issues
    console.error('Network error:', error.message);
  } else {
    // Unknown error
    throw error;
  }
}
```

### User-Facing Errors
Use toast notifications or inline error states, never silent failures:
```typescript
const { mutate, error } = useMutation({
  mutationFn: generateLesson,
  onError: (error) => {
    Toast.show({
      type: 'error',
      text1: 'Generation Failed',
      text2: error.message,
    });
  },
});
```

---

## What NOT to Do

### Forbidden Files - Never Edit
- `patches/`
- `babel.config.js`
- `metro.config.js`
- `app.json`
- `tsconfig.json`
- `nativewind-env.d.ts`

### Forbidden Patterns
1. **Don't install packages** - All packages are pre-installed. Exception: @expo-google-fonts packages.
2. **Don't use npm/yarn** - Use `bun` for all package operations.
3. **Don't manage git** - Development environment handles version control.
4. **Don't touch dev server** - Let the development environment manage it.
5. **Don't use class components** - Functional components only.
6. **Don't skip cache lookup** - Never call ElevenLabs directly.

### Common Mistakes to Avoid

1. **Segment type case mismatch** - GPT returns `VOCAB`, types use `vocabulary`. Map between them.
2. **spokenText vs text** - For Vocabulary/Breakdown/Quiz, always use `spokenText || text` for audio.
3. **Duration units** - Audio duration must be in milliseconds (2000+), not seconds.
4. **Zustand selectors** - Always use selectors to prevent unnecessary re-renders.
5. **className on native components** - LinearGradient, CameraView, Animated.* need style prop.

---

## Environment

| Service | Notes |
|---------|-------|
| Supabase | Auth, Database, Storage, Edge Functions (all-in-one) |
| Frontend | Expo dev server (port 8081) |

---

## Skills Available
- `ai-apis-like-chatgpt`: For AI API integration
- `expo-docs`: For Expo SDK modules
- `frontend-app-design`: For UI/UX design

---

## Quick Reference

### File to Read First
`src/lib/types.ts` - Contains the domain model and all type definitions.

### Generating a Lesson
1. User configures: language, location, format, characters
2. `dialogue-service.ts` generates the lesson content via GPT
3. `section-audio-service.ts` handles audio caching
4. Playback screen plays with synchronized UI

### Adding a New Section Type
1. Add to `LessonSegmentType` in `types.ts`
2. Add display info to `SEGMENT_DISPLAY_INFO`
3. Update `dialogue-service.ts` generation logic
4. Update cache key generation in `section-audio-service.ts`

---

## Session Summaries (MANDATORY)

**At the START of every session**, Claude MUST read `SESSION_SUMMARY.md` (if it exists) to understand:
- What was done last time
- What's currently working or broken
- What needs to happen next

**At the END of every session**, Claude MUST create/update `SESSION_SUMMARY.md` before finishing. This is not optional.

The summary includes:
1. **Changes Made** - Files modified/created and why
2. **Current State** - What works, what's been tested (✅ markers)
3. **Known Issues** - Bugs, limitations, tech debt (⏳ markers)
4. **Next Steps** - What should happen next, in priority order

**Format:** Scannable bullets, not paragraphs. End with session duration and `Status: Ready for commit ✅` or `Status: WIP`.

**Why:** This file is how Claude maintains continuity between sessions. Without it, context is lost.
