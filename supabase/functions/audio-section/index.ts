/**
 * Audio Section Edge Function
 *
 * Handles section-based audio caching and generation
 * Replaces the FastAPI /api/audio/section/generate endpoint
 *
 * Flow:
 * 1. Check Supabase audio_cache table for existing entry
 * 2. If found, return cached audio URL from Storage
 * 3. If not found, generate via ElevenLabs and cache
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs voice mapping
const VOICE_MAP: Record<string, string> = {
  maria: 'EXAVITQu4vr4xnSDxMaL', // Bella - female
  jordan: 'onwK4e9ZLuTAKqWW03F9', // Daniel - male
  alex: 'pNInz6obpgDQGcFmaJgB', // Adam - male
  sarah: 'jsCqWAovK2LkecY7zXl4', // Freya - female
  david: 'pNInz6obpgDQGcFmaJgB', // Adam
  emma: 'EXAVITQu4vr4xnSDxMaL', // Bella
  carlos: 'VR6AewLTigWG4xSOukaG', // Arnold
  yuki: 'jsCqWAovK2LkecY7zXl4', // Freya
  priya: 'EXAVITQu4vr4xnSDxMaL', // Bella
  omar: 'pNInz6obpgDQGcFmaJgB', // Adam
  lisa: 'XB0fDUnXU5powFXDhCwa', // Charlotte
  michael: 'TxGEqnHWrfWFTfGW9XjX', // Josh
};

interface DialogueLine {
  text: string;
  spokenText?: string;
  speakerId: number;
  emotion?: string;
}

interface SectionRequest {
  section_type: string;
  language: string;
  location: string;
  speaker_a: string;
  speaker_b: string;
  dialogue_lines: DialogueLine[];
}

function generateCacheKey(
  language: string,
  sectionType: string,
  location: string,
  speakerA: string,
  speakerB: string
): string {
  const lang = language.toLowerCase().trim();
  const section = sectionType.toLowerCase().trim().replace(/_/g, '');
  const loc = location.toLowerCase().trim().replace(/_/g, '').replace(/ /g, '');
  const spkA = speakerA.toLowerCase().trim();
  const spkB = speakerB.toLowerCase().trim();

  return `${lang}_${section}_${loc}_${spkA}_${spkB}`;
}

function calculateTimestamps(
  lines: DialogueLine[]
): Array<{ text: string; speaker_id: number; start: number; end: number; emotion?: string }> {
  const timestamps: Array<{
    text: string;
    speaker_id: number;
    start: number;
    end: number;
    emotion?: string;
  }> = [];
  let currentTime = 0;
  const wordsPerMinute = 150;
  const pauseBetweenSpeakers = 0.3; // 300ms

  for (const line of lines) {
    const textToSpeak = line.spokenText || line.text;
    const wordCount = textToSpeak.split(' ').length;
    const duration = Math.max((wordCount / wordsPerMinute) * 60, 1.5); // minimum 1.5 seconds

    timestamps.push({
      text: line.text,
      speaker_id: line.speakerId,
      start: currentTime,
      end: currentTime + duration,
      emotion: line.emotion,
    });

    currentTime += duration + pauseBetweenSpeakers;
  }

  return timestamps;
}

async function generateElevenLabsDialogue(
  lines: DialogueLine[],
  speakerA: string,
  speakerB: string
): Promise<{ audioBuffer: ArrayBuffer; timestamps: ReturnType<typeof calculateTimestamps> }> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const voiceA = VOICE_MAP[speakerA.toLowerCase()] || VOICE_MAP.maria;
  const voiceB = VOICE_MAP[speakerB.toLowerCase()] || VOICE_MAP.jordan;

  // Build inputs for text-to-dialogue API
  const inputs = lines.map((line) => ({
    text: line.spokenText || line.text,
    voice_id: line.speakerId === 1 ? voiceA : voiceB,
    model_id: 'eleven_multilingual_v2',
  }));

  // Use text-to-dialogue API for multi-speaker audio
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-dialogue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      inputs,
      model_id: 'eleven_v3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('ElevenLabs API error:', error);
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const timestamps = calculateTimestamps(lines);

  return { audioBuffer, timestamps };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { section_type, language, location, speaker_a, speaker_b, dialogue_lines } =
      (await req.json()) as SectionRequest;

    const cacheKey = generateCacheKey(language, section_type, location, speaker_a, speaker_b);

    // Check cache first
    const { data: cached } = await supabase
      .from('audio_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return new Response(
        JSON.stringify({
          cache_key: cacheKey,
          audio_url: cached.audio_url,
          timestamps: cached.metadata?.timestamps || [],
          duration: cached.duration_ms || 0,
          is_cached: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Cache miss for ${cacheKey}, generating...`);

    // Generate audio
    const { audioBuffer, timestamps } = await generateElevenLabsDialogue(
      dialogue_lines,
      speaker_a,
      speaker_b
    );

    // Calculate duration from timestamps
    const duration =
      timestamps.length > 0 ? Math.round(timestamps[timestamps.length - 1].end * 1000) : 0;

    // Upload to Supabase Storage
    const storagePath = `audio-cache/${language}/${location}/${cacheKey}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('audio').getPublicUrl(storagePath);

    // Save to cache table
    const { error: cacheError } = await supabase.from('audio_cache').insert({
      cache_key: cacheKey,
      audio_url: publicUrl,
      metadata: { timestamps, section_type, language, location, speaker_a, speaker_b },
      duration_ms: duration,
    });

    if (cacheError) {
      console.error('Cache insert error:', cacheError);
      // Don't throw - audio was still generated successfully
    }

    return new Response(
      JSON.stringify({
        cache_key: cacheKey,
        audio_url: publicUrl,
        timestamps,
        duration,
        is_cached: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Audio section error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
