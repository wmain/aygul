# Migration Plan: Emergent.sh → Cursor/Claude Code + Supabase + R2

## Overview

We're migrating from:
- **IDE**: Emergent.sh → Cursor + Claude Code
- **Backend**: FastAPI + MongoDB → Supabase (PostgreSQL + Auth + Edge Functions)
- **Audio Storage**: Local/MongoDB → Cloudflare R2

## Current State

| Component | Current | Target |
|-----------|---------|--------|
| Development | Emergent.sh (Vibecode) | Cursor + Claude Code |
| Backend API | FastAPI on port 8001 | Supabase Edge Functions |
| Database | MongoDB | Supabase PostgreSQL |
| Authentication | None | Supabase Auth |
| Audio Storage | MongoDB GridFS / Local | Cloudflare R2 |
| Deployment | Manual | EAS Build + EAS Submit |
| Payments | None | RevenueCat |

---

## Phase 1: Development Environment Setup

### 1.1 Cursor Configuration

Create `.cursor/rules/` directory with:
- `expo-patterns.mdc` - Expo Router, NativeWind, audio handling rules

### 1.2 Claude Code Configuration

Ensure `CLAUDE.md` contains all technical conventions (already done).

### 1.3 Use Remaining Emergent Credits

**Strategy**: Use ~$300 remaining credits for Supabase schema generation via MCP.

Prompt for Emergent:
```
Using the Supabase MCP, create the following tables for a language learning app:

1. users (extends auth.users)
   - id (uuid, FK to auth.users)
   - display_name (text)
   - native_language (text)
   - created_at, updated_at

2. lessons
   - id (uuid)
   - language (text) - en, es, fr
   - location (text) - coffee_shop, restaurant, etc.
   - title (text)
   - description (text)
   - difficulty (text) - beginner, intermediate, advanced
   - created_at

3. lesson_sections
   - id (uuid)
   - lesson_id (FK)
   - section_type (text) - welcome, vocabulary, slow_dialogue, etc.
   - order_index (int)
   - content (jsonb) - the dialogue lines
   - audio_url (text) - R2 URL
   - duration_ms (int)

4. user_progress
   - id (uuid)
   - user_id (FK)
   - lesson_id (FK)
   - completed_sections (text[])
   - last_position_ms (int)
   - completed_at (timestamp nullable)
   - created_at, updated_at

5. audio_cache (for pre-generated content)
   - id (uuid)
   - cache_key (text, unique) - e.g., "en_welcome_coffeeshop_maria_jordan"
   - audio_url (text) - R2 URL
   - metadata (jsonb) - timestamps, duration, etc.
   - created_at

Enable RLS on all tables with appropriate policies.
```

---

## Phase 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project: `language-learning-app`
3. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJ...`
   - Service Role Key: `eyJ...` (keep secret!)

### 2.2 Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  native_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons catalog
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr')),
  location TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  speaker1_name TEXT NOT NULL,
  speaker1_role TEXT NOT NULL,
  speaker2_name TEXT NOT NULL,
  speaker2_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson sections (7 types per lesson)
CREATE TABLE public.lesson_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('welcome', 'vocabulary', 'slow_dialogue', 'breakdown', 'natural_speed', 'quiz', 'cultural_note')),
  order_index INT NOT NULL,
  content JSONB NOT NULL, -- Array of dialogue lines
  audio_url TEXT, -- R2 URL
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lesson_id, section_type)
);

-- User progress tracking
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_sections TEXT[] DEFAULT '{}',
  last_position_ms INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- Audio cache for section lookups
CREATE TABLE public.audio_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL, -- e.g., "en_welcome_coffeeshop_maria_jordan"
  audio_url TEXT NOT NULL, -- R2 URL
  metadata JSONB, -- timestamps, speaker info, etc.
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lessons_language ON public.lessons(language);
CREATE INDEX idx_lessons_location ON public.lessons(location);
CREATE INDEX idx_lesson_sections_lesson_id ON public.lesson_sections(lesson_id);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_audio_cache_cache_key ON public.audio_cache(cache_key);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_cache ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Lessons: everyone can read (public content)
CREATE POLICY "Anyone can view lessons" ON public.lessons
  FOR SELECT TO authenticated, anon USING (true);

-- Lesson sections: everyone can read
CREATE POLICY "Anyone can view lesson sections" ON public.lesson_sections
  FOR SELECT TO authenticated, anon USING (true);

-- User progress: users can only access their own
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Audio cache: everyone can read (public audio)
CREATE POLICY "Anyone can view audio cache" ON public.audio_cache
  FOR SELECT TO authenticated, anon USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.3 Client Setup

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types'; // Generate with supabase gen types

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Add to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Phase 3: Cloudflare R2 Setup

### 3.1 Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket: `language-audio`
3. Enable public access (or use signed URLs)

### 3.2 Configure CORS

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### 3.3 Audio URL Structure

```
https://pub-xxxxx.r2.dev/{language}/{location}/{section_type}_{speaker1}_{speaker2}.mp3

Example:
https://pub-xxxxx.r2.dev/en/coffee_shop/welcome_maria_jordan.mp3
https://pub-xxxxx.r2.dev/en/coffee_shop/vocabulary_maria_jordan.mp3
```

### 3.4 Upload Script

Create `scripts/upload-audio-to-r2.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadAudio(localPath: string, r2Key: string) {
  const fileContent = fs.readFileSync(localPath);

  await R2.send(new PutObjectCommand({
    Bucket: 'language-audio',
    Key: r2Key,
    Body: fileContent,
    ContentType: 'audio/mpeg',
  }));

  console.log(`Uploaded: ${r2Key}`);
}
```

---

## Phase 4: EAS Deployment

### 4.1 Install EAS CLI

```bash
bun add -g eas-cli
eas login
```

### 4.2 Configure EAS

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### 4.3 Build Commands

```bash
# Development build (with dev client)
eas build --profile development --platform ios

# Preview build (TestFlight)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

---

## Phase 5: RevenueCat Integration

### 5.1 Setup RevenueCat

1. Create account at [revenuecat.com](https://www.revenuecat.com)
2. Create app for iOS and Android
3. Configure products:
   - `language_monthly` - $9.99/month
   - `language_yearly` - $79.99/year (33% discount)

### 5.2 Install SDK

```bash
bun add react-native-purchases
```

### 5.3 Initialize

```typescript
import Purchases from 'react-native-purchases';

// In app initialization
Purchases.configure({
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY!,
});

// After user authentication
if (user) {
  await Purchases.logIn(user.id);
}
```

---

## Phase 6: Pre-Generation Script

### 6.1 Content Matrix

```
3 Languages × 10 Locations × 7 Sections = 210 audio files
```

### 6.2 Generation Script

Create `scripts/pre-generate-lessons.ts`:

```typescript
import { generateSectionAudio } from '../backend/services/elevenlabs_dialogue';
import { uploadToR2 } from './upload-audio-to-r2';
import { supabase } from '../src/lib/supabase';

const LANGUAGES = ['en', 'es', 'fr'];
const LOCATIONS = [
  'coffee_shop', 'restaurant', 'airport', 'hotel', 'grocery',
  'doctor', 'pharmacy', 'bank', 'transit', 'clothing'
];
const SECTIONS = [
  'welcome', 'vocabulary', 'slow_dialogue', 'breakdown',
  'natural_speed', 'quiz', 'cultural_note'
];

async function generateAll() {
  for (const language of LANGUAGES) {
    for (const location of LOCATIONS) {
      console.log(`\nGenerating ${language}/${location}...`);

      for (const section of SECTIONS) {
        const cacheKey = `${language}_${section}_${location}`;

        // Check if already exists
        const { data: existing } = await supabase
          .from('audio_cache')
          .select('id')
          .eq('cache_key', cacheKey)
          .single();

        if (existing) {
          console.log(`  ✓ ${section} (cached)`);
          continue;
        }

        // Generate audio
        const audio = await generateSectionAudio(language, location, section);

        // Upload to R2
        const r2Key = `${language}/${location}/${section}.mp3`;
        await uploadToR2(audio.buffer, r2Key);

        // Save to database
        await supabase.from('audio_cache').insert({
          cache_key: cacheKey,
          audio_url: `https://pub-xxxxx.r2.dev/${r2Key}`,
          metadata: audio.metadata,
          duration_ms: audio.duration,
        });

        console.log(`  ✓ ${section} (generated)`);
      }
    }
  }
}
```

---

## Cost Comparison

### Current (MongoDB/FastAPI)

| Service | Monthly Cost |
|---------|--------------|
| MongoDB Atlas (M10) | $57 |
| Render/Railway | $25 |
| ElevenLabs (on-demand) | ~$200 |
| **Total** | **~$282/month** |

### After Migration (Supabase/R2)

| Service | Monthly Cost |
|---------|--------------|
| Supabase (Pro) | $25 |
| Cloudflare R2 (10GB) | $1.50 |
| ElevenLabs (pre-gen only) | $0 (one-time) |
| **Total** | **~$27/month** |

**Savings: ~$255/month (90% reduction)**

---

## Migration Checklist

### Phase 1: Dev Environment
- [ ] Set up Cursor with rules
- [ ] Verify Claude Code with CLAUDE.md
- [ ] Use Emergent credits for Supabase MCP

### Phase 2: Supabase
- [ ] Create Supabase project
- [ ] Run schema SQL
- [ ] Generate TypeScript types
- [ ] Add client to app
- [ ] Test auth flow

### Phase 3: R2 Audio
- [ ] Create R2 bucket
- [ ] Configure CORS
- [ ] Create upload script
- [ ] Upload existing audio

### Phase 4: Deployment
- [ ] Configure eas.json
- [ ] Test development build
- [ ] Test preview build
- [ ] Submit to TestFlight

### Phase 5: Payments
- [ ] Set up RevenueCat
- [ ] Configure products
- [ ] Add SDK to app
- [ ] Test purchase flow

### Phase 6: Launch Content
- [ ] Run pre-generation script
- [ ] Verify all 210 audio files
- [ ] Populate lessons table
- [ ] Test complete flow

---

## Rollback Plan

If issues arise:
1. FastAPI backend remains operational
2. MongoDB data is preserved
3. Can switch back by changing API URLs in app config

Keep MongoDB running for 30 days post-migration as safety net.
