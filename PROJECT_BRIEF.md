# Language Learning App - Project Brief

## Vision

A mobile app that teaches language through **listening to natural conversations** - think Pimsleur meets Duolingo, powered by AI-generated content. Users hear realistic AI-to-AI dialogues with synchronized subtitles before ever being asked to speak.

## Core Philosophy: "Listen First, Then Practice"

Traditional language apps jump straight to quizzes and speaking exercises. We believe in **passive immersion first**:

1. **Hear a natural conversation** between two AI speakers in your target language
2. **See synchronized subtitles** highlighting the current phrase
3. **Vocabulary and breakdown sections** explain what you heard
4. **Then practice** with quizzes and (future) live AI conversation

This mirrors how children learn language - extensive listening before speaking.

## Key Innovation: Core Script Architecture

Every lesson starts with a **natural dialogue** (the "Core Script"). All pedagogical content derives from this:

```
Core Script (Natural Dialogue)
    ├── Vocabulary Section (extracted key words)
    ├── Slow Dialogue (same script, slower pace)
    ├── Breakdown Section (grammar explanations)
    ├── Quiz Questions (derived from dialogue)
    └── Cultural Notes (context for the conversation)
```

This ensures consistency - vocabulary words appear in the dialogue you'll hear, quiz questions reference actual phrases spoken.

## Target Launch

**3 Languages × 10 Scenarios = 30 Core Lessons**

Languages:
- English (for non-native speakers)
- Spanish
- French

Scenarios (Locations):
- Coffee Shop
- Restaurant
- Airport
- Hotel
- Grocery Store
- Doctor's Office
- Pharmacy
- Bank
- Public Transit
- Clothing Store

## Key Features

### 1. Lesson Builder (Drag & Drop)

Users customize their lesson structure by arranging colored blocks:
- **Cyan** - Welcome
- **Violet** - Vocabulary
- **Sky** - Slow Dialogue
- **Amber** - Breakdown
- **Emerald** - Conversation (Natural Speed)
- **Red** - Quiz
- **Pink** - Cultural Note

Presets available: Quick Dialogue, Vocabulary First, Classroom Style, Immersion, Custom

### 2. Lesson Player

- Synchronized audio + text highlighting
- Section headers show current segment
- Flashcard-style vocabulary cards
- Interactive quiz cards with feedback
- Playback controls (play/pause, skip section, replay)

### 3. (Future) Live AI Conversation

After passive learning, users can have a live conversation with an AI tutor that adapts to their level and references the lesson content.

## Current Status

**What Works:**
- Configuration screen (language, location, format, characters)
- Playback screen with section-aware UI
- Lesson builder with drag-and-drop
- Backend cache infrastructure
- Line-by-line audio generation (expensive but functional)

**In Progress:**
- Section-based audio caching (dramatically reduces API costs)
- Pre-generation script for launch content
- Migration to Supabase + Cloudflare R2

**Not Started:**
- Live AI conversation feature
- User accounts and progress tracking
- Subscription/payment integration

## Business Model

**Freemium with Subscriptions:**
- Free: Limited lessons per day, basic features
- Premium: Unlimited lessons, all languages, offline mode, live AI tutoring

Targeting RevenueCat for subscription management.

## Technical Architecture

**Offline-First Design:**
- ~2GB of pre-generated ElevenLabs audio for launch content
- Audio cached on Cloudflare R2 (global CDN)
- Device-level caching for instant replay
- Works without internet after initial download

**Cost Optimization:**
- Section-based caching means ElevenLabs is called ONCE per unique section
- Cache key: `{language}_{sectionType}_{location}_{speakerA}_{speakerB}`
- Post-launch: All audio pre-generated, zero ongoing ElevenLabs costs

## Current Sprint Focus

1. Complete section-based audio caching implementation
2. Migrate from MongoDB/FastAPI to Supabase
3. Move audio storage to Cloudflare R2
4. Set up EAS deployment pipeline
5. Pre-generate launch content (30 lessons × 7 sections)

## Team & Tools

- **Development**: Cursor, Claude Code
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Audio Storage**: Cloudflare R2
- **Audio Generation**: ElevenLabs (text-to-dialogue)
- **Deployment**: Expo EAS
- **Payments**: RevenueCat
