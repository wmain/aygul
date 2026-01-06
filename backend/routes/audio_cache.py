"""
Audio Cache API Routes
Handles section-based audio caching with 3-tier architecture:
1. Check device cache (handled by frontend)
2. Check server cache (MongoDB + local files)
3. Generate via ElevenLabs API → cache it
"""

import os
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import Optional

from models.audio_cache import (
    AudioCacheEntry,
    AudioCacheResponse,
    GenerateSectionRequest,
    DialogueTimestamp
)
from services.cache_key_generator import generate_cache_key, get_audio_file_path
from services.elevenlabs_dialogue import generate_dialogue_audio


router = APIRouter(prefix="/api/audio", tags=["audio-cache"])

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'languageapp')

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]


@router.get("/section/{cache_key}", response_model=AudioCacheResponse)
async def get_cached_section(cache_key: str):
    """
    Check if a section audio file exists in server cache
    
    Returns:
        - 200: Audio metadata if found
        - 404: Not found in cache
    """
    # Look up in MongoDB
    cache_entry = await db.audio_cache.find_one(
        {"cache_key": cache_key},
        {"_id": 0}
    )
    
    if not cache_entry:
        raise HTTPException(status_code=404, detail="Audio not found in cache")
    
    # Construct full audio URL
    # For local development, use the backend URL
    backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
    audio_url = f"{backend_url}/api/audio/file/{cache_key}"
    
    return AudioCacheResponse(
        cache_key=cache_entry['cache_key'],
        audio_url=audio_url,
        timestamps=cache_entry['dialogue_timestamps'],
        duration=cache_entry['duration'],
        is_cached=True
    )


@router.get("/file/{cache_key}")
async def download_audio_file(cache_key: str):
    """
    Download the actual audio file
    
    Returns the MP3 file for streaming/download
    """
    # Look up file path in MongoDB
    cache_entry = await db.audio_cache.find_one(
        {"cache_key": cache_key},
        {"_id": 0, "audio_path": 1}
    )
    
    if not cache_entry:
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    audio_path = cache_entry['audio_path']
    full_path = f"/app/backend{audio_path}"
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Audio file missing from storage")
    
    return FileResponse(
        full_path,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )


@router.post("/section/generate", response_model=AudioCacheResponse)
async def generate_section_audio(request: GenerateSectionRequest):
    """
    Generate section audio or return from cache if exists
    
    This is the main endpoint that:
    1. Checks if audio already exists in cache
    2. If yes: returns cached version
    3. If no: generates via ElevenLabs, caches it, returns it
    """
    # Generate cache key
    cache_key = generate_cache_key(
        request.language,
        request.section_type,
        request.location,
        request.speaker_a,
        request.speaker_b
    )
    
    # Check if already cached
    existing = await db.audio_cache.find_one(
        {"cache_key": cache_key},
        {"_id": 0}
    )
    
    if existing:
        # Return cached version
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        audio_url = f"{backend_url}/api/audio/file/{cache_key}"
        
        return AudioCacheResponse(
            cache_key=cache_key,
            audio_url=audio_url,
            timestamps=existing['dialogue_timestamps'],
            duration=existing['duration'],
            is_cached=True
        )
    
    # Generate new audio
    try:
        audio_bytes, timestamps = await generate_dialogue_audio(
            dialogue_lines=request.dialogue_lines,
            speaker_a=request.speaker_a,
            speaker_b=request.speaker_b,
            language=request.language
        )
        
        # Save audio file to local storage
        audio_path = get_audio_file_path(cache_key, request.language, request.location)
        full_path = f"/app/backend{audio_path}"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Write audio file
        with open(full_path, 'wb') as f:
            f.write(audio_bytes)
        
        file_size = len(audio_bytes)
        
        # Calculate total duration from timestamps
        duration_ms = int(timestamps[-1]['end'] * 1000) if timestamps else 0
        
        # Store metadata in MongoDB
        cache_entry = {
            "cache_key": cache_key,
            "section_type": request.section_type,
            "language": request.language,
            "location": request.location,
            "speaker_a": request.speaker_a,
            "speaker_b": request.speaker_b,
            "audio_path": audio_path,
            "dialogue_timestamps": timestamps,
            "duration": duration_ms,
            "file_size": file_size,
            "created_at": datetime.utcnow()
        }
        
        await db.audio_cache.insert_one(cache_entry)
        
        # Return response
        backend_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        audio_url = f"{backend_url}/api/audio/file/{cache_key}"
        
        return AudioCacheResponse(
            cache_key=cache_key,
            audio_url=audio_url,
            timestamps=timestamps,
            duration=duration_ms,
            is_cached=False  # Newly generated
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate audio: {str(e)}"
        )


@router.delete("/cache/clear")
async def clear_cache():
    """
    Clear all cached audio (admin endpoint)
    Use with caution - this deletes all cached audio files and database entries
    """
    # Delete all files
    import shutil
    cache_dir = "/app/backend/audio-cache"
    
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
        os.makedirs(cache_dir, exist_ok=True)
    
    # Clear MongoDB
    result = await db.audio_cache.delete_many({})
    
    return {
        "message": "Cache cleared",
        "deleted_count": result.deleted_count
    }


@router.get("/cache/stats")
async def get_cache_stats():
    """Get statistics about cached audio"""
    total_count = await db.audio_cache.count_documents({})
    
    # Get total file size
    pipeline = [
        {"$group": {"_id": None, "total_size": {"$sum": "$file_size"}}}
    ]
    size_result = await db.audio_cache.aggregate(pipeline).to_list(1)
    total_size = size_result[0]['total_size'] if size_result else 0
    
    # Get breakdown by language
    lang_pipeline = [
        {"$group": {"_id": "$language", "count": {"$sum": 1}}}
    ]
    lang_breakdown = await db.audio_cache.aggregate(lang_pipeline).to_list(100)
    
    return {
        "total_cached_sections": total_count,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "by_language": {item['_id']: item['count'] for item in lang_breakdown}
    }
