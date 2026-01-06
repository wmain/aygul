"""
Audio Cache Model for MongoDB
Stores metadata for section-based audio caching system
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DialogueTimestamp(BaseModel):
    """Individual dialogue line timing within a section"""
    text: str
    speaker_id: int  # 1 or 2
    start: float  # seconds
    end: float  # seconds
    emotion: Optional[str] = None


class AudioCacheEntry(BaseModel):
    """MongoDB document for cached section audio"""
    cache_key: str = Field(..., description="Unique cache key: language_section_location_speakerA_speakerB")
    section_type: str  # welcome, vocabulary, slow_dialogue, etc.
    language: str  # en, es, fr
    location: str  # coffee_shop, restaurant
    speaker_a: str  # First speaker name (lowercased)
    speaker_b: str  # Second speaker name (lowercased)
    audio_path: str  # Relative path to audio file: /audio-cache/{language}/{location}/{cache_key}.mp3
    dialogue_timestamps: List[DialogueTimestamp]
    duration: int  # Total duration in milliseconds
    file_size: int  # Size in bytes
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    
    class Config:
        json_schema_extra = {
            "example": {
                "cache_key": "en_welcome_coffeeshop_maria_jordan",
                "section_type": "welcome",
                "language": "en",
                "location": "coffeeshop",
                "speaker_a": "maria",
                "speaker_b": "jordan",
                "audio_path": "/audio-cache/en/coffeeshop/en_welcome_coffeeshop_maria_jordan.mp3",
                "dialogue_timestamps": [
                    {"text": "Welcome!", "speaker_id": 1, "start": 0.0, "end": 1.2},
                    {"text": "Hello!", "speaker_id": 2, "start": 1.5, "end": 2.8}
                ],
                "duration": 18000,
                "file_size": 285000,
            }
        }


class AudioCacheResponse(BaseModel):
    """Response model for audio cache requests"""
    cache_key: str
    audio_url: str  # Full URL to audio file
    timestamps: List[DialogueTimestamp]
    duration: int
    is_cached: bool  # True if loaded from cache, False if newly generated


class GenerateSectionRequest(BaseModel):
    """Request to generate a section audio"""
    section_type: str
    language: str
    location: str
    speaker_a: str
    speaker_b: str
    dialogue_lines: List[dict]  # Array of {text, spokenText, speakerId, emotion}
