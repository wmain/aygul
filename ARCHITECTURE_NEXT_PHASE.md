# Next Phase: Section-Based Audio Caching System

## Current State (This Commit)
✅ expo-av → expo-audio migration complete
✅ Basic bundled audio working for English Coffee Shop (line-by-line)
✅ Development mode with instant loading

## Architectural Limitations to Address
❌ Current: 43 audio files per lesson (one per dialogue line)
❌ Current: No character customization support in bundled mode
❌ Current: No server-side caching
❌ Current: No production caching strategy

---

## Target Architecture (Next Phase)

### Core Concept: Section-Level Audio Caching

**Key Innovation:** Cache audio at SECTION level, not lesson level
- Each section is ONE continuous audio file with all speakers
- Preserves natural conversation flow (no stitching)
- Enables character customization with efficient caching

### Cache Key Format:
```
{language}_{sectionType}_{location}_{speakerA}_{speakerB}

Examples:
- en_welcome_coffeeshop_maria_jordan
- es_vocabulary_restaurant_carlos_ana
```

### 3-Tier Caching System:

```
User Request
    ↓
1. Check Local Device Cache (expo-file-system)
    ↓ (if not found)
2. Check Server/Database Cache (MongoDB + file storage)
    ↓ (if not found)
3. Generate via ElevenLabs API → Cache at all levels
```

**Key Benefit:** External API called only ONCE per unique section+speaker combination, ever.

---

## Audio Structure Comparison

### Current (Line-Based):
```
English Coffee Shop Lesson:
- line_0.mp3 (Maria: "Welcome!")
- line_1.mp3 (Jordan: "Hello!")
- line_2.mp3 (Maria: "Today we'll learn...")
... 43 files total

Problem: Unnatural stitching, no speaker customization
```

### Target (Section-Based):
```
English Coffee Shop Lesson:
- en_welcome_coffeeshop_maria_jordan.mp3 (5 lines, 18s)
- en_vocabulary_coffeeshop_maria_jordan.mp3 (4 lines, 31s)
- en_slowdialogue_coffeeshop_maria_jordan.mp3 (6 lines, 35s)
... 7 files total

Benefit: Natural flow, character customization, efficient caching
```

---

## Technical Implementation Plan

### Backend Components:

**1. MongoDB Schema:**
```javascript
AudioCacheCollection {
  cacheKey: "en_welcome_coffeeshop_maria_jordan", // indexed
  sectionType: "welcome",
  language: "en",
  location: "coffeeshop",
  speakerA: "maria",
  speakerB: "jordan",
  audioPath: "/audio-cache/en/coffeeshop/welcome_maria_jordan.mp3",
  dialogueTimestamps: [ // Estimated or calculated
    { text: "Welcome!", speakerId: 1, start: 0, end: 1.2 },
    { text: "Hello!", speakerId: 2, start: 1.5, end: 2.8 }
  ],
  duration: 18000, // ms
  fileSize: 285000, // bytes
  createdAt: Date
}
```

**2. File Storage:**
- Location: `/app/backend/audio-cache/` (local file system)
- Structure: `{language}/{location}/{cacheKey}.mp3`
- Future: Migrate to S3 for production scaling

**3. API Endpoints:**
```
GET  /api/audio/section/:cacheKey
  → Returns { audioUrl, timestamps, duration } or 404

POST /api/audio/section/generate
  → Body: { sectionData, speakers, language, location }
  → Generates cacheKey
  → Checks cache → Returns if exists
  → Generates via ElevenLabs → Stores → Returns
```

### Frontend Components:

**1. New Service Layer:**
```typescript
// src/lib/section-audio-service.ts

- generateSectionAudio(section, speakers) 
- getCachedSection(cacheKey)
- downloadAndCacheSection(cacheKey, audioUrl)
- getSectionTimestamps(section)
```

**2. Updated Playback:**
```typescript
// src/app/playback.tsx

- Load ONE section audio file at a time
- Use DialogueLine[] timestamps for UI highlighting
- Auto-advance between sections with brief pause
- Section navigation controls
```

**3. Device Caching:**
```typescript
// expo-file-system
const CACHE_DIR = FileSystem.documentDirectory + 'audio-cache/';

- Store downloaded sections locally
- Persist across app sessions
- Manage cache size/cleanup
```

---

## ElevenLabs Integration Details

### Text to Dialogue API:
**Endpoint:** `POST /v1/text-to-dialogue`

**Request:**
```json
{
  "inputs": [
    { "text": "Welcome to the lesson!", "voice_id": "maria_voice" },
    { "text": "I'm ready to learn!", "voice_id": "jordan_voice" },
    { "text": "Let's start with vocabulary.", "voice_id": "maria_voice" }
  ],
  "model_id": "eleven_v3"
}
```

**Response:** One continuous MP3 file

**Note:** Does NOT include timestamps. We'll need to:
- Calculate timestamps based on text length (estimated)
- OR use separate Speech-to-Text API to get alignment
- OR store timing data during generation

---

## Migration Strategy

### Incremental Approach:

**Step 1:** Backend Only ✅
- Add MongoDB schema
- Create API endpoints
- Test ElevenLabs dialogue API
- **Frontend unchanged**

**Step 2:** New Data Layer (Parallel) ✅
- Create section-audio-service.ts
- Add new types
- Keep old system working
- **Feature flag to switch**

**Step 3:** Update Playback ✅
- Modify playback.tsx for section audio
- Test thoroughly
- **Can rollback if issues**

**Step 4:** Full Cutover ✅
- Remove old line-based code
- Delete deprecated files
- Update documentation

---

## Questions Answered:

1. **Audio Generation:** ElevenLabs `/v1/text-to-dialogue` API ✅
2. **Storage:** Local file system initially, S3 later ✅
3. **Timestamps:** Calculate based on text length (can improve later) ✅
4. **Migration:** Incremental with feature flag ✅
5. **Transitions:** 1.5s pause + auto-advance + manual controls ✅

---

## Storage Solution Decision

**For Now (Fast Start):**
- Local file storage at `/app/backend/audio-cache/`
- Sufficient for MVP and testing
- No external dependencies needed

**For Production (Future):**
- Migrate to S3 + CloudFront CDN
- Better scalability and global distribution
- Easy migration path (just change file paths)

**MongoDB:**
- Stores metadata + S3 URLs (or local paths)
- Enables fast cache lookups
- Tracks usage statistics

---

## Next Session Starts With:
1. Test ElevenLabs text-to-dialogue API with sample data
2. Build backend caching endpoints
3. Set up local file storage
4. Create new section-based generation logic

**Status:** Ready for GitHub commit ✅
**Next Phase:** Backend infrastructure + ElevenLabs dialogue integration
