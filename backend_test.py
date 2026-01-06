"""
Backend Test Suite for Section-Based Audio Caching System
Tests all audio cache endpoints and functionality
"""

import requests
import json
import time
import os
from typing import Dict, Any

# Backend URL from environment
BACKEND_URL = "https://offlinepal-1.preview.emergentagent.com"
BASE_URL = f"{BACKEND_URL}/api/audio"

# Test data
TEST_DIALOGUE_LINES = [
    {"text": "Hello!", "speakerId": 1},
    {"text": "Hi there!", "speakerId": 2}
]

TEST_REQUEST_1 = {
    "section_type": "welcome",
    "language": "en",
    "location": "coffeeshop",
    "speaker_a": "maria",
    "speaker_b": "jordan",
    "dialogue_lines": TEST_DIALOGUE_LINES
}

TEST_REQUEST_2 = {
    "section_type": "welcome",
    "language": "en",
    "location": "coffeeshop",
    "speaker_a": "sarah",
    "speaker_b": "james",
    "dialogue_lines": TEST_DIALOGUE_LINES
}


class TestResults:
    """Track test results"""
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append(f"✅ {test_name}: {details}")
    
    def add_fail(self, test_name: str, error: str):
        self.failed.append(f"❌ {test_name}: {error}")
    
    def add_warning(self, test_name: str, warning: str):
        self.warnings.append(f"⚠️  {test_name}: {warning}")
    
    def print_summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        if self.passed:
            print("\n✅ PASSED TESTS:")
            for p in self.passed:
                print(f"  {p}")
        
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for w in self.warnings:
                print(f"  {w}")
        
        if self.failed:
            print("\n❌ FAILED TESTS:")
            for f in self.failed:
                print(f"  {f}")
        
        print("\n" + "="*80)
        print(f"Total: {len(self.passed)} passed, {len(self.failed)} failed, {len(self.warnings)} warnings")
        print("="*80 + "\n")


results = TestResults()


def test_cache_stats():
    """Test 1: GET /api/audio/cache/stats"""
    print("\n[TEST 1] Testing cache stats endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/cache/stats", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Status: {response.status_code}")
            print(f"  Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            required_fields = ['total_cached_sections', 'total_size_bytes', 'total_size_mb', 'by_language']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                results.add_fail("Cache Stats", f"Missing fields: {missing_fields}")
            else:
                results.add_pass("Cache Stats", f"Returned {data['total_cached_sections']} cached sections")
            
            return data
        else:
            results.add_fail("Cache Stats", f"HTTP {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        results.add_fail("Cache Stats", f"Exception: {str(e)}")
        return None


def test_section_generation(request_data: Dict[str, Any], test_name: str):
    """Test section generation endpoint"""
    print(f"\n[TEST] Testing section generation: {test_name}...")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/section/generate",
            json=request_data,
            timeout=60
        )
        elapsed_time = time.time() - start_time
        
        print(f"  Status: {response.status_code}")
        print(f"  Time: {elapsed_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            required_fields = ['cache_key', 'audio_url', 'timestamps', 'duration', 'is_cached']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                results.add_fail(test_name, f"Missing fields: {missing_fields}")
                return None
            
            # Validate cache_key format
            cache_key = data['cache_key']
            expected_key = f"{request_data['language']}_{request_data['section_type']}_{request_data['location']}_{request_data['speaker_a']}_{request_data['speaker_b']}"
            
            if cache_key != expected_key:
                results.add_warning(test_name, f"Cache key mismatch: got {cache_key}, expected {expected_key}")
            
            # Validate timestamps
            if not isinstance(data['timestamps'], list) or len(data['timestamps']) == 0:
                results.add_fail(test_name, "Timestamps missing or empty")
                return None
            
            # Validate duration
            if data['duration'] <= 0:
                results.add_fail(test_name, f"Invalid duration: {data['duration']}")
                return None
            
            results.add_pass(
                test_name,
                f"Generated audio (cached={data['is_cached']}, duration={data['duration']}ms, time={elapsed_time:.2f}s)"
            )
            
            return data
            
        else:
            results.add_fail(test_name, f"HTTP {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        results.add_fail(test_name, f"Exception: {str(e)}")
        return None


def test_audio_file_download(cache_key: str, test_name: str):
    """Test audio file download endpoint"""
    print(f"\n[TEST] Testing audio file download: {test_name}...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/file/{cache_key}",
            timeout=30
        )
        
        print(f"  Status: {response.status_code}")
        print(f"  Content-Type: {response.headers.get('Content-Type')}")
        print(f"  Content-Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Validate it's an audio file
            content_type = response.headers.get('Content-Type', '')
            
            if 'audio' not in content_type:
                results.add_fail(test_name, f"Invalid content type: {content_type}")
                return False
            
            # Check file size
            if len(response.content) < 1000:
                results.add_fail(test_name, f"Audio file too small: {len(response.content)} bytes")
                return False
            
            # Validate MP3 header (starts with ID3 or 0xFF 0xFB)
            if not (response.content[:3] == b'ID3' or 
                   (response.content[0] == 0xFF and (response.content[1] & 0xE0) == 0xE0)):
                results.add_warning(test_name, "File doesn't have valid MP3 header")
            
            results.add_pass(test_name, f"Downloaded {len(response.content)} bytes")
            return True
            
        else:
            results.add_fail(test_name, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        results.add_fail(test_name, f"Exception: {str(e)}")
        return False


def test_cache_hit():
    """Test cache hit behavior (same request twice)"""
    print("\n[TEST] Testing cache hit behavior...")
    
    # First request - should generate
    print("  Making first request (should generate)...")
    first_response = test_section_generation(TEST_REQUEST_1, "First Generation")
    
    if not first_response:
        results.add_fail("Cache Hit Test", "First request failed")
        return
    
    if first_response['is_cached']:
        results.add_warning("Cache Hit Test", "First request returned cached=true (expected false)")
    
    # Second request - should be cached
    print("  Making second request (should be cached)...")
    time.sleep(1)  # Small delay
    
    start_time = time.time()
    second_response = test_section_generation(TEST_REQUEST_1, "Cache Hit")
    elapsed_time = time.time() - start_time
    
    if not second_response:
        results.add_fail("Cache Hit Test", "Second request failed")
        return
    
    if not second_response['is_cached']:
        results.add_fail("Cache Hit Test", "Second request not cached (expected cached=true)")
        return
    
    # Cache hit should be faster
    if elapsed_time > 5:
        results.add_warning("Cache Hit Test", f"Cache hit took {elapsed_time:.2f}s (expected < 5s)")
    
    # Verify same cache_key
    if first_response['cache_key'] != second_response['cache_key']:
        results.add_fail("Cache Hit Test", "Cache keys don't match")
        return
    
    results.add_pass("Cache Hit Test", f"Cache working correctly (hit in {elapsed_time:.2f}s)")


def test_different_speakers():
    """Test with different speakers (should create new cache entry)"""
    print("\n[TEST] Testing different speakers...")
    
    response = test_section_generation(TEST_REQUEST_2, "Different Speakers")
    
    if not response:
        results.add_fail("Different Speakers Test", "Request failed")
        return
    
    # Should have different cache_key
    expected_key = "en_welcome_coffeeshop_sarah_james"
    if response['cache_key'] != expected_key:
        results.add_fail("Different Speakers Test", f"Unexpected cache key: {response['cache_key']}")
        return
    
    results.add_pass("Different Speakers Test", f"New cache entry created: {response['cache_key']}")


def run_all_tests():
    """Run all tests in sequence"""
    print("="*80)
    print("SECTION-BASED AUDIO CACHING SYSTEM - BACKEND TESTS")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing endpoint: {BASE_URL}")
    
    # Test 1: Cache stats
    initial_stats = test_cache_stats()
    
    # Test 2: First generation
    first_gen = test_section_generation(TEST_REQUEST_1, "Initial Generation (maria/jordan)")
    
    # Test 3: Audio file download
    if first_gen and 'cache_key' in first_gen:
        test_audio_file_download(first_gen['cache_key'], "Audio File Download")
    
    # Test 4: Cache hit
    test_cache_hit()
    
    # Test 5: Different speakers
    test_different_speakers()
    
    # Test 6: Final cache stats
    final_stats = test_cache_stats()
    
    # Compare stats
    if initial_stats and final_stats:
        initial_count = initial_stats.get('total_cached_sections', 0)
        final_count = final_stats.get('total_cached_sections', 0)
        
        if final_count > initial_count:
            results.add_pass("Cache Growth", f"Cache grew from {initial_count} to {final_count} entries")
        elif final_count == initial_count:
            results.add_warning("Cache Growth", "Cache size didn't increase (entries may have existed)")
    
    # Print summary
    results.print_summary()
    
    # Return exit code
    return 0 if len(results.failed) == 0 else 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    exit(exit_code)
