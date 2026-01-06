/**
 * Script to generate bundled audio files for development mode
 * Run with: bun scripts/generate-bundled-audio.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY;

// ElevenLabs voice IDs
const VOICES = {
  speaker1: 'EXAVITQu4vr4xnSDxMaL', // Bella - female, warm
  speaker2: 'onwK4e9ZLuTAKqWW03F9', // Daniel - male, calm
};

interface LessonLine {
  speakerId: 1 | 2;
  text: string;
  spokenText?: string;
  segmentType: string;
}

// English Coffee Shop lesson lines
const EN_COFFEE_SHOP_LINES: LessonLine[] = [
  // Welcome
  { speakerId: 1, segmentType: 'WELCOME', text: `Hello and welcome! I'm Maria, and I'll be your guide today.` },
  { speakerId: 2, segmentType: 'WELCOME', text: `And I'm Jordan! We're so glad you're here.` },
  { speakerId: 1, segmentType: 'WELCOME', text: `Today we'll practice a conversation at the Coffee Shop.` },
  { speakerId: 2, segmentType: 'WELCOME', text: `We'll focus on "Ordering a drink" - something you'll use all the time.` },
  { speakerId: 1, segmentType: 'WELCOME', text: `By the end, you'll feel confident handling this on your own. Let's get started!` },
  // Vocabulary
  { speakerId: 1, segmentType: 'VOCAB', text: `"coffee" - a hot beverage made from roasted beans`, spokenText: `Our first word is coffee. Coffee is a popular hot beverage made from roasted beans. You'll hear this everywhere.` },
  { speakerId: 1, segmentType: 'VOCAB', text: `"order" - to request something, especially food or drink`, spokenText: `Next up: order. To order means to request something, especially food or drink. For example, "I'd like to order a coffee."` },
  { speakerId: 1, segmentType: 'VOCAB', text: `"please" - a polite word used when making requests`, spokenText: `An important word: please. Please is a polite word used when making requests. Always add it to sound friendly.` },
  { speakerId: 1, segmentType: 'VOCAB', text: `"large" - bigger than normal size, often used for drink sizes`, spokenText: `And finally: large. Large means bigger than normal size. It's often used when choosing drink sizes.` },
  // Slow Dialogue
  { speakerId: 2, segmentType: 'SLOW', text: `Hello... How... can... I... help... you... today?` },
  { speakerId: 1, segmentType: 'SLOW', text: `Hi... I... would... like... to... order... please.` },
  { speakerId: 2, segmentType: 'SLOW', text: `Of... course... What... can... I... get... for... you?` },
  { speakerId: 1, segmentType: 'SLOW', text: `I'd... like... a... large... coffee... please.` },
  { speakerId: 2, segmentType: 'SLOW', text: `Would... you... like... anything... else?` },
  { speakerId: 1, segmentType: 'SLOW', text: `No... thank... you... That's... all.` },
  // Breakdown
  { speakerId: 1, segmentType: 'BREAKDOWN', text: `"How can I help you?" - A common greeting from service staff`, spokenText: `First phrase: "How can I help you?" This is a very common greeting you'll hear from service staff. You'll hear this as soon as you approach the counter.` },
  { speakerId: 1, segmentType: 'BREAKDOWN', text: `"I'd like to order" - A polite way to start your request`, spokenText: `Next: "I'd like to order." This is a polite way to start your request. It's softer than saying "I want."` },
  { speakerId: 1, segmentType: 'BREAKDOWN', text: `"What can I get for you?" - Another way staff ask for your order`, spokenText: `You might also hear: "What can I get for you?" This is another friendly way staff ask for your order.` },
  { speakerId: 1, segmentType: 'BREAKDOWN', text: `"That's all" - How to indicate you're done ordering`, spokenText: `Finally: "That's all." Use this to indicate you're done ordering. Simple but very useful!` },
  // Natural Speed
  { speakerId: 2, segmentType: 'NATURAL', text: `Hi there! Welcome in. What can I get started for you?` },
  { speakerId: 1, segmentType: 'NATURAL', text: `Hey! I'd like a large coffee, please.` },
  { speakerId: 2, segmentType: 'NATURAL', text: `Sure thing! Would you like that hot or iced?` },
  { speakerId: 1, segmentType: 'NATURAL', text: `Hot, please. It's a bit chilly today.` },
  { speakerId: 2, segmentType: 'NATURAL', text: `I hear you! Any room for cream?` },
  { speakerId: 1, segmentType: 'NATURAL', text: `Yes, just a little bit.` },
  { speakerId: 2, segmentType: 'NATURAL', text: `Perfect. Anything else I can get for you?` },
  { speakerId: 1, segmentType: 'NATURAL', text: `No, that's all for now. Thank you!` },
  { speakerId: 2, segmentType: 'NATURAL', text: `That'll be $4.50. Cash or card?` },
  { speakerId: 1, segmentType: 'NATURAL', text: `Card, please.` },
  { speakerId: 2, segmentType: 'NATURAL', text: `Great, just tap right here. Your coffee will be ready at the end of the bar.` },
  { speakerId: 1, segmentType: 'NATURAL', text: `Awesome, thanks so much!` },
  { speakerId: 2, segmentType: 'NATURAL', text: `You're welcome! Have a great day!` },
  // Quiz
  { speakerId: 1, segmentType: 'QUIZ', text: `What does "order" mean?`, spokenText: `Question one: What does "order" mean? We learned this word earlier. Take a moment.` },
  { speakerId: 1, segmentType: 'QUIZ', text: `To request something`, spokenText: `The answer is: to request something, especially food or drink.` },
  { speakerId: 1, segmentType: 'QUIZ', text: `What does "That's all" mean?`, spokenText: `Question two: What does "That's all" mean? We covered this phrase.` },
  { speakerId: 1, segmentType: 'QUIZ', text: `I'm done ordering`, spokenText: `The answer is: it means you're done ordering.` },
  { speakerId: 1, segmentType: 'QUIZ', text: `What size coffee was ordered?`, spokenText: `Question three: In our conversation, what size coffee did the customer order?` },
  { speakerId: 1, segmentType: 'QUIZ', text: `Large`, spokenText: `The answer is: large. They said "I'd like a large coffee, please."` },
  { speakerId: 1, segmentType: 'QUIZ', text: `How do you politely ask for a large?`, spokenText: `Last question: How do you politely ask for a large size?` },
  { speakerId: 1, segmentType: 'QUIZ', text: `"Large, please"`, spokenText: `The answer is: "Large, please." Adding please makes it polite. Great job!` },
  // Cultural
  { speakerId: 1, segmentType: 'CULTURAL', text: `In many countries, tipping baristas is appreciated but not required.`, spokenText: `Here's an interesting cultural tip: In many countries, tipping baristas is appreciated but not required. It's a nice gesture, but don't feel pressured.` },
  { speakerId: 1, segmentType: 'CULTURAL', text: `In the US, it's common to leave a dollar or two in the tip jar.`, spokenText: `In the United States specifically, it's common to leave a dollar or two in the tip jar. You'll usually see one near the register.` },
  { speakerId: 1, segmentType: 'CULTURAL', text: `Coffee shops often have loyalty programs - ask about rewards cards!`, spokenText: `One more tip: Coffee shops often have loyalty programs. Don't be shy to ask about rewards cards - you can earn free drinks over time!` },
];

async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY || '',
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateLessonAudio(lessonKey: string, lines: LessonLine[]) {
  const outputDir = path.join(__dirname, '..', 'assets', 'bundled-audio', lessonKey);

  console.log(`\nGenerating audio for ${lessonKey} (${lines.length} lines)...`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const textToSpeak = line.spokenText || line.text;
    const voiceId = line.speakerId === 1 ? VOICES.speaker1 : VOICES.speaker2;
    const outputPath = path.join(outputDir, `line_${i}.mp3`);

    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  [${i + 1}/${lines.length}] Skipping (exists): line_${i}.mp3`);
      continue;
    }

    try {
      console.log(`  [${i + 1}/${lines.length}] Generating: line_${i}.mp3`);
      const audioBuffer = await generateAudio(textToSpeak, voiceId);
      fs.writeFileSync(outputPath, audioBuffer);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  [${i + 1}/${lines.length}] Error: ${error}`);
    }
  }

  console.log(`Completed ${lessonKey}!`);
}

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error('Error: EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY not set');
    process.exit(1);
  }

  console.log('Starting bundled audio generation...');
  console.log('Using ElevenLabs API with eleven_flash_v2_5 model\n');

  // Generate English Coffee Shop (already done, will skip existing files)
  await generateLessonAudio('en_coffee_shop', EN_COFFEE_SHOP_LINES);

  // TODO: Add other lessons here
  // await generateLessonAudio('en_restaurant', EN_RESTAURANT_LINES);
  // await generateLessonAudio('es_coffee_shop', ES_COFFEE_SHOP_LINES);
  // await generateLessonAudio('es_restaurant', ES_RESTAURANT_LINES);
  // await generateLessonAudio('fr_coffee_shop', FR_COFFEE_SHOP_LINES);
  // await generateLessonAudio('fr_restaurant', FR_RESTAURANT_LINES);

  console.log('\n✓ Audio generation complete!');
  console.log('Files saved to: assets/bundled-audio/');
}

main().catch(console.error);
