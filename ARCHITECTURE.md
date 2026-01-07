# Architecture: Section-Based Audio Caching

## The Problem
Generating a 15-20 minute language lesson costs money per API call. If every user generates their own lesson, costs scale linearly with users.

## The Solution
**Cache audio at the SECTION level, not the lesson level.**

Each section is an independent, reusable building block:
```
Cache Key = {language}_{sectionType}_{location}_{speakerA}_{speakerB}
Example: en_vocabulary_coffeeshop_maria_jordan
```

Once generated, a section is stored **permanently**. Every future request for that combination is instant (no API call).

---

## How It Works

### Lesson Assembly
User selects: `Spanish + Restaurant + Carlos & Ana + Classroom Style`

The app assembles the lesson from cached sections:
```
es_welcome_restaurant_carlos_ana       ✓ cached → instant
es_vocabulary_restaurant_carlos_ana    ✗ not cached → generate, store, then instant forever
es_slow_restaurant_carlos_ana          ✓ cached → instant
es_breakdown_restaurant_carlos_ana     ✓ cached → instant
es_natural_restaurant_carlos_ana       ✓ cached → instant
es_quiz_restaurant_carlos_ana          ✗ not cached → generate, store
es_cultural_restaurant_carlos_ana      ✓ cached → instant
```
**Result:** Only 2 API calls instead of 7. Next user with same combo: 0 calls.

### Section Reusability
If a user removes Vocabulary from their lesson, the other 6 sections are still used from cache. Sections are independent building blocks.

### 3-Tier Caching
```
1. Device Cache (expo-file-system)
   ↓ miss
2. Server Cache (MongoDB + file storage)
   ↓ miss
3. Generate via ElevenLabs text-to-dialogue API
   → Store in server cache
   → Download to device cache
   → Return to user
```

---

## The 7 Section Types

| Type | Content | Duration |
|------|---------|----------|
| `welcome` | Hosts introduce lesson, set expectations | ~30s |
| `vocabulary` | 5-8 key words with definitions | ~2min |
| `slow_dialogue` | Slow-paced practice conversation | ~2min |
| `breakdown` | Phrase explanations and grammar notes | ~2min |
| `natural_speed` | Full-speed realistic conversation | ~3min |
| `quiz` | Q&A to test comprehension | ~2min |
| `cultural_note` | Cultural context and tips | ~1min |

**Total:** ~15 minutes for a full "Classroom Style" lesson.

---

## ElevenLabs Integration

### API Endpoint
`POST https://api.elevenlabs.io/v1/text-to-dialogue`

### Request Format
```json
{
  "inputs": [
    { "text": "Welcome to today's lesson!", "voice_id": "EXAVITQu4vr4xnSDxMaL" },
    { "text": "I'm excited to help you learn!", "voice_id": "onwK4e9ZLuTAKqWW03F9" }
  ],
  "model_id": "eleven_v3"
}
```

### Response
Single continuous MP3 file with all speakers' audio seamlessly combined.

### Voice Mapping
Character names map to ElevenLabs voice IDs in `backend/services/elevenlabs_dialogue.py`:
```python
VOICE_MAP = {
    'maria': 'EXAVITQu4vr4xnSDxMaL',  # Bella
    'jordan': 'onwK4e9ZLuTAKqWW03F9',  # Daniel
    # ...
}
```

---

## Data Flow

### Generation Request
```
Frontend                          Backend                         ElevenLabs
   │                                 │                                │
   ├─ POST /api/audio/section/generate ─→                             │
   │  {section_type, language,       │                                │
   │   location, speakers, lines}    │                                │
   │                                 ├─ Check MongoDB cache ──────────│
   │                                 │  Found? Return cached URL      │
   │                                 │  Not found? ↓                  │
   │                                 ├─ POST /v1/text-to-dialogue ────→
   │                                 │                                │
   │                                 ←─────────── MP3 audio ──────────┤
   │                                 │                                │
   │                                 ├─ Save to file storage          │
   │                                 ├─ Save metadata to MongoDB      │
   │                                 │                                │
   ←─ {audio_url, timestamps, ...} ──┤                                │
   │                                 │                                │
   ├─ Download to device cache       │                                │
   ├─ Play audio                     │                                │
```

### Playback
- Each section is ONE continuous audio file
- UI syncs to audio using timestamp data
- Lines have `startTime` and `endTime` within the section audio

---

## File Structure

### Frontend (React Native/Expo)
```
src/lib/
├── types.ts                 # Domain model, 50 languages, 10 locations, 7 sections
├── dialogue-service.ts      # generateConversationWithSections()
├── section-audio-service.ts # getSectionAudio(), device caching
└── dialogue-store.ts        # Zustand state management
```

### Backend (FastAPI/Python)
```
backend/
├── server.py                      # Main FastAPI app
├── routes/audio_cache.py          # /api/audio/section/* endpoints
├── services/elevenlabs_dialogue.py # ElevenLabs API integration
├── services/cache_key_generator.py # Cache key generation
└── models/audio_cache.py          # MongoDB schemas
```

---

## MongoDB Schema

```javascript
AudioCacheEntry {
  cache_key: "en_welcome_coffeeshop_maria_jordan",
  section_type: "welcome",
  language: "en",
  location: "coffeeshop",
  speaker_a: "maria",
  speaker_b: "jordan",
  audio_path: "/audio-cache/en/coffeeshop/en_welcome_coffeeshop_maria_jordan.mp3",
  dialogue_timestamps: [
    { text: "Welcome!", speaker_id: 1, start: 0.0, end: 1.2 },
    { text: "Hello!", speaker_id: 2, start: 1.5, end: 2.8 }
  ],
  duration: 18000,  // milliseconds
  file_size: 285000,
  created_at: Date
}
```

---

## Launch Plan

### Phase 1: Pre-Generation
Before launch, generate all sections for:
- 3 languages: English, Spanish, French
- 10 locations
- Common speaker combinations

**~2,100 sections total** → Run overnight with throttling.

### Phase 2: Launch
- All common combinations are instant
- Rare combinations generate on-demand and cache forever

### Phase 3: Expansion
- Add more languages based on user demand
- Each new language fills cache organically

---

## Key Decisions

### Why section-level, not lesson-level?
Lessons are configurable (users can add/remove sections). Section-level caching means each piece is reusable across any lesson format.

### Why not line-level?
43 separate audio files per lesson sounds unnatural when stitched. Section-level uses ElevenLabs text-to-dialogue for seamless multi-speaker audio.

### Why permanent storage?
The number of unique sections is finite (~35,000 max). Storage is cheap. API calls are not.

---

## Current Status

| Component | Status |
|-----------|--------|
| Frontend section-audio-service.ts | ✅ Built |
| Frontend playback with sections | ✅ Built |
| Backend cache routes | ✅ Built |
| MongoDB schema | ✅ Built |
| ElevenLabs text-to-dialogue integration | ⚠️ Needs verification |
| Pre-generation script | ❌ Not built |
| Feature flag switch to section-based | ❌ Still on line-based |

---

## What NOT to Do

1. **Don't revert to line-by-line** - It works but costs scale linearly
2. **Don't change cache key format** - Breaks all existing cached audio
3. **Don't skip cache lookup** - Defeats the entire purpose
4. **Don't generate without storing** - Every generation must be cached
