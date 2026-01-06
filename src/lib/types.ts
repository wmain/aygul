// Types for the Language Learning App

export type Language =
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko'
  | 'ar' | 'hi' | 'bn' | 'pa' | 'vi' | 'th' | 'tr' | 'pl' | 'uk' | 'nl'
  | 'sv' | 'da' | 'no' | 'fi' | 'cs' | 'el' | 'he' | 'id' | 'ms' | 'tl'
  | 'ro' | 'hu' | 'sk' | 'bg' | 'hr' | 'sr' | 'sl' | 'et' | 'lv' | 'lt'
  | 'sw' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'ur' | 'fa' | 'af';

export interface LanguageOption {
  value: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'bn', label: 'Bengali', flag: '🇧🇩' },
  { value: 'pa', label: 'Punjabi', flag: '🇮🇳' },
  { value: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
  { value: 'th', label: 'Thai', flag: '🇹🇭' },
  { value: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { value: 'pl', label: 'Polish', flag: '🇵🇱' },
  { value: 'uk', label: 'Ukrainian', flag: '🇺🇦' },
  { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { value: 'sv', label: 'Swedish', flag: '🇸🇪' },
  { value: 'da', label: 'Danish', flag: '🇩🇰' },
  { value: 'no', label: 'Norwegian', flag: '🇳🇴' },
  { value: 'fi', label: 'Finnish', flag: '🇫🇮' },
  { value: 'cs', label: 'Czech', flag: '🇨🇿' },
  { value: 'el', label: 'Greek', flag: '🇬🇷' },
  { value: 'he', label: 'Hebrew', flag: '🇮🇱' },
  { value: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { value: 'ms', label: 'Malay', flag: '🇲🇾' },
  { value: 'tl', label: 'Filipino', flag: '🇵🇭' },
  { value: 'ro', label: 'Romanian', flag: '🇷🇴' },
  { value: 'hu', label: 'Hungarian', flag: '🇭🇺' },
  { value: 'sk', label: 'Slovak', flag: '🇸🇰' },
  { value: 'bg', label: 'Bulgarian', flag: '🇧🇬' },
  { value: 'hr', label: 'Croatian', flag: '🇭🇷' },
  { value: 'sr', label: 'Serbian', flag: '🇷🇸' },
  { value: 'sl', label: 'Slovenian', flag: '🇸🇮' },
  { value: 'et', label: 'Estonian', flag: '🇪🇪' },
  { value: 'lv', label: 'Latvian', flag: '🇱🇻' },
  { value: 'lt', label: 'Lithuanian', flag: '🇱🇹' },
  { value: 'sw', label: 'Swahili', flag: '🇰🇪' },
  { value: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { value: 'te', label: 'Telugu', flag: '🇮🇳' },
  { value: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { value: 'gu', label: 'Gujarati', flag: '🇮🇳' },
  { value: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { value: 'ml', label: 'Malayalam', flag: '🇮🇳' },
  { value: 'ur', label: 'Urdu', flag: '🇵🇰' },
  { value: 'fa', label: 'Persian', flag: '🇮🇷' },
  { value: 'af', label: 'Afrikaans', flag: '🇿🇦' },
];

export type Location =
  | 'coffee_shop'
  | 'restaurant'
  | 'airport'
  | 'hotel'
  | 'grocery'
  | 'doctor'
  | 'pharmacy'
  | 'bank'
  | 'transit'
  | 'clothing';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type LessonFormat =
  | 'quick_dialogue'
  | 'vocabulary_first'
  | 'classroom_style'
  | 'immersion'
  | 'custom';

export type LessonSegmentType =
  | 'welcome'
  | 'vocabulary'
  | 'slow_dialogue'
  | 'breakdown'
  | 'natural_speed'
  | 'quiz'
  | 'cultural_note';

export interface LessonSegment {
  id: string;
  type: LessonSegmentType;
}

export const LESSON_FORMATS: { value: LessonFormat; label: string; description: string }[] = [
  { value: 'quick_dialogue', label: 'Quick Dialogue', description: 'Just the conversation' },
  { value: 'vocabulary_first', label: 'Vocabulary First', description: 'Words introduced, then conversation' },
  { value: 'classroom_style', label: 'Classroom Style', description: 'Full lesson: Vocab → Slow → Breakdown → Natural → Quiz' },
  { value: 'immersion', label: 'Immersion', description: 'Long natural conversation, no hand-holding' },
  { value: 'custom', label: 'Custom', description: 'Arrange your own lesson structure' },
];

export const LESSON_SEGMENT_CONFIGS: Record<LessonFormat, LessonSegmentType[]> = {
  quick_dialogue: ['welcome', 'natural_speed'],
  vocabulary_first: ['welcome', 'vocabulary', 'natural_speed'],
  classroom_style: ['welcome', 'vocabulary', 'slow_dialogue', 'breakdown', 'natural_speed', 'quiz'],
  immersion: ['welcome', 'natural_speed'],
  custom: ['welcome', 'vocabulary', 'slow_dialogue', 'breakdown', 'natural_speed', 'quiz', 'cultural_note'],
};

export const SEGMENT_DISPLAY_INFO: Record<LessonSegmentType, { label: string; color: string; bgColor: string }> = {
  welcome: { label: 'Welcome', color: '#06B6D4', bgColor: 'bg-cyan-500' },
  vocabulary: { label: 'Vocabulary', color: '#8B5CF6', bgColor: 'bg-violet-500' },
  slow_dialogue: { label: 'Slow Dialogue', color: '#0EA5E9', bgColor: 'bg-sky-500' },
  breakdown: { label: 'Breakdown', color: '#F59E0B', bgColor: 'bg-amber-500' },
  natural_speed: { label: 'Conversation', color: '#10B981', bgColor: 'bg-emerald-500' },
  quiz: { label: 'Quiz', color: '#EF4444', bgColor: 'bg-red-500' },
  cultural_note: { label: 'Cultural Note', color: '#EC4899', bgColor: 'bg-pink-500' },
};

export interface SpeakerConfig {
  name: string;
  role: string;
}

// Quiz card types that can be toggled on/off
export type QuizCardType = 'vocab_l2_to_l1' | 'vocab_l1_to_l2' | 'phrase_meaning' | 'comprehension';

export interface QuizConfig {
  vocabL2ToL1: boolean;  // "What does 'coffee' mean?" → "Coffee means 'café'."
  vocabL1ToL2: boolean;  // "How do you say 'café' in English?" → "Café is 'coffee'."
  phraseMeaning: boolean; // "What does 'Can I get a...' mean?" → "It means '¿Puedo tomar un...?'"
  comprehension: boolean; // "What did Maria order?" → "Maria ordered a latte."
}

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  vocabL2ToL1: true,
  vocabL1ToL2: true,
  phraseMeaning: true,
  comprehension: true,
};

export const QUIZ_CARD_TYPES: { key: keyof QuizConfig; label: string; description: string }[] = [
  { key: 'vocabL2ToL1', label: 'Vocab (L2 → L1)', description: '"What does \'coffee\' mean?"' },
  { key: 'vocabL1ToL2', label: 'Vocab (L1 → L2)', description: '"How do you say \'café\' in English?"' },
  { key: 'phraseMeaning', label: 'Phrase Meaning', description: '"What does \'Can I get a...\' mean?"' },
  { key: 'comprehension', label: 'Comprehension', description: '"What did Maria order?"' },
];

export interface DialogueLine {
  id: string;
  speakerId: 1 | 2;
  text: string;
  /** The actual words spoken aloud (for sections like Vocabulary where display differs from speech) */
  spokenText?: string;
  emotion?: string;
  segmentType?: string;
  audioUri?: string;
  /** For section-based audio: start time within the section audio file (in seconds) */
  sectionAudioStart?: number;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ConversationConfig {
  language: Language;
  location: Location;
  situation: string;
  difficulty: Difficulty;
  format: LessonFormat;
  lessonSegments: LessonSegment[];
  speaker1: SpeakerConfig; // You
  speaker2: SpeakerConfig; // Them
  quizConfig: QuizConfig;  // Quiz card type toggles
}

export interface GeneratedDialogue {
  config: ConversationConfig;
  lines: DialogueLine[];
  totalDuration: number;
}

export const LOCATIONS: { value: Location; label: string }[] = [
  { value: 'coffee_shop', label: 'Coffee Shop' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'airport', label: 'Airport' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'doctor', label: "Doctor's Office" },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'bank', label: 'Bank' },
  { value: 'transit', label: 'Public Transit' },
  { value: 'clothing', label: 'Clothing Store' },
];

export const SITUATIONS: Record<Location, string[]> = {
  coffee_shop: [
    'Ordering a drink',
    'Asking for WiFi password',
    'Finding a seat',
    'Asking about menu items',
  ],
  restaurant: [
    'Ordering food',
    'Making a reservation',
    'Asking about allergies',
    'Requesting the check',
    'Complaining about an order',
  ],
  airport: [
    'Checking in',
    'Going through security',
    'Finding your gate',
    'Reporting lost luggage',
    'Asking about delays',
  ],
  hotel: [
    'Checking in',
    'Requesting extra towels',
    'Asking for recommendations',
    'Reporting a room problem',
    'Checking out',
  ],
  grocery: [
    'Finding an item',
    'Asking about prices',
    'Checking out',
    'Returning an item',
  ],
  doctor: [
    'Describing symptoms',
    'Making an appointment',
    'Asking about medication',
    'Checking in',
  ],
  pharmacy: [
    'Picking up prescription',
    'Asking for recommendations',
    'Asking about side effects',
  ],
  bank: [
    'Opening an account',
    'Asking about fees',
    'Reporting lost card',
    'Making a deposit',
  ],
  transit: [
    'Buying a ticket',
    'Asking for directions',
    'Asking about delays',
  ],
  clothing: [
    'Asking for a size',
    'Finding fitting room',
    'Asking about returns',
    'Paying',
  ],
};

export const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Simple vocabulary, short sentences' },
  { value: 'intermediate', label: 'Intermediate', description: 'Natural phrases, common idioms' },
  { value: 'advanced', label: 'Advanced', description: 'Complex expressions, nuanced dialogue' },
];

// Character type: Role paired with a fixed name
export interface Character {
  role: string;
  name: string;
}

// Characters by location - each role has one fixed name
export const CHARACTER_ROLES: Record<Location, { you: Character[]; them: Character[] }> = {
  coffee_shop: {
    you: [
      { role: 'Customer', name: 'Maria' },
      { role: 'Barista', name: 'Jordan' },
      { role: 'Manager', name: 'Lisa' },
    ],
    them: [
      { role: 'Barista', name: 'Jordan' },
      { role: 'Manager', name: 'Lisa' },
      { role: 'Customer', name: 'Maria' },
    ],
  },
  restaurant: {
    you: [
      { role: 'Customer', name: 'Alex' },
      { role: 'Server', name: 'Jordan' },
      { role: 'Host', name: 'Sofia' },
    ],
    them: [
      { role: 'Server', name: 'Jordan' },
      { role: 'Host', name: 'Sofia' },
      { role: 'Manager', name: 'Kevin' },
      { role: 'Customer', name: 'Alex' },
    ],
  },
  airport: {
    you: [
      { role: 'Traveler', name: 'James' },
      { role: 'Airline Staff', name: 'Ben' },
      { role: 'Security Officer', name: 'Michael' },
      { role: 'Gate Agent', name: 'Ana' },
    ],
    them: [
      { role: 'Gate Agent', name: 'Ana' },
      { role: 'Security Officer', name: 'Michael' },
      { role: 'Airline Staff', name: 'Ben' },
      { role: 'Traveler', name: 'James' },
    ],
  },
  hotel: {
    you: [
      { role: 'Guest', name: 'Sarah' },
      { role: 'Front Desk Staff', name: 'Kevin' },
      { role: 'Concierge', name: 'Sofia' },
    ],
    them: [
      { role: 'Front Desk Staff', name: 'Kevin' },
      { role: 'Concierge', name: 'Sofia' },
      { role: 'Bellhop', name: 'Hassan' },
      { role: 'Guest', name: 'Sarah' },
    ],
  },
  grocery: {
    you: [
      { role: 'Shopper', name: 'Emma' },
      { role: 'Cashier', name: 'Ben' },
      { role: 'Stock Clerk', name: 'Jordan' },
    ],
    them: [
      { role: 'Cashier', name: 'Ben' },
      { role: 'Stock Clerk', name: 'Jordan' },
      { role: 'Customer Service', name: 'Lisa' },
      { role: 'Shopper', name: 'Emma' },
    ],
  },
  doctor: {
    you: [
      { role: 'Patient', name: 'Alex' },
      { role: 'Receptionist', name: 'Ana' },
      { role: 'Nurse', name: 'Nina' },
    ],
    them: [
      { role: 'Doctor', name: 'Michael' },
      { role: 'Receptionist', name: 'Ana' },
      { role: 'Nurse', name: 'Nina' },
      { role: 'Patient', name: 'Alex' },
    ],
  },
  pharmacy: {
    you: [
      { role: 'Customer', name: 'David' },
      { role: 'Pharmacist', name: 'Mei' },
      { role: 'Pharmacy Tech', name: 'Hassan' },
    ],
    them: [
      { role: 'Pharmacist', name: 'Mei' },
      { role: 'Pharmacy Tech', name: 'Hassan' },
      { role: 'Customer', name: 'David' },
    ],
  },
  bank: {
    you: [
      { role: 'Customer', name: 'Carlos' },
      { role: 'Teller', name: 'Nina' },
      { role: 'Account Manager', name: 'Michael' },
    ],
    them: [
      { role: 'Teller', name: 'Nina' },
      { role: 'Account Manager', name: 'Michael' },
      { role: 'Customer Service', name: 'Ana' },
      { role: 'Customer', name: 'Carlos' },
    ],
  },
  transit: {
    you: [
      { role: 'Rider', name: 'Yuki' },
      { role: 'Ticket Agent', name: 'Ben' },
      { role: 'Bus Driver', name: 'Hassan' },
    ],
    them: [
      { role: 'Ticket Agent', name: 'Ben' },
      { role: 'Bus Driver', name: 'Hassan' },
      { role: 'Station Attendant', name: 'Sofia' },
      { role: 'Rider', name: 'Yuki' },
    ],
  },
  clothing: {
    you: [
      { role: 'Shopper', name: 'Priya' },
      { role: 'Sales Associate', name: 'Jordan' },
      { role: 'Cashier', name: 'Mei' },
    ],
    them: [
      { role: 'Sales Associate', name: 'Jordan' },
      { role: 'Cashier', name: 'Mei' },
      { role: 'Manager', name: 'Lisa' },
      { role: 'Shopper', name: 'Priya' },
    ],
  },
};

