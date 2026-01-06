import type { ConversationConfig, DialogueLine, GeneratedDialogue, LessonSegmentType } from './types';
import { LOCATIONS, LANGUAGES } from './types';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useDevSettingsStore, type TTSProvider } from './dev-settings-store';
import { getBundledLesson, getBundledLessonKey, hasBundledLesson, getBundledLessonAsync } from './bundled-lessons';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY;

// OpenAI TTS voices mapped by speaker name
// Available voices: alloy, echo, fable, onyx, nova, shimmer
const OPENAI_SPEAKER1_VOICE_MAP: Record<string, string> = {
  'Alex': 'echo',      // male
  'Maria': 'nova',     // female
  'James': 'onyx',     // male deep
  'Sarah': 'shimmer',  // female
  'David': 'echo',     // male
  'Emma': 'nova',      // female
  'Carlos': 'onyx',    // male
  'Yuki': 'shimmer',   // female
  'Priya': 'nova',     // female
  'Omar': 'onyx',      // male
};

const OPENAI_SPEAKER2_VOICE_MAP: Record<string, string> = {
  'Jordan': 'alloy',   // neutral
  'Lisa': 'shimmer',   // female
  'Michael': 'onyx',   // male deep
  'Ana': 'nova',       // female
  'Kevin': 'echo',     // male
  'Nina': 'shimmer',   // female
  'Hassan': 'alloy',   // neutral
  'Mei': 'nova',       // female
  'Ben': 'echo',       // male
  'Sofia': 'shimmer',  // female
};

// ElevenLabs voice IDs - high quality multilingual voices
// These are pre-made voices available on ElevenLabs
const ELEVENLABS_SPEAKER1_VOICE_MAP: Record<string, string> = {
  'Alex': 'pNInz6obpgDQGcFmaJgB',      // Adam - male, deep
  'Maria': 'EXAVITQu4vr4xnSDxMaL',     // Bella - female, warm
  'James': 'VR6AewLTigWG4xSOukaG',     // Arnold - male, authoritative
  'Sarah': 'jsCqWAovK2LkecY7zXl4',     // Freya - female, expressive
  'David': 'pNInz6obpgDQGcFmaJgB',     // Adam
  'Emma': 'EXAVITQu4vr4xnSDxMaL',      // Bella
  'Carlos': 'VR6AewLTigWG4xSOukaG',    // Arnold
  'Yuki': 'jsCqWAovK2LkecY7zXl4',      // Freya
  'Priya': 'EXAVITQu4vr4xnSDxMaL',     // Bella
  'Omar': 'pNInz6obpgDQGcFmaJgB',      // Adam
};

const ELEVENLABS_SPEAKER2_VOICE_MAP: Record<string, string> = {
  'Jordan': 'onwK4e9ZLuTAKqWW03F9',    // Daniel - male, calm
  'Lisa': 'XB0fDUnXU5powFXDhCwa',      // Charlotte - female, sophisticated
  'Michael': 'TxGEqnHWrfWFTfGW9XjX',   // Josh - male, young
  'Ana': 'XB0fDUnXU5powFXDhCwa',       // Charlotte
  'Kevin': 'onwK4e9ZLuTAKqWW03F9',     // Daniel
  'Nina': 'jsCqWAovK2LkecY7zXl4',      // Freya
  'Hassan': 'TxGEqnHWrfWFTfGW9XjX',    // Josh
  'Mei': 'XB0fDUnXU5powFXDhCwa',       // Charlotte
  'Ben': 'onwK4e9ZLuTAKqWW03F9',       // Daniel
  'Sofia': 'jsCqWAovK2LkecY7zXl4',     // Freya
};

// Fallback voices if name not found
const OPENAI_FALLBACK_VOICES = {
  speaker1: 'nova',
  speaker2: 'alloy',
};

const ELEVENLABS_FALLBACK_VOICES = {
  speaker1: 'EXAVITQu4vr4xnSDxMaL', // Bella
  speaker2: 'onwK4e9ZLuTAKqWW03F9', // Daniel
};

interface ParsedLine {
  speakerId: 1 | 2;
  segmentType?: string;
  emotion?: string;
  text: string;
  /** The actual words spoken aloud (for sections where display differs from speech) */
  spokenText?: string;
}

function getVoiceByName(name: string, speakerNumber: 1 | 2, provider: TTSProvider): string {
  if (provider === 'elevenlabs') {
    if (speakerNumber === 1) {
      return ELEVENLABS_SPEAKER1_VOICE_MAP[name] || ELEVENLABS_FALLBACK_VOICES.speaker1;
    }
    return ELEVENLABS_SPEAKER2_VOICE_MAP[name] || ELEVENLABS_FALLBACK_VOICES.speaker2;
  }

  // OpenAI
  if (speakerNumber === 1) {
    return OPENAI_SPEAKER1_VOICE_MAP[name] || OPENAI_FALLBACK_VOICES.speaker1;
  }
  return OPENAI_SPEAKER2_VOICE_MAP[name] || OPENAI_FALLBACK_VOICES.speaker2;
}

function getLocationLabel(location: string): string {
  return LOCATIONS.find((l) => l.value === location)?.label || location;
}

function getLanguageLabel(languageCode: string): string {
  return LANGUAGES.find((l) => l.value === languageCode)?.label || languageCode;
}

function generatePrompt(config: ConversationConfig): string {
  const languageLabel = getLanguageLabel(config.language);

  const difficultyGuide = {
    beginner: `BEGINNER LEVEL - STRICTLY FOLLOW:
- Use ONLY simple vocabulary (common everyday words)
- Keep sentences SHORT (5-8 words maximum)
- Use basic grammar only (present simple, past simple)
- NO idioms, NO slang, NO complex phrases
- Use clear, direct language
- Repeat key vocabulary for reinforcement
- Speak at a SLOW pace`,
    intermediate: `INTERMEDIATE LEVEL:
- Use natural conversational ${languageLabel}
- Include common idioms and phrasal verbs
- Use varied sentence structures (compound sentences)
- Include some colloquial expressions
- Natural flow with appropriate fillers
- Medium length sentences (10-15 words)
- Speak at a MODERATE pace`,
    advanced: `ADVANCED LEVEL:
- Use sophisticated vocabulary and expressions
- Include complex idioms, metaphors, and nuanced language
- Use advanced grammar (conditionals, passive voice, subjunctive)
- Include subtle humor, sarcasm, or cultural references
- Natural interruptions and overlapping thoughts
- Complex sentence structures with multiple clauses
- Speak at a NATURAL, fast pace`,
  };

  const locationLabel = getLocationLabel(config.location);

  // Build segment instructions based on lesson format
  const segmentTypes = config.lessonSegments.map((s) => s.type);
  const segmentInstructions = buildSegmentInstructions(segmentTypes, languageLabel, config);

  return `Create a ${languageLabel} language lesson for a student at a ${locationLabel}.

IMPORTANT: The entire lesson content MUST be in ${languageLabel}. Do NOT use English unless ${languageLabel} is English.

Situation: ${config.situation}

Speaker 1: ${config.speaker1.name} (${config.speaker1.role})
Speaker 2: ${config.speaker2.name} (${config.speaker2.role})

${difficultyGuide[config.difficulty]}

${segmentInstructions}

Format each line as:
[Speaker Number]|[Segment Type]|[Optional Emotion]|[Content in ${languageLabel}]

Segment types: WELCOME, VOCAB, SLOW, BREAKDOWN, NATURAL, QUIZ, CULTURAL

Examples:
1|WELCOME|[warm]|Hello everyone! I'm ${config.speaker1.name}, and I'll be your guide today.
2|WELCOME|[friendly]|And I'm ${config.speaker2.name}! We're excited to help you practice.
1|VOCAB||Key word: "café" - a coffee shop
2|SLOW|[friendly]|Buenos días, ¿qué le puedo ofrecer?
1|BREAKDOWN||"¿Qué le puedo ofrecer?" means "What can I offer you?"
1|NATURAL|[casual]|Un café con leche, por favor.
1|QUIZ||What does "café con leche" mean?
1|CULTURAL||In Spain, it's common to stand at the bar for a quick coffee.

Generate the ${languageLabel} lesson now:`;
}

// Defines how to transition INTO a section from the previous one
const SECTION_TRANSITIONS: Record<LessonSegmentType, Record<LessonSegmentType, string>> = {
  welcome: {
    welcome: '',
    vocabulary: '',
    slow_dialogue: '',
    breakdown: '',
    natural_speed: '',
    quiz: '',
    cultural_note: '',
  },
  vocabulary: {
    welcome: `Transition naturally from the welcome by saying something like "Now, before we jump into the conversation, let's go over some key words you'll hear..."`,
    vocabulary: '',
    slow_dialogue: `Transition from the slow dialogue by saying "Let's make sure you know the key vocabulary from what we just heard..."`,
    breakdown: `After the breakdown, introduce vocabulary with "Now let's expand on that with a few more essential words..."`,
    natural_speed: `After the natural conversation, say "Let's review the key vocabulary we used in that exchange..."`,
    quiz: `After the quiz, introduce vocabulary with "Great job! Now let's add some more words to your toolkit..."`,
    cultural_note: `After the cultural notes, transition with "With that context in mind, here are some words you'll need..."`,
  },
  slow_dialogue: {
    welcome: `Transition from welcome by saying "Alright, let's ease into it with a slow-paced version of the conversation..."`,
    vocabulary: `After vocabulary, transition with "Now that you know those words, let's hear them in action—nice and slow at first..."`,
    slow_dialogue: '',
    breakdown: `After the breakdown, say "Let's practice with a slower version so you can focus on the pronunciation..."`,
    natural_speed: `After the natural speed dialogue, say "Now let's slow that down so you can catch every word..."`,
    quiz: `After the quiz, transition with "Great job! Let's do a slow practice round..."`,
    cultural_note: `After cultural notes, say "With that background, let's try a slow practice conversation..."`,
  },
  breakdown: {
    welcome: `Transition from welcome by saying "Before we practice, let me break down some key phrases you'll need..."`,
    vocabulary: `After vocabulary, say "Now let's look at how these words come together in useful phrases..."`,
    slow_dialogue: `After the slow dialogue, transition with "Let's break down what you just heard—I'll explain the key phrases..."`,
    breakdown: '',
    natural_speed: `After the natural conversation, say "Let me break down some of the more complex phrases from that exchange..."`,
    quiz: `After the quiz, say "Now let's go deeper into the grammar and structure of what we covered..."`,
    cultural_note: `After cultural notes, transition with "Now let's look at the language patterns behind what we discussed..."`,
  },
  natural_speed: {
    welcome: `Transition from welcome with "Alright, let's dive right into a natural conversation—just like you'd hear in real life..."`,
    vocabulary: `After vocabulary, say "Now let's put those words into action with a real conversation at natural speed..."`,
    slow_dialogue: `After the slow dialogue, say "Great! Now let's hear that same type of conversation at natural, everyday speed..."`,
    breakdown: `After the breakdown, say "Now that you understand the phrases, let's hear a full conversation at natural speed..."`,
    natural_speed: '',
    quiz: `After the quiz, say "Excellent! Now let's hear another natural conversation to reinforce what you've learned..."`,
    cultural_note: `After cultural notes, transition with "With that cultural context, here's how a real conversation would sound..."`,
  },
  quiz: {
    welcome: `Transition from welcome with "Let's start with a quick check of what you already know..."`,
    vocabulary: `After vocabulary, say "Now let's test yourself on those words we just learned. I'll ask a question, give you a moment to think, then reveal the answer..."`,
    slow_dialogue: `After the slow dialogue, say "Let's check your understanding of what we just practiced..."`,
    breakdown: `After the breakdown, say "Time to test those phrases! I'll quiz you on what we just covered..."`,
    natural_speed: `After the natural conversation, say "Alright, let's see what you picked up from that conversation. I'll ask about the vocabulary, phrases, and details from the dialogue..."`,
    quiz: '',
    cultural_note: `After cultural notes, say "Let's see how much you remember—quiz time..."`,
  },
  cultural_note: {
    welcome: `Transition from welcome with "Before we practice, here's some helpful cultural context..."`,
    vocabulary: `After vocabulary, say "Now, a bit of cultural background that will help you use these words naturally..."`,
    slow_dialogue: `After the slow dialogue, say "Here's some cultural context that will help you understand why people speak this way..."`,
    breakdown: `After the breakdown, say "Let me share some cultural insights that explain these expressions..."`,
    natural_speed: `After the natural conversation, say "Now let me give you some cultural context about what you just heard..."`,
    quiz: `After the quiz, say "Great job! Now for some cultural background that ties everything together..."`,
    cultural_note: '',
  },
};

// Defines how to close out a section before transitioning to the next
const SECTION_CLOSINGS: Record<LessonSegmentType, Record<LessonSegmentType, string>> = {
  welcome: {
    welcome: '',
    vocabulary: `End the welcome by teasing what's next: "Let's start by learning some essential vocabulary..."`,
    slow_dialogue: `End welcome by saying "Let's begin with a slow, clear version of the conversation..."`,
    breakdown: `End welcome with "First, let me break down some key phrases for you..."`,
    natural_speed: `End welcome with "Let's jump right into a natural conversation..."`,
    quiz: `End welcome with "Let's see what you already know with a quick warm-up quiz..."`,
    cultural_note: `End welcome with "First, some cultural context that will help you understand..."`,
  },
  vocabulary: {
    welcome: '',
    vocabulary: '',
    slow_dialogue: `End vocabulary with "Now let's hear these words in a real conversation—we'll take it slow..."`,
    breakdown: `End vocabulary with "Now let's look at how to put these words together in phrases..."`,
    natural_speed: `End vocabulary with "Time to hear these words in action at natural speed..."`,
    quiz: `End vocabulary with "Let's test how well you remember these words..."`,
    cultural_note: `End vocabulary with "Now some cultural context about when to use these words..."`,
  },
  slow_dialogue: {
    welcome: '',
    vocabulary: `End slow dialogue with "Now let's go over the vocabulary from that conversation..."`,
    slow_dialogue: '',
    breakdown: `End slow dialogue with "Let me break down the key phrases you just heard..."`,
    natural_speed: `End slow dialogue with "Now let's hear that at natural, everyday speed..."`,
    quiz: `End slow dialogue with "Let's check your understanding with a quick quiz..."`,
    cultural_note: `End slow dialogue with "Here's some cultural context about that interaction..."`,
  },
  breakdown: {
    welcome: '',
    vocabulary: `End breakdown with "Let's add some more vocabulary to your toolkit..."`,
    slow_dialogue: `End breakdown with "Now let's practice with a slow version..."`,
    breakdown: '',
    natural_speed: `End breakdown with "Now that you understand the phrases, let's hear a natural conversation..."`,
    quiz: `End breakdown with "Time to test what you've learned..."`,
    cultural_note: `End breakdown with "Let me share some cultural insights related to these phrases..."`,
  },
  natural_speed: {
    welcome: '',
    vocabulary: `End natural dialogue with "Let's review the key vocabulary from that conversation..."`,
    slow_dialogue: `End natural dialogue with "Now let's slow that down for practice..."`,
    breakdown: `End natural dialogue with "Let me break down some of those phrases for you..."`,
    natural_speed: '',
    quiz: `End natural dialogue with "Let's test what you picked up from that conversation..."`,
    cultural_note: `End natural dialogue with "Here's some cultural background about what you just heard..."`,
  },
  quiz: {
    welcome: '',
    vocabulary: `End quiz with "Great job! Let's add some more vocabulary..."`,
    slow_dialogue: `End quiz with "Well done! Now let's do some slow practice..."`,
    breakdown: `End quiz with "Good work! Let's go deeper into the grammar..."`,
    natural_speed: `End quiz with "Excellent! Now let's hear another natural conversation..."`,
    quiz: '',
    cultural_note: `End quiz with "Nice work! Now for some cultural context..."`,
  },
  cultural_note: {
    welcome: '',
    vocabulary: `End cultural notes with "Now let's learn some vocabulary related to this..."`,
    slow_dialogue: `End cultural notes with "Let's practice a conversation with this in mind—nice and slow..."`,
    breakdown: `End cultural notes with "Now let's look at the language patterns..."`,
    natural_speed: `End cultural notes with "Here's how a real conversation sounds with this context..."`,
    quiz: `End cultural notes with "Let's see how much you remember..."`,
    cultural_note: '',
  },
};

function buildSegmentInstructions(segments: LessonSegmentType[], language: string, config: ConversationConfig): string {
  const instructions: string[] = [];

  instructions.push(`CRITICAL - CONTINUOUS LESSON FLOW:
This lesson must sound like ONE continuous class taught by two teachers, NOT separate audio clips stitched together.
- Each section should TRANSITION SMOOTHLY into the next
- Speakers should reference what they just covered and preview what's coming
- Use natural bridging phrases between sections
- The teachers are having a real class together, not reading isolated scripts

IMPORTANT SEGMENT TYPE RULE:
- When a speaker says something like "Now let's learn vocabulary..." or "Let's move on to the quiz...", that line should be marked with the segment type of the section it's INTRODUCING, NOT the section it's coming from.
- Example: "Let's start with some vocabulary!" should be marked as VOCAB, not WELCOME.

LESSON STRUCTURE - Generate content in this exact order:\n`);

  let sectionNum = 1;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = i > 0 ? segments[i - 1] : null;
    const nextSegment = i < segments.length - 1 ? segments[i + 1] : null;

    // Get transition instructions
    const transitionIn = prevSegment ? SECTION_TRANSITIONS[segment][prevSegment] : '';
    const transitionOut = nextSegment ? SECTION_CLOSINGS[segment][nextSegment] : '';

    switch (segment) {
      case 'welcome':
        instructions.push(`${sectionNum}. WELCOME/INTRODUCTION SECTION (marked as WELCOME):
   - ${config.speaker1.name} and ${config.speaker2.name} greet the learner warmly
   - They introduce themselves by name and role (e.g., "${config.speaker1.name}" as "${config.speaker1.role}", "${config.speaker2.name}" as "${config.speaker2.role}")
   - Briefly explain what the lesson will cover: "${config.situation}" at the ${getLocationLabel(config.location)}
   - Set expectations for what the learner will practice
   - Generate 4-6 lines of welcoming dialogue between both speakers
   - NOTE: Do NOT include transition to the next section in WELCOME lines`);
        break;
      case 'vocabulary':
        instructions.push(`${sectionNum}. VOCABULARY SECTION (marked as VOCAB):
   ${transitionIn ? `- FIRST LINE: A transition from ${prevSegment} - "${transitionIn}" (marked as VOCAB, not ${prevSegment?.toUpperCase()})` : ''}
   - Introduce 5-8 key words/phrases relevant to the situation
   - Each vocab line has TWO parts:
     * "text" field: The word and definition in dictionary format (e.g., "espresso - a strong coffee made by forcing hot water through grounds")
     * "spokenText" field: The conversational explanation teachers would say (e.g., "Our first word is espresso. An espresso is a strong coffee made by forcing hot water through coffee grounds. You'll see this on almost every coffee shop menu.")
   - IMPORTANT: Do NOT include punctuation (periods, question marks, etc.) attached to the vocabulary word itself. Write "espresso" not "espresso." or "espresso?"
   - Include pronunciation hints if helpful
   ${transitionOut ? `- LAST LINE: A transition to ${nextSegment} (marked as ${nextSegment?.toUpperCase()}, not VOCAB)` : ''}`);
        break;
      case 'slow_dialogue':
        instructions.push(`${sectionNum}. SLOW DIALOGUE SECTION (marked as SLOW):
   ${transitionIn ? `- FIRST LINE: A transition from ${prevSegment} - "${transitionIn}" (marked as SLOW, not ${prevSegment?.toUpperCase()})` : ''}
   - Generate 10-12 lines of dialogue at a SLOW, CLEAR pace
   - Each line should be shorter and more deliberate
   - Include [slow] emotion tag where appropriate
   - Natural back-and-forth between speakers
   ${transitionOut ? `- LAST LINE: A transition to ${nextSegment} (marked as ${nextSegment?.toUpperCase()}, not SLOW)` : ''}`);
        break;
      case 'breakdown':
        instructions.push(`${sectionNum}. BREAKDOWN SECTION (marked as BREAKDOWN):
   ${transitionIn ? `- FIRST LINE: A transition from ${prevSegment} - "${transitionIn}" (marked as BREAKDOWN, not ${prevSegment?.toUpperCase()})` : ''}
   - Explain 4-6 key phrases from the dialogue
   - Speaker 1 provides explanations
   - Each breakdown line has TWO parts:
     * "text" field: The phrase with explanation (e.g., "How can I help you? - A common greeting from service staff")
     * "spokenText" field: The conversational explanation (e.g., "Now let's break down 'How can I help you?' This is a very common greeting you'll hear from service staff...")
   - Include grammar notes and cultural context
   ${transitionOut ? `- LAST LINE: A transition to ${nextSegment} (marked as ${nextSegment?.toUpperCase()}, not BREAKDOWN)` : ''}`);
        break;
      case 'natural_speed':
        instructions.push(`${sectionNum}. NATURAL SPEED DIALOGUE (marked as NATURAL):
   ${transitionIn ? `- FIRST LINE: A transition from ${prevSegment} - "${transitionIn}" (marked as NATURAL, not ${prevSegment?.toUpperCase()})` : ''}
   - Generate 16-24 lines of natural conversation
   - Use natural pacing and rhythm for ${language}
   - Include emotions and natural reactions
   - Complete conversation with beginning, middle, end
   ${transitionOut ? `- LAST LINE: A transition to ${nextSegment} (marked as ${nextSegment?.toUpperCase()}, not NATURAL)` : ''}`);
        break;
      case 'quiz':
        instructions.push(`${sectionNum}. QUIZ/RECALL SECTION (marked as QUIZ):
   ${transitionIn ? `- FIRST LINE: A transition from ${prevSegment} - "${transitionIn}" (marked as QUIZ, not ${prevSegment?.toUpperCase()})` : ''}

   CRITICAL: Quiz questions MUST directly test content from EARLIER sections of THIS lesson:
   - Questions about VOCABULARY words that were introduced in the Vocabulary section
   - Questions about PHRASES that were explained in the Breakdown section
   - Questions about EVENTS/DETAILS from the Natural Speed Conversation (comprehension)

   Include 4-6 question/answer pairs using these QUESTION TYPES (mix them):

   TYPE 1 - Vocabulary Recall: Test words from the Vocabulary section
     Question text: "What does '[word from vocab section]' mean?"
     Answer text: "[the definition, brief]"

   TYPE 2 - Phrase Meaning: Test phrases from the Breakdown section
     Question text: "What does '[phrase from breakdown]' mean?"
     Answer text: "[the meaning, brief]"

   TYPE 3 - Comprehension: Test details from the Natural Speed Conversation
     Question text: "What did [character] [do/order/ask for]?"
     Answer text: "[specific detail from conversation]"

   TYPE 4 - Production/Recall: Ask how to say something
     Question text: "How do you politely [action from lesson]?"
     Answer text: "[the phrase taught]"

   FORMAT - Alternate between QUESTION lines and ANSWER lines:
   - Each line has TWO parts:
     * "text" field: SHORT text for flashcard display (question or answer only)
     * "spokenText" field: Full conversational narration with context
   - For QUESTIONS:
     * text: Just the question (e.g., "What does 'espresso' mean?")
     * spokenText: Full prompt (e.g., "Question one: What does espresso mean? We learned this word earlier. Take a moment to think.")
   - For ANSWERS:
     * text: Just the answer, very brief (e.g., "A strong coffee")
     * spokenText: Full explanation (e.g., "The answer is: a strong coffee made by forcing hot water through grounds. Remember, you'll see this on every menu.")

   ${transitionOut ? `- LAST LINE: A transition to ${nextSegment} (marked as ${nextSegment?.toUpperCase()}, not QUIZ)` : ''}`);
        break;
      case 'cultural_note':
        instructions.push(`${sectionNum}. CULTURAL NOTE (marked as CULTURAL):
   ${transitionIn ? `- FIRST LINE: A transition from ${prevSegment} - "${transitionIn}" (marked as CULTURAL, not ${prevSegment?.toUpperCase()})` : ''}
   - Include 2-3 cultural insights about ${language}-speaking regions
   - Relate to the ${config.situation} scenario
   - Each cultural line has TWO parts:
     * "text" field: The cultural tip (e.g., "Cultural Tip: In many countries, tipping baristas is appreciated but not required.")
     * "spokenText" field: The conversational explanation (e.g., "Here's something useful to know about coffee culture...")
   - Practical tips for real-world interaction
   - Speaker 1 provides the cultural context`);
        break;
    }
    sectionNum++;
    instructions.push('');
  }

  return instructions.join('\n');
}

function parseDialogue(response: string): ParsedLine[] {
  const lines = response.trim().split('\n').filter(Boolean);
  const parsed: ParsedLine[] = [];

  for (const line of lines) {
    const parts = line.split('|');

    // New format: [Speaker]|[SegmentType]|[Emotion]|[Text]
    if (parts.length >= 4) {
      const speakerId = parts[0].trim() === '1' ? 1 : 2;
      const segmentType = parts[1]?.trim() || undefined;
      const emotionMatch = parts[2]?.match(/\[([^\]]+)\]/);
      const emotion = emotionMatch ? emotionMatch[1] : undefined;
      const text = parts.slice(3).join('|').trim();

      if (text) {
        parsed.push({ speakerId, segmentType, emotion, text });
      }
    }
    // Legacy format: [Speaker]|[Emotion]|[Text]
    else if (parts.length >= 3) {
      const speakerId = parts[0].trim() === '1' ? 1 : 2;
      const emotionMatch = parts[1]?.match(/\[([^\]]+)\]/);
      const emotion = emotionMatch ? emotionMatch[1] : undefined;
      const text = parts.slice(2).join('|').trim();

      if (text) {
        parsed.push({ speakerId, emotion, text });
      }
    } else if (parts.length === 2) {
      // Fallback for simpler format
      const speakerId = parts[0].trim() === '1' ? 1 : 2;
      const text = parts[1].trim();
      if (text) {
        parsed.push({ speakerId, text });
      }
    }
  }

  return parsed;
}

async function generateDialogueText(config: ConversationConfig): Promise<ParsedLine[]> {
  // Use backend proxy to avoid CORS issues
  const response = await fetch('/api/generate-dialogue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        language: config.language,
        location: config.location,
        situation: config.situation,
        difficulty: config.difficulty,
        format: config.format,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate dialogue');
  }

  const data = await response.json();
  const text = data.output?.[0]?.content?.[0]?.text || data.output_text || '';

  return parseDialogue(text);
}

async function generateAudioOpenAI(
  text: string,
  voice: string,
  retryCount = 0
): Promise<{ uri: string; duration: number }> {
  try {
    // Use backend proxy to avoid CORS issues
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice: voice,
        provider: 'openai',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('OpenAI TTS API error:', error);

      // Retry on failure (could be rate limit)
      if (retryCount < 2) {
        console.log('Retrying audio generation after delay...');
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return generateAudioOpenAI(text, voice, retryCount + 1);
      }

      throw new Error('Failed to generate audio');
    }

    const data = await response.json();
    const fileUri = data.audio; // Already base64 data URI from backend

    // Estimate duration based on text length (rough estimate: 150 words per minute)
    const wordCount = text.split(' ').length;
    const estimatedDuration = (wordCount / 150) * 60 * 1000; // in milliseconds
    const duration = Math.max(estimatedDuration, 1500); // minimum 1.5 seconds

    return { uri: fileUri, duration };
  } catch (error) {
    // Network error - retry with backoff
    if (retryCount < 2) {
      console.log(`Network error, retrying audio generation (attempt ${retryCount + 2})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateAudioOpenAI(text, voice, retryCount + 1);
    }
    throw error;
  }
}

async function generateAudioElevenLabs(
  text: string,
  voiceId: string,
  retryCount = 0
): Promise<{ uri: string; duration: number }> {
  try {
    // Use backend proxy to avoid CORS issues
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice: voiceId,
        provider: 'elevenlabs',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('ElevenLabs TTS API error:', error);

      if (retryCount < 2) {
        console.log('Retrying ElevenLabs audio generation after delay...');
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return generateAudioElevenLabs(text, voiceId, retryCount + 1);
      }

      throw new Error('Failed to generate audio with ElevenLabs');
    }

    const data = await response.json();
    const fileUri = data.audio; // Already base64 data URI from backend

    const wordCount = text.split(' ').length;
    const estimatedDuration = (wordCount / 150) * 60 * 1000;
    const duration = Math.max(estimatedDuration, 1500);

    return { uri: fileUri, duration };
  } catch (error) {
    if (retryCount < 2) {
      console.log(`Network error, retrying ElevenLabs audio generation (attempt ${retryCount + 2})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateAudioElevenLabs(text, voiceId, retryCount + 1);
    }
    throw error;
  }
}

async function generateAudio(
  text: string,
  voice: string,
  provider: TTSProvider
): Promise<{ uri: string; duration: number }> {
  if (provider === 'elevenlabs' && ELEVENLABS_API_KEY) {
    return generateAudioElevenLabs(text, voice);
  }
  return generateAudioOpenAI(text, voice);
}

export async function generateConversation(
  config: ConversationConfig,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedDialogue> {
  // Check if we're in development mode and have a bundled lesson available
  const appMode = useDevSettingsStore.getState().settings.appMode;
  
  if (appMode === 'development') {
    const lessonKey = getBundledLessonKey(config.language, config.location);
    if (lessonKey) {
      onProgress?.(0.3, 'Loading bundled lesson...');
      
      try {
        const bundledLesson = await getBundledLessonAsync(lessonKey);
        if (bundledLesson) {
          onProgress?.(1, 'Complete!');
          return bundledLesson;
        }
      } catch (error) {
        console.error('Failed to load bundled lesson:', error);
      }
    }
  }

  // Fall back to API generation
  onProgress?.(0.1, 'Generating dialogue...');

  // Get the TTS provider from dev settings
  const ttsProvider = useDevSettingsStore.getState().settings.ttsProvider;
  const providerLabel = ttsProvider === 'elevenlabs' ? 'ElevenLabs' : 'OpenAI';

  // Generate the dialogue text
  const parsedLines = await generateDialogueText(config);

  if (parsedLines.length === 0) {
    throw new Error('No dialogue lines generated');
  }

  onProgress?.(0.3, `Creating audio (${providerLabel})...`);

  // Get voices for each speaker based on provider
  const speaker1Voice = getVoiceByName(config.speaker1.name, 1, ttsProvider);
  const speaker2Voice = getVoiceByName(config.speaker2.name, 2, ttsProvider);

  // Ensure speakers have different voices
  let finalSpeaker2Voice = speaker2Voice;
  if (speaker1Voice === speaker2Voice) {
    // If same voice selected, use a different voice for speaker 2
    const fallbacks = ttsProvider === 'elevenlabs' ? ELEVENLABS_FALLBACK_VOICES : OPENAI_FALLBACK_VOICES;
    finalSpeaker2Voice = fallbacks.speaker2;
    if (speaker1Voice === fallbacks.speaker2) {
      finalSpeaker2Voice = ttsProvider === 'elevenlabs'
        ? 'TxGEqnHWrfWFTfGW9XjX' // Josh for ElevenLabs
        : 'echo'; // echo for OpenAI
    }
  }

  const dialogueLines: DialogueLine[] = [];
  let currentTime = 0;
  const pauseBetweenLines = 500; // 500ms pause between lines

  // Generate audio for each line with small delay to avoid rate limits
  for (let i = 0; i < parsedLines.length; i++) {
    const line = parsedLines[i];
    const progress = 0.3 + (0.6 * (i / parsedLines.length));
    onProgress?.(progress, `Creating audio (${i + 1}/${parsedLines.length})...`);

    // Choose voice based on speaker
    const voice = line.speakerId === 1 ? speaker1Voice : finalSpeaker2Voice;

    // Use spokenText for audio if available (for sections like Vocabulary where display differs from speech)
    const textForAudio = line.spokenText || line.text;

    try {
      // Small delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      const { uri, duration } = await generateAudio(textForAudio, voice, ttsProvider);

      dialogueLines.push({
        id: `line_${i}`,
        speakerId: line.speakerId,
        text: line.text,
        spokenText: line.spokenText,
        emotion: line.emotion,
        segmentType: line.segmentType,
        audioUri: uri,
        startTime: currentTime,
        endTime: currentTime + duration,
        duration,
      });

      currentTime += duration + pauseBetweenLines;
    } catch (error) {
      console.error(`Failed to generate audio for line ${i}:`, error);
      // Continue with estimated duration if audio fails
      const estimatedDuration = Math.max((textForAudio.split(' ').length / 150) * 60 * 1000, 1500);

      dialogueLines.push({
        id: `line_${i}`,
        speakerId: line.speakerId,
        text: line.text,
        spokenText: line.spokenText,
        emotion: line.emotion,
        segmentType: line.segmentType,
        startTime: currentTime,
        endTime: currentTime + estimatedDuration,
        duration: estimatedDuration,
      });

      currentTime += estimatedDuration + pauseBetweenLines;
    }
  }

  onProgress?.(1, 'Complete!');

  return {
    config,
    lines: dialogueLines,
    totalDuration: currentTime,
  };
}

// Map LessonSegmentType to the segment type strings used in the UI
const SEGMENT_TYPE_TO_UI: Record<LessonSegmentType, string> = {
  welcome: 'WELCOME',
  vocabulary: 'VOCAB',
  slow_dialogue: 'SLOW',
  breakdown: 'BREAKDOWN',
  natural_speed: 'NATURAL',
  quiz: 'QUIZ',
  cultural_note: 'CULTURAL',
};

// Helper to get transition opening text for mock data
function getMockTransitionOpening(currentSegment: LessonSegmentType, prevSegment: LessonSegmentType, speaker1Name: string, speaker2Name: string): ParsedLine | null {
  const transitions: Record<string, Record<string, string>> = {
    vocabulary: {
      welcome: `Now, before we jump into the conversation, let's go over some key words you'll need. ${speaker2Name}, want to help me with these?`,
    },
    slow_dialogue: {
      welcome: `Alright, let's ease into it with a slow-paced version of this conversation.`,
      vocabulary: `Now that you know those words, let's hear them in action. We'll take it nice and slow at first so you can follow along.`,
    },
    breakdown: {
      slow_dialogue: `Great job following that! Now let me break down some of the key phrases you just heard.`,
      vocabulary: `Now let's look at how these words come together in useful phrases.`,
    },
    natural_speed: {
      welcome: `Let's dive right into a natural conversation—just like you'd hear in real life.`,
      vocabulary: `Time to put those words into action! Here's how a real conversation sounds at natural speed.`,
      slow_dialogue: `Great! Now let's hear that same type of conversation at natural, everyday speed.`,
      breakdown: `Now that you understand those phrases, let's hear a full conversation at natural speed.`,
    },
    quiz: {
      vocabulary: `Time to test yourself! Let's see how well you remember those words.`,
      slow_dialogue: `Now let's check your understanding with a quick quiz.`,
      breakdown: `Let's make sure you've got those phrases down—time for a quick quiz.`,
      natural_speed: `Alright, let's test what you picked up from that conversation.`,
    },
    cultural_note: {
      welcome: `Before we practice, here's some helpful cultural context.`,
      vocabulary: `Now, a bit of cultural background that will help you use these words naturally.`,
      natural_speed: `Now let me give you some cultural context about what you just heard.`,
    },
  };

  const transitionText = transitions[currentSegment]?.[prevSegment];
  if (transitionText) {
    return {
      speakerId: 1,
      segmentType: SEGMENT_TYPE_TO_UI[currentSegment],
      emotion: 'transitional',
      text: transitionText,
    };
  }
  return null;
}

// Helper to get transition closing text for mock data
// NOTE: Transition closings introduce the NEXT section, so they should be marked with the NEXT section's type
function getMockTransitionClosing(currentSegment: LessonSegmentType, nextSegment: LessonSegmentType, speaker1Name: string, speaker2Name: string): ParsedLine | null {
  const closings: Record<string, Record<string, { speaker: 1 | 2; text: string }>> = {
    welcome: {
      vocabulary: { speaker: 1, text: `So let's start by learning some essential vocabulary you'll need for this situation.` },
      slow_dialogue: { speaker: 1, text: `Let's begin with a slow, clear version of the conversation so you can follow along easily.` },
      natural_speed: { speaker: 1, text: `Let's jump right in with a natural conversation!` },
    },
    vocabulary: {
      slow_dialogue: { speaker: 2, text: `Now that you've got those words, let's hear them in a real conversation. We'll take it slow at first.` },
      breakdown: { speaker: 1, text: `Now let's look at how to put these words together in useful phrases.` },
      natural_speed: { speaker: 1, text: `Time to hear these words in action at natural speed!` },
    },
    slow_dialogue: {
      breakdown: { speaker: 1, text: `Now let me break down the key phrases you just heard.` },
      natural_speed: { speaker: 2, text: `Great! Now let's hear that at natural, everyday speed.` },
      quiz: { speaker: 1, text: `Let's check your understanding with a quick quiz.` },
    },
    breakdown: {
      natural_speed: { speaker: 2, text: `Now that you understand those phrases, let's hear a full conversation at natural speed.` },
      quiz: { speaker: 1, text: `Time to test what you've learned!` },
    },
    natural_speed: {
      quiz: { speaker: 1, text: `Let's test what you picked up from that conversation.` },
      cultural_note: { speaker: 1, text: `Here's some cultural background about what you just heard.` },
    },
    quiz: {
      cultural_note: { speaker: 1, text: `Nice work! Now for some cultural context that ties everything together.` },
    },
  };

  const closing = closings[currentSegment]?.[nextSegment];
  if (closing) {
    // Mark with NEXT segment type since this line introduces the next section
    return {
      speakerId: closing.speaker,
      segmentType: SEGMENT_TYPE_TO_UI[nextSegment],
      emotion: 'transitional',
      text: closing.text,
      // For vocabulary transitions, add spokenText so it plays as speech but doesn't show as a vocab card
      spokenText: closing.text,
    };
  }
  return null;
}

// Fallback mock generation for testing without API keys
export async function generateMockConversation(
  config: ConversationConfig,
  onProgress?: (progress: number, status: string) => void
): Promise<GeneratedDialogue> {
  onProgress?.(0.2, 'Generating dialogue...');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Build mock content based on lesson segments
  const mockLines: ParsedLine[] = [];
  const segmentTypes = config.lessonSegments.map((s) => s.type);

  for (let i = 0; i < segmentTypes.length; i++) {
    const segmentType = segmentTypes[i];
    const prevSegment = i > 0 ? segmentTypes[i - 1] : null;
    const nextSegment = i < segmentTypes.length - 1 ? segmentTypes[i + 1] : null;

    // Add transition opening if coming from a previous section
    if (prevSegment) {
      const transitionIn = getMockTransitionOpening(segmentType, prevSegment, config.speaker1.name, config.speaker2.name);
      if (transitionIn) {
        mockLines.push(transitionIn);
      }
    }

    switch (segmentType) {
      case 'welcome':
        mockLines.push(
          { speakerId: 1, segmentType: 'WELCOME', emotion: 'warm', text: `Hello and welcome! I'm ${config.speaker1.name}, and I'll be your ${config.speaker1.role} today.` },
          { speakerId: 2, segmentType: 'WELCOME', emotion: 'friendly', text: `And I'm ${config.speaker2.name}! I work as a ${config.speaker2.role} here.` },
          { speakerId: 1, segmentType: 'WELCOME', text: `Today we're going to practice a real conversation at the ${getLocationLabel(config.location)}.` },
          { speakerId: 2, segmentType: 'WELCOME', text: `That's right! We'll focus on "${config.situation}" - something you'll use all the time.` },
          { speakerId: 1, segmentType: 'WELCOME', emotion: 'encouraging', text: `By the end, you'll feel confident handling this situation on your own.` }
        );
        break;
      case 'vocabulary':
        mockLines.push(
          {
            speakerId: 1,
            segmentType: 'VOCAB',
            emotion: 'enthusiastic',
            text: `Key word: "coffee" - a popular hot beverage made from roasted beans`,
            spokenText: `Our first word is coffee. Coffee is a popular hot beverage made from roasted beans. You'll hear this word a lot when ordering drinks.`
          },
          {
            speakerId: 1,
            segmentType: 'VOCAB',
            text: `"order" - to request something, especially food or drink`,
            spokenText: `Next up: order. To order means to request something, especially food or drink. For example, "I'd like to order a coffee."`
          },
          {
            speakerId: 1,
            segmentType: 'VOCAB',
            text: `"please" - a polite word used when making requests`,
            spokenText: `An important word: please. Please is a polite word used when making requests. Always add it to sound friendly and respectful.`
          },
          {
            speakerId: 1,
            segmentType: 'VOCAB',
            text: `"thank you" - an expression of gratitude`,
            spokenText: `Don't forget: thank you. Thank you is an expression of gratitude. Use it whenever someone helps you or gives you something.`
          },
          {
            speakerId: 1,
            segmentType: 'VOCAB',
            emotion: 'encouraging',
            text: `"large" - bigger than normal size, often used for drink sizes`,
            spokenText: `And finally: large. Large means bigger than normal size. It's often used when choosing drink sizes, like "a large coffee, please."`
          }
        );
        break;
      case 'slow_dialogue':
        mockLines.push(
          { speakerId: 2, segmentType: 'SLOW', emotion: 'friendly', text: `Hello... How... can... I... help... you?` },
          { speakerId: 1, segmentType: 'SLOW', emotion: 'friendly', text: `Hi... I... want... to... order... coffee.` },
          { speakerId: 2, segmentType: 'SLOW', text: `What... size... do... you... want?` },
          { speakerId: 1, segmentType: 'SLOW', text: `Large... please.` },
          { speakerId: 2, segmentType: 'SLOW', text: `Hot... or... cold?` },
          { speakerId: 1, segmentType: 'SLOW', text: `Hot... please.` }
        );
        break;
      case 'breakdown':
        mockLines.push(
          {
            speakerId: 1,
            segmentType: 'BREAKDOWN',
            emotion: 'instructive',
            text: `"How can I help you?" - This is a common greeting used by service staff.`,
            spokenText: `First phrase: "How can I help you?" This is a common greeting used by service staff. You'll hear this as soon as you approach the counter.`
          },
          {
            speakerId: 1,
            segmentType: 'BREAKDOWN',
            text: `"I want to order" - This phrase expresses your intention to buy something.`,
            spokenText: `Next: "I want to order." This expresses your intention to buy something. It's direct and clear - perfect for getting started.`
          },
          {
            speakerId: 1,
            segmentType: 'BREAKDOWN',
            text: `"What size?" - A question about dimensions, common in food service.`,
            spokenText: `You'll often hear: "What size?" This is a question about dimensions, very common in food service. Be ready to answer with small, medium, or large.`
          },
          {
            speakerId: 1,
            segmentType: 'BREAKDOWN',
            emotion: 'helpful',
            text: `"Please" goes at the end of requests to sound polite.`,
            spokenText: `A quick tip: "Please" goes at the end of requests to sound polite. For example, "A large coffee, please" sounds much friendlier than just "A large coffee."`
          }
        );
        break;
      case 'natural_speed':
        const naturalMock = getNaturalMockByDifficulty(config.difficulty);
        mockLines.push(...naturalMock);
        break;
      case 'quiz':
        // Quiz questions MUST reference content from earlier sections:
        // - Vocabulary: coffee, order, please, large
        // - Breakdown phrases: "How can I help you?", "I'd like to order", "What can I get for you?", "That's all"
        // - Conversation details: customer ordered large hot coffee with cream, paid by card, $4.50
        mockLines.push(
          // TYPE 1: Vocabulary Recall - tests "order" from vocabulary section
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            emotion: 'encouraging',
            text: `What does "order" mean?`,
            spokenText: `Question one: What does "order" mean? We learned this word in our vocabulary section. Take a moment to recall.`
          },
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            text: `To request something`,
            spokenText: `The answer is: to request something, especially food or drink. Remember, "I'd like to order" is a polite way to start.`
          },
          // TYPE 2: Phrase Meaning - tests phrase from breakdown section
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            text: `What does "That's all" mean?`,
            spokenText: `Question two: What does "That's all" mean? We covered this phrase in our breakdown.`
          },
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            text: `I'm done ordering`,
            spokenText: `The answer is: it means you're done ordering. It's a simple way to tell the staff you don't need anything else.`
          },
          // TYPE 3: Comprehension - tests details from the natural conversation
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            text: `What size coffee did the customer order?`,
            spokenText: `Question three: In the conversation we just heard, what size coffee did the customer order? Think back to the dialogue.`
          },
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            text: `Large`,
            spokenText: `The answer is: large. The customer said "I'd like a large coffee, please." They also asked for it hot with a little cream.`
          },
          // TYPE 4: Production - asks how to say something politely
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            text: `How do you politely ask for a large size?`,
            spokenText: `Last question: How do you politely ask for a large size? Remember the magic word we learned.`
          },
          {
            speakerId: 1,
            segmentType: 'QUIZ',
            emotion: 'celebratory',
            text: `"Large, please"`,
            spokenText: `The answer is: "Large, please" or "A large one, please." Adding "please" makes any request polite. Excellent work on this quiz!`
          }
        );
        break;
      case 'cultural_note':
        mockLines.push(
          {
            speakerId: 1,
            segmentType: 'CULTURAL',
            emotion: 'informative',
            text: `Cultural Tip: In many countries, tipping baristas is appreciated but not required.`,
            spokenText: `Here's an interesting cultural tip: In many countries, tipping baristas is appreciated but not required. It's a nice gesture, but don't feel pressured.`
          },
          {
            speakerId: 1,
            segmentType: 'CULTURAL',
            text: `In the US, it's common to leave a dollar or two in the tip jar.`,
            spokenText: `In the United States specifically, it's common to leave a dollar or two in the tip jar. You'll usually see one near the register.`
          },
          {
            speakerId: 1,
            segmentType: 'CULTURAL',
            emotion: 'friendly',
            text: `Coffee shops often have loyalty programs - ask about rewards cards!`,
            spokenText: `One more tip: Coffee shops often have loyalty programs. Don't be shy to ask about rewards cards - you can earn free drinks over time!`
          }
        );
        break;
    }

    // Add transition closing if there's a next section
    if (nextSegment) {
      const transitionOut = getMockTransitionClosing(segmentType, nextSegment, config.speaker1.name, config.speaker2.name);
      if (transitionOut) {
        mockLines.push(transitionOut);
      }
    }
  }

  onProgress?.(0.5, 'Processing...');
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dialogueLines: DialogueLine[] = [];
  let currentTime = 0;
  const pauseBetweenLines = 500;

  for (let i = 0; i < mockLines.length; i++) {
    const line = mockLines[i];
    // Use spokenText for duration calculation if available (it's what gets spoken aloud)
    const textForDuration = line.spokenText || line.text;
    const duration = Math.max((textForDuration.split(' ').length / 150) * 60 * 1000, 2000);

    dialogueLines.push({
      id: `line_${i}`,
      speakerId: line.speakerId,
      text: line.text,
      spokenText: line.spokenText,
      emotion: line.emotion,
      segmentType: line.segmentType,
      startTime: currentTime,
      endTime: currentTime + duration,
      duration,
    });

    currentTime += duration + pauseBetweenLines;
  }

  onProgress?.(1, 'Complete!');

  return {
    config,
    lines: dialogueLines,
    totalDuration: currentTime,
  };
}

function getNaturalMockByDifficulty(difficulty: string): ParsedLine[] {
  const mockLinesByDifficulty: Record<string, ParsedLine[]> = {
    beginner: [
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Hello! How can I help you?` },
      { speakerId: 1, segmentType: 'NATURAL', emotion: 'friendly', text: `Hi! I want to order.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Yes. What do you want?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `I want a coffee, please.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `What size? Small or large?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `A large one, please.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Hot or cold?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Hot, please.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Do you want milk?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Yes, please. With milk.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `That is five dollars.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Here you go.` },
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Here is your coffee.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Thank you very much!` },
      { speakerId: 2, segmentType: 'NATURAL', text: `You're welcome. Have a nice day!` },
      { speakerId: 1, segmentType: 'NATURAL', emotion: 'grateful', text: `You too! Goodbye!` },
    ],
    intermediate: [
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Good morning! Welcome in. What can I get started for you today?` },
      { speakerId: 1, segmentType: 'NATURAL', emotion: 'friendly', text: `Hey there! I'm looking to grab a coffee, but I'm not sure what to get.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `No problem! Are you in the mood for something hot or maybe an iced drink?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Actually, I'm thinking something warm. It's pretty chilly outside.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Totally get it. Our house blend is really popular, or if you're feeling fancy, we've got a great caramel latte.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Ooh, the caramel latte sounds good. How sweet is it though?` },
      { speakerId: 2, segmentType: 'NATURAL', text: `It's got a nice balance—not too sweet. We can always adjust the syrup if you'd like.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Perfect, I'll go with that then. Medium size, please.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `You got it! Would you like whipped cream on top?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Why not? Treat yourself, right?` },
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'amused', text: `Ha! That's the spirit. Anything else I can add for you?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Do you have any pastries? I haven't had breakfast yet.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `We've got fresh croissants and blueberry muffins. Both are pretty amazing.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `I'll take a croissant. Can't resist those.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Great choice! That'll be $8.50.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Here's my card. Thanks!` },
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Enjoy your coffee, and have a great day!` },
      { speakerId: 1, segmentType: 'NATURAL', emotion: 'grateful', text: `Thanks so much! You too!` },
    ],
    advanced: [
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Good morning! What brings you in on this rather dreary day?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Well, I figured I'd need something to counteract this gloomy weather—ideally something with a serious caffeine kick.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `I hear you. Nothing like a proper coffee to shake off the morning fog, so to speak.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Exactly. I've been burning the midnight oil lately, and it's starting to catch up with me.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `In that case, might I suggest our cold brew? It packs quite a punch—roughly twice the caffeine of our regular drip.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Hmm, tempting, but I'm in the mood for something a bit more... indulgent. What's your personal favorite?` },
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'thoughtful', text: `Between you and me? Our oat milk mocha is absolutely divine. It's got this subtle earthiness that complements the chocolate beautifully.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Now you're speaking my language. I've been trying to cut back on dairy anyway, so that sounds perfect.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Brilliant choice. Would you prefer it hot, or shall I make it over ice?` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Hot, definitely. I need something to warm my soul at this point.` },
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'amused', text: `Soul-warming beverages are our specialty. Any preference on size? Our large is practically bottomless.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Go big or go home, right? I'll take the large. Though I should probably grab something to eat too, or I'll be bouncing off the walls.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Wise thinking. Our avocado toast is phenomenal, if you're inclined—locally sourced bread, perfectly ripe avocados.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `You've twisted my arm. That sounds too good to pass up.` },
      { speakerId: 2, segmentType: 'NATURAL', text: `Wonderful. So we're looking at a large oat milk mocha and the avo toast. That'll be $16.50 whenever you're ready.` },
      { speakerId: 1, segmentType: 'NATURAL', text: `Worth every penny, I'm sure. Here you are.` },
      { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Cheers! We'll have everything ready for you shortly. Feel free to grab a seat by the window.` },
      { speakerId: 1, segmentType: 'NATURAL', emotion: 'grateful', text: `Perfect—thanks for the recommendation. You've made my morning considerably brighter.` },
    ],
  };

  return mockLinesByDifficulty[difficulty] || mockLinesByDifficulty.intermediate;
}

// Instant mock generation for dev mode - no delays, no audio
export function generateInstantMockConversation(
  config: ConversationConfig
): GeneratedDialogue {
  // Build mock content based on lesson segments
  const mockLines: ParsedLine[] = [];
  const segmentTypes = config.lessonSegments.map((s) => s.type);

  for (let i = 0; i < segmentTypes.length; i++) {
    const segmentType = segmentTypes[i];

    switch (segmentType) {
      case 'welcome':
        mockLines.push(
          { speakerId: 1, segmentType: 'WELCOME', emotion: 'warm', text: `Hello and welcome! I'm ${config.speaker1.name}, and I'll be your guide today.` },
          { speakerId: 2, segmentType: 'WELCOME', emotion: 'friendly', text: `And I'm ${config.speaker2.name}! We're so glad you're here.` },
          { speakerId: 1, segmentType: 'WELCOME', text: `Today we'll practice a conversation at the ${getLocationLabel(config.location)}.` },
          { speakerId: 2, segmentType: 'WELCOME', text: `We'll focus on "${config.situation}" - something you'll use all the time.` },
          { speakerId: 1, segmentType: 'WELCOME', emotion: 'encouraging', text: `By the end, you'll feel confident handling this on your own. Let's get started!` }
        );
        break;
      case 'vocabulary':
        mockLines.push(
          { speakerId: 1, segmentType: 'VOCAB', text: `"coffee" - a hot beverage made from roasted beans`, spokenText: `Our first word is coffee. Coffee is a popular hot beverage made from roasted beans. You'll hear this everywhere.` },
          { speakerId: 1, segmentType: 'VOCAB', text: `"order" - to request something, especially food or drink`, spokenText: `Next up: order. To order means to request something, especially food or drink. For example, "I'd like to order a coffee."` },
          { speakerId: 1, segmentType: 'VOCAB', text: `"please" - a polite word used when making requests`, spokenText: `An important word: please. Please is a polite word used when making requests. Always add it to sound friendly.` },
          { speakerId: 1, segmentType: 'VOCAB', text: `"large" - bigger than normal size, often used for drink sizes`, spokenText: `And finally: large. Large means bigger than normal size. It's often used when choosing drink sizes.` }
        );
        break;
      case 'slow_dialogue':
        mockLines.push(
          { speakerId: 2, segmentType: 'SLOW', emotion: 'friendly', text: `Hello... How... can... I... help... you... today?` },
          { speakerId: 1, segmentType: 'SLOW', text: `Hi... I... would... like... to... order... please.` },
          { speakerId: 2, segmentType: 'SLOW', text: `Of... course... What... can... I... get... for... you?` },
          { speakerId: 1, segmentType: 'SLOW', text: `I'd... like... a... large... coffee... please.` },
          { speakerId: 2, segmentType: 'SLOW', text: `Would... you... like... anything... else?` },
          { speakerId: 1, segmentType: 'SLOW', text: `No... thank... you... That's... all.` }
        );
        break;
      case 'breakdown':
        mockLines.push(
          { speakerId: 1, segmentType: 'BREAKDOWN', text: `"How can I help you?" - A common greeting from service staff`, spokenText: `First phrase: "How can I help you?" This is a very common greeting you'll hear from service staff. You'll hear this as soon as you approach the counter.` },
          { speakerId: 1, segmentType: 'BREAKDOWN', text: `"I'd like to order" - A polite way to start your request`, spokenText: `Next: "I'd like to order." This is a polite way to start your request. It's softer than saying "I want."` },
          { speakerId: 1, segmentType: 'BREAKDOWN', text: `"What can I get for you?" - Another way staff ask for your order`, spokenText: `You might also hear: "What can I get for you?" This is another friendly way staff ask for your order.` },
          { speakerId: 1, segmentType: 'BREAKDOWN', text: `"That's all" - How to indicate you're done ordering`, spokenText: `Finally: "That's all." Use this to indicate you're done ordering. Simple but very useful!` }
        );
        break;
      case 'natural_speed':
        mockLines.push(
          { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `Hi there! Welcome in. What can I get started for you?` },
          { speakerId: 1, segmentType: 'NATURAL', text: `Hey! I'd like a large coffee, please.` },
          { speakerId: 2, segmentType: 'NATURAL', text: `Sure thing! Would you like that hot or iced?` },
          { speakerId: 1, segmentType: 'NATURAL', text: `Hot, please. It's a bit chilly today.` },
          { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `I hear you! Any room for cream?` },
          { speakerId: 1, segmentType: 'NATURAL', text: `Yes, just a little bit.` },
          { speakerId: 2, segmentType: 'NATURAL', text: `Perfect. Anything else I can get for you?` },
          { speakerId: 1, segmentType: 'NATURAL', text: `No, that's all for now. Thank you!` },
          { speakerId: 2, segmentType: 'NATURAL', text: `That'll be $4.50. Cash or card?` },
          { speakerId: 1, segmentType: 'NATURAL', text: `Card, please.` },
          { speakerId: 2, segmentType: 'NATURAL', text: `Great, just tap right here. Your coffee will be ready at the end of the bar.` },
          { speakerId: 1, segmentType: 'NATURAL', emotion: 'grateful', text: `Awesome, thanks so much!` },
          { speakerId: 2, segmentType: 'NATURAL', emotion: 'friendly', text: `You're welcome! Have a great day!` }
        );
        break;
      case 'quiz':
        // Quiz directly tests content from earlier sections
        mockLines.push(
          // TYPE 1: Vocabulary Recall - tests "order" from vocab
          { speakerId: 1, segmentType: 'QUIZ', emotion: 'encouraging', text: `What does "order" mean?`, spokenText: `Question one: What does "order" mean? We learned this word earlier. Take a moment.` },
          { speakerId: 1, segmentType: 'QUIZ', text: `To request something`, spokenText: `The answer is: to request something, especially food or drink.` },
          // TYPE 2: Phrase Meaning - tests phrase from breakdown
          { speakerId: 1, segmentType: 'QUIZ', text: `What does "That's all" mean?`, spokenText: `Question two: What does "That's all" mean? We covered this phrase.` },
          { speakerId: 1, segmentType: 'QUIZ', text: `I'm done ordering`, spokenText: `The answer is: it means you're done ordering.` },
          // TYPE 3: Comprehension - tests conversation details
          { speakerId: 1, segmentType: 'QUIZ', text: `What size coffee was ordered?`, spokenText: `Question three: In our conversation, what size coffee did the customer order?` },
          { speakerId: 1, segmentType: 'QUIZ', text: `Large`, spokenText: `The answer is: large. They said "I'd like a large coffee, please."` },
          // TYPE 4: Production - asks how to say something
          { speakerId: 1, segmentType: 'QUIZ', text: `How do you politely ask for a large?`, spokenText: `Last question: How do you politely ask for a large size?` },
          { speakerId: 1, segmentType: 'QUIZ', emotion: 'celebratory', text: `"Large, please"`, spokenText: `The answer is: "Large, please." Adding please makes it polite. Great job!` }
        );
        break;
      case 'cultural_note':
        mockLines.push(
          { speakerId: 1, segmentType: 'CULTURAL', text: `In many countries, tipping baristas is appreciated but not required.`, spokenText: `Here's an interesting cultural tip: In many countries, tipping baristas is appreciated but not required. It's a nice gesture, but don't feel pressured.` },
          { speakerId: 1, segmentType: 'CULTURAL', text: `In the US, it's common to leave a dollar or two in the tip jar.`, spokenText: `In the United States specifically, it's common to leave a dollar or two in the tip jar. You'll usually see one near the register.` },
          { speakerId: 1, segmentType: 'CULTURAL', text: `Coffee shops often have loyalty programs - ask about rewards cards!`, spokenText: `One more tip: Coffee shops often have loyalty programs. Don't be shy to ask about rewards cards - you can earn free drinks over time!` }
        );
        break;
    }
  }

  // Convert to DialogueLine format without audio
  // Calculate duration based on text length (similar to other mock generators)
  let currentTime = 0;
  const pauseBetweenLines = 500; // 500ms pause between lines

  const lines: DialogueLine[] = mockLines.map((line, index) => {
    // Use spokenText for duration calculation if available
    const textForDuration = line.spokenText || line.text;
    // Estimate: ~150 words per minute = 2.5 words per second
    // duration in ms = (wordCount / 2.5) * 1000, minimum 2000ms
    const wordCount = textForDuration.split(' ').length;
    const duration = Math.max((wordCount / 2.5) * 1000, 2000);

    const dialogueLine: DialogueLine = {
      id: `mock_${index}`,
      speakerId: line.speakerId,
      text: line.text,
      spokenText: line.spokenText,
      emotion: line.emotion,
      segmentType: line.segmentType,
      audioUri: undefined,
      startTime: currentTime,
      endTime: currentTime + duration,
      duration,
    };

    currentTime += duration + pauseBetweenLines;
    return dialogueLine;
  });

  return {
    config,
    lines,
    totalDuration: currentTime,
  };
}
