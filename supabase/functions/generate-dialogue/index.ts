/**
 * Generate Dialogue Edge Function
 *
 * Proxies dialogue generation requests to OpenAI GPT-4o-mini
 * Replaces the FastAPI /api/generate-dialogue endpoint
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DialogueRequest {
  config: {
    language: string;
    location: string;
    situation: string;
    difficulty: string;
    format?: string;
  };
  prompt?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { config, prompt } = (await req.json()) as DialogueRequest;

    // Build the prompt for dialogue generation
    const systemPrompt = `You are a language learning content generator. Generate realistic, educational dialogue for language learners.`;

    const userPrompt =
      prompt ||
      `Generate a ${config.language} language lesson dialogue for a ${config.difficulty} level student.
Location: ${config.location}
Situation: ${config.situation}

Format each line as:
[Speaker Number]|[Segment Type]|[Optional Emotion]|[Content]

Segment types: WELCOME, VOCAB, SLOW, BREAKDOWN, NATURAL, QUIZ, CULTURAL`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({
        output: [
          {
            content: [{ text: generatedText }],
          },
        ],
        output_text: generatedText,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Generate dialogue error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
