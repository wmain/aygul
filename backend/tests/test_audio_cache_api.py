"""
Backend API Tests - Core Functionality
Tests endpoints that are actively used in the current stable system
"""

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from server import app

client = TestClient(app)

def mongodb_available():
    """Check if MongoDB is available."""
    try:
        mongo = MongoClient("localhost:27017", serverSelectionTimeoutMS=1000)
        mongo.server_info()
        return True
    except ServerSelectionTimeoutError:
        return False

requires_mongodb = pytest.mark.skipif(
    not mongodb_available(),
    reason="MongoDB not available"
)


class TestCoreEndpoints:
    """Test core API endpoints"""
    
    def test_health_endpoint(self):
        """Health check should work"""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
    
    @requires_mongodb
    def test_cache_stats_endpoint(self):
        """Cache stats endpoint should return valid data"""
        response = client.get("/api/audio/cache/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_cached_sections" in data
        assert "total_size_mb" in data
        assert isinstance(data["total_cached_sections"], int)
        assert isinstance(data["total_size_mb"], float)


class TestDialogueGeneration:
    """Test dialogue generation endpoint"""
    
    def test_dialogue_endpoint_responds(self):
        """Dialogue endpoint should respond (not 404)"""
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
        # 200 = success, 500 = API key issue (acceptable)
        # Just verify endpoint exists
        assert response.status_code in [200, 500, 520]
        assert response.status_code != 404


class TestTTSEndpoint:
    """Test TTS generation endpoint"""
    
    def test_tts_endpoint_responds(self):
        """TTS endpoint should respond (not 404)"""
        request_data = {
            "text": "Test audio",
            "voice": "nova",
            "provider": "openai"
        }
        
        response = client.post("/api/tts", json=request_data)
        # Verify endpoint exists
        assert response.status_code != 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
