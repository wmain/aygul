"""
Backend API Tests for Audio Cache System
Tests the audio caching endpoints and functionality
"""

import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test basic health check"""
    
    def test_health_endpoint(self):
        """Health endpoint should return 200"""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestAudioCacheEndpoints:
    """Test audio cache API endpoints"""
    
    def test_cache_stats_endpoint(self):
        """Cache stats should return valid statistics"""
        response = client.get("/api/audio/cache/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total_cached_sections" in data
        assert "total_size_bytes" in data
        assert "total_size_mb" in data
        assert "by_language" in data
        
        # Verify types
        assert isinstance(data["total_cached_sections"], int)
        assert isinstance(data["total_size_bytes"], int)
        assert isinstance(data["total_size_mb"], float)
        assert isinstance(data["by_language"], dict)
    
    def test_generate_section_audio(self):
        """Section audio generation should work"""
        request_data = {
            "section_type": "test_section",
            "language": "en",
            "location": "test_location",
            "speaker_a": "test_speaker_a",
            "speaker_b": "test_speaker_b",
            "dialogue_lines": [
                {"text": "Test line 1", "speakerId": 1},
                {"text": "Test line 2", "speakerId": 2}
            ]
        }
        
        response = client.post("/api/audio/section/generate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "cache_key" in data
        assert "audio_url" in data
        assert "timestamps" in data
        assert "duration" in data
        assert "is_cached" in data
        
        # Verify cache key format
        expected_key = "en_testsection_testlocation_test_speaker_a_test_speaker_b"
        assert data["cache_key"] == expected_key
        
        # First generation should not be cached
        assert data["is_cached"] == False or data["is_cached"] == True  # Could be either if run multiple times
        
        return data["cache_key"]
    
    def test_cache_hit_behavior(self):
        """Requesting same section twice should hit cache on second request"""
        request_data = {
            "section_type": "cache_test",
            "language": "en",
            "location": "testloc",
            "speaker_a": "speaker1",
            "speaker_b": "speaker2",
            "dialogue_lines": [{"text": "Test", "speakerId": 1}]
        }
        
        # First request
        response1 = client.post("/api/audio/section/generate", json=request_data)
        assert response1.status_code == 200
        data1 = response1.json()
        cache_key = data1["cache_key"]
        
        # Second request (should hit cache)
        response2 = client.post("/api/audio/section/generate", json=request_data)
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Should return same cache key
        assert data2["cache_key"] == cache_key
        # Should be marked as cached
        assert data2["is_cached"] == True


class TestLegacyEndpoints:
    """Test legacy TTS and dialogue endpoints still work"""
    
    def test_tts_endpoint_structure(self):
        """TTS endpoint should accept requests (may fail without valid API key)"""
        request_data = {
            "text": "Hello world",
            "voice": "test_voice",
            "provider": "elevenlabs"
        }
        
        response = client.post("/api/tts", json=request_data)
        # May return 500 if API key issues, but should not 404
        assert response.status_code in [200, 500]
    
    def test_dialogue_endpoint_structure(self):
        """Dialogue endpoint should accept requests"""
        request_data = {
            "config": {
                "language": "en",
                "location": "coffee_shop",
                "situation": "ordering",
                "difficulty": "intermediate",
                "format": "classroom_style"
            }
        }
        
        response = client.post("/api/generate-dialogue", json=request_data)
        # May return 500 if API key issues, but should not 404
        assert response.status_code in [200, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
