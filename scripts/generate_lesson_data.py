"""
Generate comprehensive lesson data for bundled audio
Creates 15-20 minute lessons for each language/location combination

Usage: 
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=<key> EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=<key> python scripts/generate_lesson_data.py
"""

import os
import json
from openai import OpenAI

OPENAI_API_KEY = os.environ.get('EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY')

if not OPENAI_API_KEY:
    print("Error: EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY not set")
    exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

def generate_lesson_prompt(language: str, location: str, language_label: str, location_label: str) -> str:
    """Generate a comprehensive lesson generation prompt for 15-20 minute lessons"""
    
    return f"""Generate a COMPREHENSIVE {language_label} language learning lesson for a {location_label}.

TARGET LESSON LENGTH: 15-20 minutes of audio content (approximately 120-150 dialogue lines total)

This is a FULL classroom-style lesson with extensive practice. Make it substantial and thorough.

Situation: Realistic {location_label} scenarios
Difficulty: Intermediate level
Speakers: Speaker 1 (student/customer), Speaker 2 (staff/teacher)

Format each line EXACTLY as: SpeakerID|SegmentType|[emotion]|dialogue text

SECTION BREAKDOWN (aim for these line counts):

1. WELCOME (7-10 lines)
   - Warm introduction from both teachers
   - Explain the lesson objectives
   - Set expectations for what student will learn
   - Build excitement and motivation

2. VOCABULARY (12-18 lines)
   - Present 12-15 key words/phrases
   - Each word should have: the term, definition, pronunciation notes if relevant
   - Cover essential {location_label} vocabulary
   - Include both beginner and intermediate level words

3. SLOW DIALOGUE (18-25 lines)
   - Extended conversation at slow, deliberate pace
   - Natural back-and-forth between speakers
   - Use all the vocabulary introduced
   - Clear, careful pronunciation
   - Realistic {location_label} scenario

4. BREAKDOWN (10-15 lines)
   - Analyze 8-12 key phrases from the slow dialogue
   - Explain grammar, usage, cultural context
   - Provide examples of when to use each phrase
   - Include variations and alternatives

5. NATURAL SPEED (35-50 lines)
   - LONG, realistic conversation at normal pace
   - Multiple exchanges, not just one quick interaction
   - Include:
     * Ordering/requesting
     * Questions and clarifications
     * Small talk/pleasantries
     * Problem solving (if relevant)
     * Conclusion/wrap-up
   - Make it feel like a real, complete {location_label} experience

6. QUIZ (12-18 lines - 6-9 question/answer pairs)
   - Test vocabulary from earlier
   - Test phrase meanings from breakdown
   - Test comprehension from the conversation
   - Test production (how to say things)
   - Include encouraging feedback with answers

7. CULTURAL NOTE (8-12 lines)
   - 4-6 distinct cultural insights
   - Each should be substantial (2 lines per insight)
   - Cover etiquette, customs, tips, common practices
   - Make it interesting and practical

IMPORTANT REQUIREMENTS:
- Output ONLY pipe-delimited lines, no headers, no extra text
- Use {language_label} for ALL dialogue (not English unless {language_label} is English)
- Be thorough - this is a 15-20 minute comprehensive lesson
- Make dialogue natural and realistic
- Include emotions to guide audio generation
- Ensure smooth transitions between sections

Generate the complete lesson now:"""

# Lesson configurations to generate
LESSONS = [
    {
        "language": "en",
        "location": "restaurant",
        "language_label": "English",
        "location_label": "Restaurant",
        "situation": "Ordering food at a restaurant"
    },
    {
        "language": "es",
        "location": "coffee_shop",
        "language_label": "Spanish",
        "location_label": "Coffee Shop",
        "situation": "Ordering coffee and pastries"
    },
    {
        "language": "es",
        "location": "restaurant",
        "language_label": "Spanish",
        "location_label": "Restaurant",
        "situation": "Ordering a meal"
    },
    {
        "language": "fr",
        "location": "coffee_shop",
        "language_label": "French",
        "location_label": "Café",
        "situation": "Ordering coffee and snacks"
    },
    {
        "language": "fr",
        "location": "restaurant",
        "language_label": "French",
        "location_label": "Restaurant",
        "situation": "Dining at a restaurant"
    }
]

def generate_lesson_data(lesson_config):
    """Generate lesson data using OpenAI"""
    print(f"\n{'='*80}")
    print(f"Generating: {lesson_config['language_label']} - {lesson_config['location_label']}")
    print(f"{'='*80}\n")
    
    prompt = generate_lesson_prompt(
        lesson_config['language'],
        lesson_config['location'],
        lesson_config['language_label'],
        lesson_config['location_label']
    )
    
    print("Calling OpenAI API...")
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an expert language learning content creator. Generate comprehensive, engaging lessons with natural dialogue. Output ONLY the pipe-delimited format requested, no additional text."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=4000
    )
    
    lesson_text = response.choices[0].message.content
    lines = [line.strip() for line in lesson_text.split('\n') if line.strip() and '|' in line]
    
    print(f"✅ Generated {len(lines)} dialogue lines")
    
    # Parse lines
    parsed_lines = []
    for line in lines:
        parts = line.split('|')
        if len(parts) >= 3:
            speaker_id = int(parts[0])
            segment_type = parts[1]
            
            # Extract emotion if present
            emotion = None
            text = '|'.join(parts[2:])
            if text.startswith('[') and ']' in text:
                emotion_end = text.index(']')
                emotion = text[1:emotion_end]
                text = text[emotion_end+2:].strip()
            
            parsed_lines.append({
                'speakerId': speaker_id,
                'segmentType': segment_type,
                'emotion': emotion,
                'text': text
            })
    
    # Save to JSON file
    output_file = f"lesson_data_{lesson_config['language']}_{lesson_config['location']}.json"
    output_path = os.path.join('/app/scripts', output_file)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'config': lesson_config,
            'lines': parsed_lines
        }, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to: {output_path}")
    print(f"   Total lines: {len(parsed_lines)}")
    
    # Count by section
    from collections import Counter
    section_counts = Counter(line['segmentType'] for line in parsed_lines)
    print(f"   Sections: {dict(section_counts)}")
    
    return parsed_lines

def main():
    print("🎓 Comprehensive Lesson Data Generator")
    print("   Target: 15-20 minute lessons (~120-150 lines each)")
    print()
    
    for lesson in LESSONS:
        try:
            generate_lesson_data(lesson)
        except Exception as e:
            print(f"❌ Error generating {lesson['language']}_{lesson['location']}: {e}")
            continue
    
    print(f"\n{'='*80}")
    print("✅ All lesson data generated!")
    print("   Next step: Run generate-bundled-audio.ts to create audio files")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
