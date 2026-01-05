# Language Learning Conversation Practice

A mobile app for language learners that creates conversational practice dialogues with audio and synchronized subtitles.

## Features

### Configuration Screen
All options are organized in a clean, intuitive order:

**1. Language**
- Choose from 50+ languages including Spanish, French, German, Japanese, Korean, Chinese, Arabic, and many more
- Each language shows its flag for easy identification

**2. Difficulty**
- **Beginner**: Simple vocabulary, short sentences, slow pace
- **Intermediate**: Natural phrases, common idioms, moderate pace
- **Advanced**: Complex expressions, nuanced dialogue, natural speed

**3. Format**
Choose your lesson structure:
- **Quick Dialogue** (default): Just the conversation
- **Vocabulary First**: Words introduced, then conversation
- **Classroom Style**: Full lesson with Vocab, Slow Dialogue, Breakdown, Natural Speed, and Quiz
- **Immersion**: Long natural conversation, no hand-holding
- **Custom**: Arrange your own lesson structure with drag-and-drop

**4. Location**
- Coffee Shop, Restaurant, Airport, Hotel, Grocery Store, Doctor's Office, Pharmacy, Bank, Public Transit, Clothing Store

**5. Characters**
- **You**: Choose your role (varies by location - Customer, Staff, etc.)
- **Them**: Complementary roles based on your selection
- Each location has multiple role options for both speakers

**6. Lesson Builder**
Visual display of lesson sections as colored pills:
- **Welcome** (cyan, inverted with pin icon): Introduction where characters greet you and set up the lesson - position-locked at the start
- **Vocabulary** (purple): Key words and definitions
- **Slow Dialogue** (sky blue): Conversation at slow pace
- **Breakdown** (amber): Grammar and phrase explanations
- **Conversation** (green): Full-speed natural conversation
- **Quiz** (red, inverted with pin icon): Comprehension questions - position-locked at the end
- **Cultural Note** (pink): Cultural context and tips

Welcome and Quiz are special sections with inverted colors (solid background, white text) and a pin icon to indicate they're position-locked. Welcome always appears first when included, Quiz always appears last when included. Both can only be added once and can be removed. When using Custom format, drag middle segments to reorder and add/remove as needed.

**Quiz Configuration (within Lesson Builder)**
Tap the Quiz pill to expand and configure which quiz card types to include:
- **Vocab (L2 → L1)**: "What does 'coffee' mean?" (default: ON)
- **Vocab (L1 → L2)**: "How do you say 'café' in English?" (default: ON)
- **Phrase Meaning**: "What does 'Can I get a...' mean?" (default: ON)
- **Comprehension**: "What did Maria order?" (default: ON)

The quiz is a passive, audio-driven experience:
- Audio prompts the question aloud
- A flashcard displays on screen (front = question)
- 4-second pause for mental retrieval
- Card auto-flips (or user taps to flip early)
- Audio reads the answer
- Fully hands-free — listen through without touching the screen

### Dialogue Generation
- Uses GPT to create realistic dialogues tailored to your settings
- Content adapts based on lesson format and segment order
- Includes emotional cues for natural expression
- **ElevenLabs TTS** (default) generates high-quality audio with natural accents and emotions
- **OpenAI TTS** available as alternative (lower cost, good quality)
- Characters introduce themselves by name and role in the Welcome section
- **Seamless section transitions**: The lesson flows as one continuous class, with natural bridging phrases between sections (e.g., after Welcome the teacher naturally says "Now let's go over some key vocabulary..." before the Vocabulary section begins)

### Playback Screen
- Large play/pause button
- Current dialogue line highlighted prominently
- Previous lines shown above (dimmed)
- Upcoming lines shown below (dimmed)
- Tap any line to jump to that point
- Replay button
- Shows speaker names and segment types
- Smooth animations when transitioning between lines
- Haptic feedback on interactions
- **Smart auto-scroll**: Follows along with audio playback, but pauses when you manually scroll to browse freely. Auto-scroll resumes when you tap a card, use the progress bar, or replay.

#### Segmented Audio Progress Bar
A music-app style progress bar positioned at the bottom near the play controls:
- Bar is divided into colored segments matching each lesson section (Vocabulary, Dialogue, Quiz, etc.)
- Uses the same color scheme as the Lesson Builder for consistency
- Shows a colored playhead indicator matching the current section
- **Tap anywhere on the bar** to jump to that exact position in the lesson
- **Long-press any segment** to see a tooltip with the section name
- Audio and content stay synchronized when seeking

#### Playback Speed Control
A speed button next to the play button allows users to slow down playback:
- **1x** - Normal speed (default)
- **0.75x** - Slightly slower for easier comprehension
- **0.5x** - Half speed for detailed listening practice
- Tap the button to cycle through speeds

#### Section View Toggle
The lesson has ONE continuous audio script (the "foundation script") - the literal words spoken by the characters from start to finish. Each section corresponds to a portion of this foundation script. Some sections display the script directly, while others present a restructured pedagogical view.

**Structural Architecture:**
- **Default view shows literal speech (no icon needed):** Welcome, Slow Dialogue, Conversation - these sections show dialogue bubbles which ARE what's being spoken
- **Default view is restructured (microphone icon reveals script):** Vocabulary, Breakdown, Quiz - these sections show flashcards/phrase cards/quiz cards as the default, with a microphone icon to reveal the underlying foundation script

**For sections with alternate views (Vocabulary, Breakdown, Quiz):**
- **Content icon** (list on left): Shows the pedagogical view (flashcards, phrase cards, quiz cards) - default
- **Script icon** (microphone on right): Reveals the foundation script - what's actually being spoken as conversation bubbles

**Foundation Script Format (when microphone icon is tapped):**
Shows what is actually being spoken aloud - the full narration, not the condensed display format:
- For Vocabulary: Instead of "coffee - a hot beverage", you'll see the actual narration like "Let's start with our first word: coffee. Coffee is a popular hot beverage..."
- For Breakdown: Instead of just the phrase and definition, you'll see the conversational explanation
- For Quiz: Instead of just "Question 1: ...", you'll hear the full spoken prompt with context
- Speaker name displayed (e.g., "Maria", "Ben")
- Highlights in sync with audio playback (current line highlighted, past lines dimmed)
- Tap any line to jump to that position in audio

This shows the ACTUAL words being spoken, which may differ from the condensed card format shown in the default view.

#### Tap-to-Seek on Cards
Tap any content card to jump the audio to that position:
- Tapping a vocabulary card, dialogue bubble, breakdown card, quiz card, or cultural note seeks to that line
- For cards with expandable content (vocabulary, dialogue, breakdown), tap the chevron icon or "see more" text to expand without seeking
- For quiz answers, tap "Tap to reveal" to show the answer without seeking

#### Visual Section Headers
Each segment type has a centered divider header that appears when the section changes, making lesson structure easy to follow.

#### Tap-to-Reveal Interactions
Each card type supports tap interactions for deeper learning:

**Vocabulary Cards**
- Tap chevron or "see more" to expand and reveal:
  - Pronunciation guide
  - Translation/definition
  - Example sentence in context

**Dialogue Bubbles** (Slow Dialogue only)
- Tap chevron or "see breakdown" to expand and reveal:
  - Word-by-word breakdown
  - Literal translation
- Conversation section dialogue does not expand (clean, natural flow)

**Breakdown Cards**
- Tap chevron or "Tap for alternatives" to expand and reveal:
  - Alternative expressions
  - Common mistakes to avoid

**Quiz Cards (Flashcard Mode)**
- In Flashcard Mode (default for Quiz), questions and answers are paired into flip cards
- Large question text on the front with a physical card appearance (e.g., "What does 'coffee' mean?")
- Tap the card to flip and reveal the answer on the back (e.g., "A hot beverage made from beans")
- 3D rotation animation creates a realistic card flip effect
- Front: Red theme with question icon
- Back: Green theme with "ANSWER" badge
- Long-press to jump to that position in audio
- Audio plays full conversational narration (e.g., "Question one: What does coffee mean? Take a moment to think...")
- Card display shows clean, concise text for easy reading
- **Note**: Quiz section only appears in Classroom Style or Custom lesson formats

**Cultural Notes**
- Tap to seek to that position in the audio

## API Keys Required

To enable dialogue and audio generation, add these environment variables in the ENV tab:

- `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` - For GPT dialogue generation (required)
- `EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY` - For ElevenLabs TTS (optional, falls back to OpenAI TTS)

Without API keys, the app will use mock dialogue data for demonstration.

## Dev Settings

Shake the device to open Dev Settings, which allows you to:
- **Toggle TTS Provider**: Switch between ElevenLabs (higher quality) and OpenAI (lower cost)
- **Replay Last Lesson**: Replay the most recently generated lesson without regenerating
- **Instant Mock Lesson**: Skip generation and use mock data for quick testing

Settings persist across app restarts.

## Tech Stack

- Expo SDK 53 / React Native
- Expo Router for navigation
- Zustand for state management
- React Native Reanimated for animations
- React Native Gesture Handler for drag interactions
- expo-av for audio playback
- NativeWind (Tailwind CSS) for styling
