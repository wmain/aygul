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
function getBundledAudioUri(lessonKey: BundledLessonKey, lineIndex: number): any {
  // Use require() to load local audio files for Expo
  try {
    // Dynamically construct the require path
    // Note: Expo requires static paths, so we use a switch statement
    const key = `${lessonKey}_${lineIndex}`;
    return AUDIO_FILES[key] || null;
  } catch (error) {
    console.warn(`Audio file not found: ${lessonKey}/line_${lineIndex}.mp3`);
    return null;
  }
}

// Pre-load all audio file references using require()
// This is necessary because Expo requires static paths at build time
const AUDIO_FILES: Record<string, any> = {
  // English Coffee Shop
  'en_coffee_shop_0': require('@/assets/bundled-audio/en_coffee_shop/line_0.mp3'),
  'en_coffee_shop_1': require('@/assets/bundled-audio/en_coffee_shop/line_1.mp3'),
  'en_coffee_shop_2': require('@/assets/bundled-audio/en_coffee_shop/line_2.mp3'),
  'en_coffee_shop_3': require('@/assets/bundled-audio/en_coffee_shop/line_3.mp3'),
  'en_coffee_shop_4': require('@/assets/bundled-audio/en_coffee_shop/line_4.mp3'),
  'en_coffee_shop_5': require('@/assets/bundled-audio/en_coffee_shop/line_5.mp3'),
  'en_coffee_shop_6': require('@/assets/bundled-audio/en_coffee_shop/line_6.mp3'),
  'en_coffee_shop_7': require('@/assets/bundled-audio/en_coffee_shop/line_7.mp3'),
  'en_coffee_shop_8': require('@/assets/bundled-audio/en_coffee_shop/line_8.mp3'),
  'en_coffee_shop_9': require('@/assets/bundled-audio/en_coffee_shop/line_9.mp3'),
  'en_coffee_shop_10': require('@/assets/bundled-audio/en_coffee_shop/line_10.mp3'),
  'en_coffee_shop_11': require('@/assets/bundled-audio/en_coffee_shop/line_11.mp3'),
  'en_coffee_shop_12': require('@/assets/bundled-audio/en_coffee_shop/line_12.mp3'),
  'en_coffee_shop_13': require('@/assets/bundled-audio/en_coffee_shop/line_13.mp3'),
  'en_coffee_shop_14': require('@/assets/bundled-audio/en_coffee_shop/line_14.mp3'),
  'en_coffee_shop_15': require('@/assets/bundled-audio/en_coffee_shop/line_15.mp3'),
  'en_coffee_shop_16': require('@/assets/bundled-audio/en_coffee_shop/line_16.mp3'),
  'en_coffee_shop_17': require('@/assets/bundled-audio/en_coffee_shop/line_17.mp3'),
  'en_coffee_shop_18': require('@/assets/bundled-audio/en_coffee_shop/line_18.mp3'),
  'en_coffee_shop_19': require('@/assets/bundled-audio/en_coffee_shop/line_19.mp3'),
  'en_coffee_shop_20': require('@/assets/bundled-audio/en_coffee_shop/line_20.mp3'),
  'en_coffee_shop_21': require('@/assets/bundled-audio/en_coffee_shop/line_21.mp3'),
  'en_coffee_shop_22': require('@/assets/bundled-audio/en_coffee_shop/line_22.mp3'),
  'en_coffee_shop_23': require('@/assets/bundled-audio/en_coffee_shop/line_23.mp3'),
  'en_coffee_shop_24': require('@/assets/bundled-audio/en_coffee_shop/line_24.mp3'),
  'en_coffee_shop_25': require('@/assets/bundled-audio/en_coffee_shop/line_25.mp3'),
  'en_coffee_shop_26': require('@/assets/bundled-audio/en_coffee_shop/line_26.mp3'),
  'en_coffee_shop_27': require('@/assets/bundled-audio/en_coffee_shop/line_27.mp3'),
  'en_coffee_shop_28': require('@/assets/bundled-audio/en_coffee_shop/line_28.mp3'),
  'en_coffee_shop_29': require('@/assets/bundled-audio/en_coffee_shop/line_29.mp3'),
  'en_coffee_shop_30': require('@/assets/bundled-audio/en_coffee_shop/line_30.mp3'),
  'en_coffee_shop_31': require('@/assets/bundled-audio/en_coffee_shop/line_31.mp3'),
  'en_coffee_shop_32': require('@/assets/bundled-audio/en_coffee_shop/line_32.mp3'),
  'en_coffee_shop_33': require('@/assets/bundled-audio/en_coffee_shop/line_33.mp3'),
  'en_coffee_shop_34': require('@/assets/bundled-audio/en_coffee_shop/line_34.mp3'),
  'en_coffee_shop_35': require('@/assets/bundled-audio/en_coffee_shop/line_35.mp3'),
  'en_coffee_shop_36': require('@/assets/bundled-audio/en_coffee_shop/line_36.mp3'),
  'en_coffee_shop_37': require('@/assets/bundled-audio/en_coffee_shop/line_37.mp3'),
  'en_coffee_shop_38': require('@/assets/bundled-audio/en_coffee_shop/line_38.mp3'),
  'en_coffee_shop_39': require('@/assets/bundled-audio/en_coffee_shop/line_39.mp3'),
  'en_coffee_shop_40': require('@/assets/bundled-audio/en_coffee_shop/line_40.mp3'),
  'en_coffee_shop_41': require('@/assets/bundled-audio/en_coffee_shop/line_41.mp3'),
  'en_coffee_shop_42': require('@/assets/bundled-audio/en_coffee_shop/line_42.mp3'),
};

function createEnglishCoffeeShopLesson(): GeneratedDialogue {
  const lines: DialogueLine[] = [
    // WELCOME
    { id: 'line_0', speakerId: 1, text: "Welcome to today's lesson! I'm Maria, and I'll be your teacher.", segmentType: 'WELCOME', startTime: 0, endTime: 3000, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 0) },
    { id: 'line_1', speakerId: 2, text: "And I'm Ben. I'll be helping out with the practice conversations.", segmentType: 'WELCOME', startTime: 3500, endTime: 6500, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 1) },
    { id: 'line_2', speakerId: 1, text: "Today we're at a coffee shop. You'll learn how to order drinks and have a friendly chat with the barista.", segmentType: 'WELCOME', startTime: 7000, endTime: 11000, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 2) },

    // VOCABULARY
    { id: 'line_3', speakerId: 1, text: "coffee - a hot beverage made from roasted beans", spokenText: "Let's start with our first word: coffee. Coffee is a popular hot beverage made from roasted beans. You'll hear this everywhere in a coffee shop.", segmentType: 'VOCAB', startTime: 11500, endTime: 17000, duration: 5500, audioUri: getBundledAudioUri('en_coffee_shop', 3) },
    { id: 'line_4', speakerId: 1, text: "latte - espresso with steamed milk", spokenText: "Next up: latte. A latte is espresso mixed with steamed milk. It's creamy and delicious.", segmentType: 'VOCAB', startTime: 17500, endTime: 22000, duration: 4500, audioUri: getBundledAudioUri('en_coffee_shop', 4) },
    { id: 'line_5', speakerId: 1, text: "order - to request something", spokenText: "An important word: order. To order means to request something. You'll use this when telling the barista what you want.", segmentType: 'VOCAB', startTime: 22500, endTime: 27500, duration: 5000, audioUri: getBundledAudioUri('en_coffee_shop', 5) },
    { id: 'line_6', speakerId: 1, text: "to go - for takeaway, not to drink here", spokenText: "And finally: to go. When you want your drink to go, it means you're taking it with you, not drinking it in the shop.", segmentType: 'VOCAB', startTime: 28000, endTime: 33500, duration: 5500, audioUri: getBundledAudioUri('en_coffee_shop', 6) },

    // SLOW DIALOGUE
    { id: 'line_7', speakerId: 1, text: "Now let's hear these words in a real conversation. We'll take it slow at first.", segmentType: 'SLOW', startTime: 34000, endTime: 38000, duration: 4000, audioUri: getBundledAudioUri('en_coffee_shop', 7) },
    { id: 'line_8', speakerId: 2, text: "Hi there! Welcome to the coffee shop. What can I get for you today?", emotion: 'friendly', segmentType: 'SLOW', startTime: 38500, endTime: 43000, duration: 4500, audioUri: getBundledAudioUri('en_coffee_shop', 8) },
    { id: 'line_9', speakerId: 1, text: "Hello! I'd like a latte, please.", emotion: 'polite', segmentType: 'SLOW', startTime: 43500, endTime: 47000, duration: 3500, audioUri: getBundledAudioUri('en_coffee_shop', 9) },
    { id: 'line_10', speakerId: 2, text: "Of course! Would you like that for here or to go?", segmentType: 'SLOW', startTime: 47500, endTime: 51000, duration: 3500, audioUri: getBundledAudioUri('en_coffee_shop', 10) },
    { id: 'line_11', speakerId: 1, text: "To go, please.", segmentType: 'SLOW', startTime: 51500, endTime: 54000, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 11) },
    { id: 'line_12', speakerId: 2, text: "Great! That'll be four dollars and fifty cents.", segmentType: 'SLOW', startTime: 54500, endTime: 58000, duration: 3500, audioUri: getBundledAudioUri('en_coffee_shop', 12) },

    // BREAKDOWN
    { id: 'line_13', speakerId: 1, text: "What can I get for you? - A polite way to ask what someone wants to order", spokenText: "Let's break down some key phrases. 'What can I get for you?' is a polite way the barista asks what you want to order. It's very common in service situations.", segmentType: 'BREAKDOWN', startTime: 58500, endTime: 65000, duration: 6500, audioUri: getBundledAudioUri('en_coffee_shop', 13) },
    { id: 'line_14', speakerId: 1, text: "I'd like... - A polite way to express what you want", spokenText: "The phrase 'I'd like' is a polite way to say what you want. It's softer than saying 'I want'. Very useful in any ordering situation.", segmentType: 'BREAKDOWN', startTime: 65500, endTime: 72000, duration: 6500, audioUri: getBundledAudioUri('en_coffee_shop', 14) },
    { id: 'line_15', speakerId: 1, text: "For here or to go? - Asking if you're staying or leaving", spokenText: "'For here or to go?' is how staff ask if you're drinking in the shop or taking your order with you. In British English, you might hear 'eat in or take away' instead.", segmentType: 'BREAKDOWN', startTime: 72500, endTime: 80000, duration: 7500, audioUri: getBundledAudioUri('en_coffee_shop', 15) },

    // NATURAL SPEED
    { id: 'line_16', speakerId: 1, text: "Now let's hear a natural-speed conversation.", segmentType: 'NATURAL', startTime: 80500, endTime: 83500, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 16) },
    { id: 'line_17', speakerId: 2, text: "Hey! What can I get you?", emotion: 'casual', segmentType: 'NATURAL', startTime: 84000, endTime: 86000, duration: 2000, audioUri: getBundledAudioUri('en_coffee_shop', 17) },
    { id: 'line_18', speakerId: 1, text: "Hi! Can I get a large latte to go?", segmentType: 'NATURAL', startTime: 86500, endTime: 89000, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 18) },
    { id: 'line_19', speakerId: 2, text: "Sure thing! Anything else?", segmentType: 'NATURAL', startTime: 89500, endTime: 91500, duration: 2000, audioUri: getBundledAudioUri('en_coffee_shop', 19) },
    { id: 'line_20', speakerId: 1, text: "No, that's all, thanks!", segmentType: 'NATURAL', startTime: 92000, endTime: 94000, duration: 2000, audioUri: getBundledAudioUri('en_coffee_shop', 20) },
    { id: 'line_21', speakerId: 2, text: "That's four fifty. Here you go!", segmentType: 'NATURAL', startTime: 94500, endTime: 97000, duration: 2500, audioUri: getBundledAudioUri('en_coffee_shop', 21) },
    { id: 'line_22', speakerId: 1, text: "Perfect, thank you!", segmentType: 'NATURAL', startTime: 97500, endTime: 99500, duration: 2000, audioUri: getBundledAudioUri('en_coffee_shop', 22) },

    // QUIZ
    { id: 'line_23', speakerId: 1, text: "QUESTION: What does 'to go' mean?", spokenText: "Time for a quick quiz! Question one: What does 'to go' mean? Think about it for a moment.", segmentType: 'QUIZ', startTime: 100000, endTime: 106000, duration: 6000, audioUri: getBundledAudioUri('en_coffee_shop', 23) },
    { id: 'line_24', speakerId: 1, text: "ANSWER: Taking your order with you, not staying in the shop", spokenText: "The answer is: taking your order with you, not staying in the shop. Did you get it right?", segmentType: 'QUIZ', startTime: 106500, endTime: 112000, duration: 5500, audioUri: getBundledAudioUri('en_coffee_shop', 24) },
    { id: 'line_25', speakerId: 1, text: "QUESTION: How do you politely say what you want?", spokenText: "Question two: How do you politely say what you want to order?", segmentType: 'QUIZ', startTime: 112500, endTime: 117500, duration: 5000, audioUri: getBundledAudioUri('en_coffee_shop', 25) },
    { id: 'line_26', speakerId: 1, text: "ANSWER: I'd like...", spokenText: "The answer is: 'I'd like...' followed by what you want. For example, 'I'd like a latte, please.'", segmentType: 'QUIZ', startTime: 118000, endTime: 124000, duration: 6000, audioUri: getBundledAudioUri('en_coffee_shop', 26) },

    // CULTURAL NOTE
    { id: 'line_27', speakerId: 1, text: "Here's a cultural tip about coffee shops.", segmentType: 'CULTURAL', startTime: 124500, endTime: 127500, duration: 3000, audioUri: getBundledAudioUri('en_coffee_shop', 27) },
    { id: 'line_28', speakerId: 1, text: "In American coffee shops, tipping is common. A dollar or two for your drink is appreciated!", segmentType: 'CULTURAL', startTime: 128000, endTime: 134000, duration: 6000, audioUri: getBundledAudioUri('en_coffee_shop', 28) },
    { id: 'line_29', speakerId: 2, text: "That's right! And don't worry about small talk - baristas are usually friendly and happy to chat.", segmentType: 'CULTURAL', startTime: 134500, endTime: 140000, duration: 5500, audioUri: getBundledAudioUri('en_coffee_shop', 29) },
    { id: 'line_30', speakerId: 1, text: "Great job today! Keep practicing these phrases and you'll be ordering like a pro in no time.", segmentType: 'CULTURAL', startTime: 140500, endTime: 146000, duration: 5500, audioUri: getBundledAudioUri('en_coffee_shop', 30) },
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
      speaker2: { name: 'Ben', role: 'Barista' },
      quizConfig: {
        vocabL2ToL1: true,
        vocabL1ToL2: true,
        phraseMeaning: true,
        comprehension: true,
      },
    },
    lines,
    totalDuration: 146000,
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
