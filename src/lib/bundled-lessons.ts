/**
 * Bundled Lessons for Development Mode
 *
 * This file contains pre-generated lesson data with references to bundled audio files.
 * Used in development mode to avoid API calls during testing.
 *
 * Supported configurations:
 * - Languages: English (en), Spanish (es), French (fr)
 * - Locations: Coffee Shop, Restaurant
 * - Format: Classroom Style (all segment types)
 */

import type { GeneratedDialogue, DialogueLine, Language, Location } from './types';
import { Asset } from 'expo-asset';

// Key format: `${language}_${location}`
export type BundledLessonKey =
  | 'en_coffee_shop'
  | 'en_restaurant'
  | 'es_coffee_shop'
  | 'es_restaurant'
  | 'fr_coffee_shop'
  | 'fr_restaurant';

export function getBundledLessonKey(language: string, location: string): BundledLessonKey | null {
  const key = `${language}_${location}` as BundledLessonKey;
  if (BUNDLED_LESSONS[key]) {
    return key;
  }
  return null;
}

export function hasBundledLesson(language: string, location: string): boolean {
  return getBundledLessonKey(language, location) !== null;
}

export function getBundledLesson(key: BundledLessonKey): GeneratedDialogue | null {
  return BUNDLED_LESSONS[key] || null;
}

// Async version that resolves audio URIs for web
export async function getBundledLessonAsync(key: BundledLessonKey): Promise<GeneratedDialogue | null> {
  const lesson = BUNDLED_LESSONS[key];
  if (!lesson) return null;
  
  // Resolve all audio URIs to actual URLs for web
  const linesWithResolvedAudio = await Promise.all(
    lesson.lines.map(async (line) => {
      if (line.audioUri) {
        // Extract the lesson key and line index from the line id
        const lineIndex = parseInt(line.id.split('_')[1]);
        const resolvedUri = await getBundledAudioUriAsync(key, lineIndex);
        return {
          ...line,
          audioUri: resolvedUri || line.audioUri,
        };
      }
      return line;
    })
  );
  
  return {
    ...lesson,
    lines: linesWithResolvedAudio,
  };
}

// Pre-generated lesson data
// Audio files are stored in assets/bundled-lessons/{key}/line_{index}.mp3
const BUNDLED_LESSONS: Record<BundledLessonKey, GeneratedDialogue> = {
  en_coffee_shop: createEnglishCoffeeShopLesson(),
  en_restaurant: createEnglishRestaurantLesson(),
  es_coffee_shop: createSpanishCoffeeShopLesson(),
  es_restaurant: createSpanishRestaurantLesson(),
  fr_coffee_shop: createFrenchCoffeeShopLesson(),
  fr_restaurant: createFrenchRestaurantLesson(),
};

// Helper to create audio URI for bundled lessons
// Returns a require() reference to the local audio file
async function getBundledAudioUriAsync(lessonKey: BundledLessonKey, lineIndex: number): Promise<string | null> {
  try {
    const key = `${lessonKey}_${lineIndex}`;
    const assetModule = AUDIO_FILES[key];
    
    if (!assetModule) {
      return null;
    }
    
    // For web, we need to resolve the asset to get the actual URL
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  } catch (error) {
    console.error(`Failed to load audio: ${lessonKey}/line_${lineIndex}`, error);
    return null;
  }
}

// Synchronous version that returns the asset module (for initial data structure)
function getBundledAudioUri(lessonKey: BundledLessonKey, lineIndex: number): any {
  const key = `${lessonKey}_${lineIndex}`;
  return AUDIO_FILES[key] || null;
}

// Pre-load all audio file references using require()
// This is necessary because Expo requires static paths at build time
const AUDIO_FILES: Record<string, any> = {
  // English Coffee Shop
  'en_coffee_shop_0': require('../../assets/bundled-audio/en_coffee_shop/line_0.mp3'),
  'en_coffee_shop_1': require('../../assets/bundled-audio/en_coffee_shop/line_1.mp3'),
  'en_coffee_shop_2': require('../../assets/bundled-audio/en_coffee_shop/line_2.mp3'),
  'en_coffee_shop_3': require('../../assets/bundled-audio/en_coffee_shop/line_3.mp3'),
  'en_coffee_shop_4': require('../../assets/bundled-audio/en_coffee_shop/line_4.mp3'),
  'en_coffee_shop_5': require('../../assets/bundled-audio/en_coffee_shop/line_5.mp3'),
  'en_coffee_shop_6': require('../../assets/bundled-audio/en_coffee_shop/line_6.mp3'),
  'en_coffee_shop_7': require('../../assets/bundled-audio/en_coffee_shop/line_7.mp3'),
  'en_coffee_shop_8': require('../../assets/bundled-audio/en_coffee_shop/line_8.mp3'),
  'en_coffee_shop_9': require('../../assets/bundled-audio/en_coffee_shop/line_9.mp3'),
  'en_coffee_shop_10': require('../../assets/bundled-audio/en_coffee_shop/line_10.mp3'),
  'en_coffee_shop_11': require('../../assets/bundled-audio/en_coffee_shop/line_11.mp3'),
  'en_coffee_shop_12': require('../../assets/bundled-audio/en_coffee_shop/line_12.mp3'),
  'en_coffee_shop_13': require('../../assets/bundled-audio/en_coffee_shop/line_13.mp3'),
  'en_coffee_shop_14': require('../../assets/bundled-audio/en_coffee_shop/line_14.mp3'),
  'en_coffee_shop_15': require('../../assets/bundled-audio/en_coffee_shop/line_15.mp3'),
  'en_coffee_shop_16': require('../../assets/bundled-audio/en_coffee_shop/line_16.mp3'),
  'en_coffee_shop_17': require('../../assets/bundled-audio/en_coffee_shop/line_17.mp3'),
  'en_coffee_shop_18': require('../../assets/bundled-audio/en_coffee_shop/line_18.mp3'),
  'en_coffee_shop_19': require('../../assets/bundled-audio/en_coffee_shop/line_19.mp3'),
  'en_coffee_shop_20': require('../../assets/bundled-audio/en_coffee_shop/line_20.mp3'),
  'en_coffee_shop_21': require('../../assets/bundled-audio/en_coffee_shop/line_21.mp3'),
  'en_coffee_shop_22': require('../../assets/bundled-audio/en_coffee_shop/line_22.mp3'),
  'en_coffee_shop_23': require('../../assets/bundled-audio/en_coffee_shop/line_23.mp3'),
  'en_coffee_shop_24': require('../../assets/bundled-audio/en_coffee_shop/line_24.mp3'),
  'en_coffee_shop_25': require('../../assets/bundled-audio/en_coffee_shop/line_25.mp3'),
  'en_coffee_shop_26': require('../../assets/bundled-audio/en_coffee_shop/line_26.mp3'),
  'en_coffee_shop_27': require('../../assets/bundled-audio/en_coffee_shop/line_27.mp3'),
  'en_coffee_shop_28': require('../../assets/bundled-audio/en_coffee_shop/line_28.mp3'),
  'en_coffee_shop_29': require('../../assets/bundled-audio/en_coffee_shop/line_29.mp3'),
  'en_coffee_shop_30': require('../../assets/bundled-audio/en_coffee_shop/line_30.mp3'),
  'en_coffee_shop_31': require('../../assets/bundled-audio/en_coffee_shop/line_31.mp3'),
  'en_coffee_shop_32': require('../../assets/bundled-audio/en_coffee_shop/line_32.mp3'),
  'en_coffee_shop_33': require('../../assets/bundled-audio/en_coffee_shop/line_33.mp3'),
  'en_coffee_shop_34': require('../../assets/bundled-audio/en_coffee_shop/line_34.mp3'),
  'en_coffee_shop_35': require('../../assets/bundled-audio/en_coffee_shop/line_35.mp3'),
  'en_coffee_shop_36': require('../../assets/bundled-audio/en_coffee_shop/line_36.mp3'),
  'en_coffee_shop_37': require('../../assets/bundled-audio/en_coffee_shop/line_37.mp3'),
  'en_coffee_shop_38': require('../../assets/bundled-audio/en_coffee_shop/line_38.mp3'),
  'en_coffee_shop_39': require('../../assets/bundled-audio/en_coffee_shop/line_39.mp3'),
  'en_coffee_shop_40': require('../../assets/bundled-audio/en_coffee_shop/line_40.mp3'),
  'en_coffee_shop_41': require('../../assets/bundled-audio/en_coffee_shop/line_41.mp3'),
  'en_coffee_shop_42': require('../../assets/bundled-audio/en_coffee_shop/line_42.mp3'),
};

function createEnglishCoffeeShopLesson(): GeneratedDialogue {
  const lines: DialogueLine[] = [
    // WELCOME (5 lines: 0-4)
    { id: 'line_0', speakerId: 1, text: "Hello and welcome! I'm Maria, and I'll be your guide today.", segmentType: 'WELCOME', startTime: 0, endTime: 3000, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 0) },
    { id: 'line_1', speakerId: 2, text: "And I'm Jordan! We're so glad you're here.", segmentType: 'WELCOME', startTime: 3500, endTime: 6500, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 1) },
    { id: 'line_2', speakerId: 1, text: "Today we'll practice a conversation at the Coffee Shop.", segmentType: 'WELCOME', startTime: 7000, endTime: 10000, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 2) },
    { id: 'line_3', speakerId: 2, text: "We'll focus on \"Ordering a drink\" - something you'll use all the time.", segmentType: 'WELCOME', startTime: 10500, endTime: 14000, duration: 3500, audioUri: getBundledAudioUri('en_coffee_shop', 3) },
    { id: 'line_4', speakerId: 1, text: "By the end, you'll feel confident handling this on your own. Let's get started!", segmentType: 'WELCOME', startTime: 14500, endTime: 18500, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 4) },

    // VOCABULARY (4 lines: 5-8)
    { id: 'line_5', speakerId: 1, text: "\"coffee\" - a hot beverage made from roasted beans", spokenText: "Our first word is coffee. Coffee is a popular hot beverage made from roasted beans. You'll hear this everywhere.", segmentType: 'VOCAB', startTime: 19000, endTime: 26000, duration: 7000, audioUri: getBundledAudioUri('en_coffee_shop', 5) },
    { id: 'line_6', speakerId: 1, text: "\"order\" - to request something, especially food or drink", spokenText: "Next up: order. To order means to request something, especially food or drink. For example, \"I'd like to order a coffee.\"", segmentType: 'VOCAB', startTime: 26500, endTime: 35000, duration: 8500, audioUri: getBundledAudioUri('en_coffee_shop', 6) },
    { id: 'line_7', speakerId: 1, text: "\"please\" - a polite word used when making requests", spokenText: "An important word: please. Please is a polite word used when making requests. Always add it to sound friendly.", segmentType: 'VOCAB', startTime: 35500, endTime: 43000, duration: 7500, audioUri: getBundledAudioUri('en_coffee_shop', 7) },
    { id: 'line_8', speakerId: 1, text: "\"large\" - bigger than normal size, often used for drink sizes", spokenText: "And finally: large. Large means bigger than normal size. It's often used when choosing drink sizes.", segmentType: 'VOCAB', startTime: 43500, endTime: 50500, duration: 7000, audioUri: getBundledAudioUri('en_coffee_shop', 8) },

    // SLOW DIALOGUE (6 lines: 9-14)
    { id: 'line_9', speakerId: 2, text: "Hello... How... can... I... help... you... today?", segmentType: 'SLOW', startTime: 51000, endTime: 57000, duration: 6000, audioUri: getBundledAudioUri('en_coffee_shop', 9) },
    { id: 'line_10', speakerId: 1, text: "Hi... I... would... like... to... order... please.", segmentType: 'SLOW', startTime: 57500, endTime: 63500, duration: 6000, audioUri: getBundledAudioUri('en_coffee_shop', 10) },
    { id: 'line_11', speakerId: 2, text: "Of... course... What... can... I... get... for... you?", segmentType: 'SLOW', startTime: 64000, endTime: 70000, duration: 6000, audioUri: getBundledAudioUri('en_coffee_shop', 11) },
    { id: 'line_12', speakerId: 1, text: "I'd... like... a... large... coffee... please.", segmentType: 'SLOW', startTime: 70500, endTime: 76000, duration: 5500, audioUri: getBundledAudioUri('en_coffee_shop', 12) },
    { id: 'line_13', speakerId: 2, text: "Would... you... like... anything... else?", segmentType: 'SLOW', startTime: 76500, endTime: 81500, duration: 5000, audioUri: getBundledAudioUri('en_coffee_shop', 13) },
    { id: 'line_14', speakerId: 1, text: "No... thank... you... That's... all.", segmentType: 'SLOW', startTime: 82000, endTime: 86500, duration: 4500, audioUri: getBundledAudioUri('en_coffee_shop', 14) },

    // BREAKDOWN (4 lines: 15-18)
    { id: 'line_15', speakerId: 1, text: "\"How can I help you?\" - A common greeting from service staff", spokenText: "First phrase: \"How can I help you?\" This is a very common greeting you'll hear from service staff. You'll hear this as soon as you approach the counter.", segmentType: 'BREAKDOWN', startTime: 87000, endTime: 97000, duration: 10000, audioUri: getBundledAudioUri('en_coffee_shop', 15) },
    { id: 'line_16', speakerId: 1, text: "\"I'd like to order\" - A polite way to start your request", spokenText: "Next: \"I'd like to order.\" This is a polite way to start your request. It's softer than saying \"I want.\"", segmentType: 'BREAKDOWN', startTime: 97500, endTime: 105000, duration: 7500, audioUri: getBundledAudioUri('en_coffee_shop', 16) },
    { id: 'line_17', speakerId: 1, text: "\"What can I get for you?\" - Another way staff ask for your order", spokenText: "You might also hear: \"What can I get for you?\" This is another friendly way staff ask for your order.", segmentType: 'BREAKDOWN', startTime: 105500, endTime: 113000, duration: 7500, audioUri: getBundledAudioUri('en_coffee_shop', 17) },
    { id: 'line_18', speakerId: 1, text: "\"That's all\" - How to indicate you're done ordering", spokenText: "Finally: \"That's all.\" Use this to indicate you're done ordering. Simple but very useful!", segmentType: 'BREAKDOWN', startTime: 113500, endTime: 120000, duration: 6500, audioUri: getBundledAudioUri('en_coffee_shop', 18) },

    // NATURAL SPEED (13 lines: 19-31)
    { id: 'line_19', speakerId: 2, text: "Hi there! Welcome in. What can I get started for you?", segmentType: 'NATURAL', startTime: 120500, endTime: 124000, duration: 3500, audioUri: getBundledAudioUri('en_coffee_shop', 19) },
    { id: 'line_20', speakerId: 1, text: "Hey! I'd like a large coffee, please.", segmentType: 'NATURAL', startTime: 124500, endTime: 127000, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 20) },
    { id: 'line_21', speakerId: 2, text: "Sure thing! Would you like that hot or iced?", segmentType: 'NATURAL', startTime: 127500, endTime: 130500, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 21) },
    { id: 'line_22', speakerId: 1, text: "Hot, please. It's a bit chilly today.", segmentType: 'NATURAL', startTime: 131000, endTime: 134000, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 22) },
    { id: 'line_23', speakerId: 2, text: "I hear you! Any room for cream?", segmentType: 'NATURAL', startTime: 134500, endTime: 137000, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 23) },
    { id: 'line_24', speakerId: 1, text: "Yes, just a little bit.", segmentType: 'NATURAL', startTime: 137500, endTime: 139500, duration: 2000, audioUri: getBundledAudioUri('en_coffee_shop', 24) },
    { id: 'line_25', speakerId: 2, text: "Perfect. Anything else I can get for you?", segmentType: 'NATURAL', startTime: 140000, endTime: 142500, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 25) },
    { id: 'line_26', speakerId: 1, text: "No, that's all for now. Thank you!", segmentType: 'NATURAL', startTime: 143000, endTime: 145500, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 26) },
    { id: 'line_27', speakerId: 2, text: "That'll be $4.50. Cash or card?", segmentType: 'NATURAL', startTime: 146000, endTime: 148500, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 27) },
    { id: 'line_28', speakerId: 1, text: "Card, please.", segmentType: 'NATURAL', startTime: 149000, endTime: 150500, duration: 1500, audioUri: getBundledAudioUri('en_coffee_shop', 28) },
    { id: 'line_29', speakerId: 2, text: "Great, just tap right here. Your coffee will be ready at the end of the bar.", segmentType: 'NATURAL', startTime: 151000, endTime: 155000, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 29) },
    { id: 'line_30', speakerId: 1, text: "Awesome, thanks so much!", segmentType: 'NATURAL', startTime: 155500, endTime: 157500, duration: 2000, audioUri: getBundledAudioUri('en_coffee_shop', 30) },
    { id: 'line_31', speakerId: 2, text: "You're welcome! Have a great day!", segmentType: 'NATURAL', startTime: 158000, endTime: 160500, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 31) },

    // QUIZ (8 lines: 32-39)
    { id: 'line_32', speakerId: 1, text: "What does \"order\" mean?", spokenText: "Question one: What does \"order\" mean? We learned this word earlier. Take a moment.", segmentType: 'QUIZ', startTime: 161000, endTime: 166000, duration: 5000, audioUri: getBundledAudioUri('en_coffee_shop', 32) },
    { id: 'line_33', speakerId: 1, text: "To request something", spokenText: "The answer is: to request something, especially food or drink.", segmentType: 'QUIZ', startTime: 166500, endTime: 170000, duration: 3500, audioUri: getBundledAudioUri('en_coffee_shop', 33) },
    { id: 'line_34', speakerId: 1, text: "What does \"That's all\" mean?", spokenText: "Question two: What does \"That's all\" mean? We covered this phrase.", segmentType: 'QUIZ', startTime: 170500, endTime: 174500, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 34) },
    { id: 'line_35', speakerId: 1, text: "I'm done ordering", spokenText: "The answer is: it means you're done ordering.", segmentType: 'QUIZ', startTime: 175000, endTime: 177500, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 35) },
    { id: 'line_36', speakerId: 1, text: "What size coffee was ordered?", spokenText: "Question three: In our conversation, what size coffee did the customer order?", segmentType: 'QUIZ', startTime: 178000, endTime: 182500, duration: 4500, audioUri: getBundledAudioUri('en_coffee_shop', 36) },
    { id: 'line_37', speakerId: 1, text: "Large", spokenText: "The answer is: large. They said \"I'd like a large coffee, please.\"", segmentType: 'QUIZ', startTime: 183000, endTime: 187000, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 37) },
    { id: 'line_38', speakerId: 1, text: "How do you politely ask for a large?", spokenText: "Last question: How do you politely ask for a large size?", segmentType: 'QUIZ', startTime: 187500, endTime: 191500, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 38) },
    { id: 'line_39', speakerId: 1, text: "\"Large, please\"", spokenText: "The answer is: \"Large, please.\" Adding please makes it polite. Great job!", segmentType: 'QUIZ', startTime: 192000, endTime: 196500, duration: 4500, audioUri: getBundledAudioUri('en_coffee_shop', 39) },

    // CULTURAL NOTE (3 lines: 40-42)
    { id: 'line_40', speakerId: 1, text: "In many countries, tipping baristas is appreciated but not required.", spokenText: "Here's an interesting cultural tip: In many countries, tipping baristas is appreciated but not required. It's a nice gesture, but don't feel pressured.", segmentType: 'CULTURAL', startTime: 197000, endTime: 206000, duration: 9000, audioUri: getBundledAudioUri('en_coffee_shop', 40) },
    { id: 'line_41', speakerId: 1, text: "In the US, it's common to leave a dollar or two in the tip jar.", spokenText: "In the United States specifically, it's common to leave a dollar or two in the tip jar. You'll usually see one near the register.", segmentType: 'CULTURAL', startTime: 206500, endTime: 215000, duration: 8500, audioUri: getBundledAudioUri('en_coffee_shop', 41) },
    { id: 'line_42', speakerId: 1, text: "Coffee shops often have loyalty programs - ask about rewards cards!", spokenText: "One more tip: Coffee shops often have loyalty programs. Don't be shy to ask about rewards cards - you can earn free drinks over time!", segmentType: 'CULTURAL', startTime: 215500, endTime: 224500, duration: 9000, audioUri: getBundledAudioUri('en_coffee_shop', 42) },
  ];

  return {
    config: {
      language: 'en',
      location: 'coffee_shop',
      situation: 'Ordering a drink',
      difficulty: 'intermediate',
      format: 'classroom_style',
      lessonSegments: [
        { id: 'seg_0', type: 'welcome' },
        { id: 'seg_1', type: 'vocabulary' },
        { id: 'seg_2', type: 'slow_dialogue' },
        { id: 'seg_3', type: 'breakdown' },
        { id: 'seg_4', type: 'natural_speed' },
        { id: 'seg_5', type: 'quiz' },
        { id: 'seg_6', type: 'cultural_note' },
      ],
      speaker1: { name: 'Maria', role: 'Customer' },
      speaker2: { name: 'Jordan', role: 'Barista' },
      quizConfig: {
        vocabL2ToL1: true,
        vocabL1ToL2: true,
        phraseMeaning: true,
        comprehension: true,
      },
    },
    lines,
    totalDuration: 224500,
  };
}

// Placeholder functions for other lessons - will be filled in when audio is generated
function createEnglishRestaurantLesson(): GeneratedDialogue {
  return createPlaceholderLesson('en', 'restaurant');
}

function createSpanishCoffeeShopLesson(): GeneratedDialogue {
  return createPlaceholderLesson('es', 'coffee_shop');
}

function createSpanishRestaurantLesson(): GeneratedDialogue {
  return createPlaceholderLesson('es', 'restaurant');
}

function createFrenchCoffeeShopLesson(): GeneratedDialogue {
  return createPlaceholderLesson('fr', 'coffee_shop');
}

function createFrenchRestaurantLesson(): GeneratedDialogue {
  return createPlaceholderLesson('fr', 'restaurant');
}

function createPlaceholderLesson(language: Language, location: Location): GeneratedDialogue {
  // Return a minimal placeholder - will be replaced with real data
  const key = `${language}_${location}` as BundledLessonKey;
  return {
    config: {
      language,
      location,
      situation: location === 'coffee_shop' ? 'Ordering a drink' : 'Ordering food',
      difficulty: 'intermediate',
      format: 'classroom_style',
      lessonSegments: [
        { id: 'seg_0', type: 'welcome' },
        { id: 'seg_1', type: 'vocabulary' },
        { id: 'seg_2', type: 'slow_dialogue' },
        { id: 'seg_3', type: 'breakdown' },
        { id: 'seg_4', type: 'natural_speed' },
        { id: 'seg_5', type: 'quiz' },
        { id: 'seg_6', type: 'cultural_note' },
      ],
      speaker1: { name: 'Maria', role: 'Customer' },
      speaker2: { name: 'Ben', role: language === 'es' ? 'Camarero' : language === 'fr' ? 'Serveur' : 'Server' },
      quizConfig: {
        vocabL2ToL1: true,
        vocabL1ToL2: true,
        phraseMeaning: true,
        comprehension: true,
      },
    },
    lines: [
      {
        id: 'line_0',
        speakerId: 1,
        text: 'Placeholder lesson - audio generation pending',
        segmentType: 'WELCOME',
        startTime: 0,
        endTime: 3000,
        duration: 3000,
        audioUri: getBundledAudioUri(key, 0),
      },
    ],
    totalDuration: 3000,
  };
}
