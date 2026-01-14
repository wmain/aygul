/**
 * Text-to-Speech Edge Function
 *
 * Proxies TTS requests to OpenAI or ElevenLabs
 * Replaces the FastAPI /api/tts endpoint
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text: string;
  voice: string;
  provider: 'openai' | 'elevenlabs';
}

async function generateOpenAITTS(text: string, voice: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI TTS error: ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = base64Encode(new Uint8Array(audioBuffer));
  return `data:audio/mp3;base64,${base64Audio}`;
}

async function generateElevenLabsTTS(text: string, voiceId: string): Promise<string> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = base64Encode(new Uint8Array(audioBuffer));
  return `data:audio/mp3;base64,${base64Audio}`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice, provider } = (await req.json()) as TTSRequest;

    if (!text || !voice) {
      throw new Error('Missing required fields: text and voice');
    }

    let audioDataUri: string;

    if (provider === 'elevenlabs') {
      audioDataUri = await generateElevenLabsTTS(text, voice);
    } else {
      audioDataUri = await generateOpenAITTS(text, voice);
    }

    return new Response(JSON.stringify({ audio: audioDataUri }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
