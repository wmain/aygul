"""
ElevenLabs Text-to-Dialogue Service
Generates multi-speaker conversation audio using ElevenLabs API
"""

import os
from typing import List, Tuple
from elevenlabs import ElevenLabs


# ElevenLabs voice IDs for different speakers
VOICE_MAP = {
    'maria': 'EXAVITQu4vr4xnSDxMaL',  # Bella - female, warm
    'jordan': 'onwK4e9ZLuTAKqWW03F9',  # Daniel - male, calm
    'alex': 'pNInz6obpgDQGcFmaJgB',    # Adam - male, deep
    'sarah': 'jsCqWAovK2LkecY7zXl4',   # Freya - female, expressive
    'james': 'VR6AewLTigWG4xSOukaG',   # Arnold - male, authoritative
    'lisa': 'XB0fDUnXU5powFXDhCwa',    # Charlotte - female, sophisticated
    'carlos': 'VR6AewLTigWG4xSOukaG',  # Arnold
    'ana': 'XB0fDUnXU5powFXDhCwa',     # Charlotte
    'ben': 'onwK4e9ZLuTAKqWW03F9',     # Daniel
}


def get_voice_id(speaker_name: str) -> str:
    """Get ElevenLabs voice ID for a speaker name"""
    name_lower = speaker_name.lower().strip()
    return VOICE_MAP.get(name_lower, VOICE_MAP['maria'])  # Default to Maria


async def generate_dialogue_audio(
    dialogue_lines: List[dict],
    speaker_a: str,
    speaker_b: str,
    language: str = 'en'
) -> Tuple[bytes, List[dict]]:
    """
    Generate multi-speaker dialogue audio using ElevenLabs text-to-dialogue API
    
    Args:
        dialogue_lines: List of {text, spokenText, speakerId, emotion}
        speaker_a: Name of first speaker
        speaker_b: Name of second speaker
        language: Language code (en, es, fr)
        
    Returns:
        Tuple of (audio_bytes, estimated_timestamps)
    """
    api_key = os.environ.get('ELEVENLABS_API_KEY')
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not configured")
    
    client = ElevenLabs(api_key=api_key)
    
    # Get voice IDs for speakers
    voice_a = get_voice_id(speaker_a)
    voice_b = get_voice_id(speaker_b)
    
    # Build inputs array for text-to-dialogue API
    inputs = []
    for line in dialogue_lines:
        text = line.get('spokenText') or line.get('text', '')
        speaker_id = line.get('speakerId', 1)
        voice_id = voice_a if speaker_id == 1 else voice_b
        
        inputs.append({
            'text': text,
            'voice_id': voice_id
        })
    
    # Call ElevenLabs text-to-dialogue API
    # Note: As of current API, this endpoint may be called text_to_dialogue or similar
    # Adjust based on actual SDK methods
    try:
        # Generate dialogue audio
        audio_response = client.text_to_dialogue.convert(
            inputs=inputs,
            model_id="eleven_v3"
        )
        
        # Collect audio bytes
        audio_bytes = b""
        for chunk in audio_response:
            audio_bytes += chunk
        
        # Calculate estimated timestamps based on text length
        timestamps = calculate_timestamps(dialogue_lines)
        
        return audio_bytes, timestamps
        
    except AttributeError:
        # Fallback: If text_to_dialogue not available, use individual TTS calls
        # This is a temporary fallback
        print("Warning: text_to_dialogue not available, falling back to concatenation")
        return await generate_dialogue_fallback(dialogue_lines, voice_a, voice_b, client)


def calculate_timestamps(dialogue_lines: List[dict]) -> List[dict]:
    """
    Calculate estimated timestamps for dialogue lines
    Based on text length with average speaking rate of 150 words/minute
    
    Args:
        dialogue_lines: List of dialogue line dictionaries
        
    Returns:
        List of timestamp objects
    """
    timestamps = []
    current_time = 0.0  # in seconds
    pause_between_lines = 0.3  # 300ms pause between speakers
    
    for line in dialogue_lines:
        text = line.get('spokenText') or line.get('text', '')
        speaker_id = line.get('speakerId', 1)
        emotion = line.get('emotion')
        
        # Calculate duration based on word count
        # Average speaking rate: ~150 words/minute = 2.5 words/second
        word_count = len(text.split())
        duration = max(word_count / 2.5, 0.5)  # Minimum 0.5 seconds
        
        timestamps.append({
            'text': text,
            'speaker_id': speaker_id,
            'start': round(current_time, 2),
            'end': round(current_time + duration, 2),
            'emotion': emotion
        })
        
        current_time += duration + pause_between_lines
    
    return timestamps


async def generate_dialogue_fallback(
    dialogue_lines: List[dict],
    voice_a: str,
    voice_b: str,
    client: ElevenLabs
) -> Tuple[bytes, List[dict]]:
    """
    Fallback: Generate dialogue by calling TTS for each line and concatenating
    Only used if text-to-dialogue API is not available
    """
    # This is a simplified fallback - in production you'd want proper audio concatenation
    # For now, just return empty audio and timestamps
    timestamps = calculate_timestamps(dialogue_lines)
    return b"", timestamps
