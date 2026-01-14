-- Initial schema for Language Learning App
-- This migration creates all core tables needed for the app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  native_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons catalog
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko')),
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
CREATE TABLE IF NOT EXISTS public.lesson_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('welcome', 'vocabulary', 'slow_dialogue', 'breakdown', 'natural_speed', 'quiz', 'cultural_note')),
  order_index INT NOT NULL,
  content JSONB NOT NULL, -- Array of dialogue lines
  audio_url TEXT, -- Storage URL
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lesson_id, section_type)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS public.user_progress (
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
CREATE TABLE IF NOT EXISTS public.audio_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL, -- e.g., "en_welcome_coffeeshop_maria_jordan"
  audio_url TEXT NOT NULL, -- Storage URL
  metadata JSONB, -- timestamps, speaker info, etc.
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lessons_language ON public.lessons(language);
CREATE INDEX IF NOT EXISTS idx_lessons_location ON public.lessons(location);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson_id ON public.lesson_sections(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_cache_cache_key ON public.audio_cache(cache_key);

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

-- Trigger for updated_at timestamps
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
