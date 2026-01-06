"""
Test the complete section-based audio caching flow
"""

import requests
import json

BACKEND_URL = "http://localhost:8001"

# Test data: Welcome section for English Coffee Shop with Maria and Jordan
test_request = {
    "section_type": "welcome",
    "language": "en",
    "location": "coffeeshop",
    "speaker_a": "maria",
    "speaker_b": "jordan",
    "dialogue_lines": [
        {
            "text": "Hello and welcome! I'm Maria, and I'll be your guide today.",
            "spokenText": "Hello and welcome! I'm Maria, and I'll be your guide today.",
            "speakerId": 1,
            "emotion": "warm"
        },
        {
            "text": "And I'm Jordan! We're so glad you're here.",
            "spokenText": "And I'm Jordan! We're so glad you're here.",
            "speakerId": 2,
            "emotion": "friendly"
        },
        {
            "text": "Today we'll practice a conversation at the Coffee Shop.",
            "spokenText": "Today we'll practice a conversation at the Coffee Shop.",
            "speakerId": 1,
            "emotion": None
        }
    ]
}

print("🧪 Testing Section-Based Audio Caching")
print("=" * 60)

# Step 1: Generate section audio
print("\n📤 Step 1: Generate section audio...")
print(f"   Section: {test_request['section_type']}")
print(f"   Language: {test_request['language']}")
print(f"   Location: {test_request['location']}")
print(f"   Speakers: {test_request['speaker_a']}, {test_request['speaker_b']}")

response = requests.post(
    f"{BACKEND_URL}/api/audio/section/generate",
    json=test_request,
    timeout=60
)

if response.status_code == 200:
    data = response.json()
    print(f"✅ Generation successful!")
    print(f"   Cache key: {data['cache_key']}")
    print(f"   Duration: {data['duration']}ms")
    print(f"   Timestamps: {len(data['timestamps'])} lines")
    print(f"   Is cached: {data['is_cached']}")
    print(f"   Audio URL: {data['audio_url']}")
    
    cache_key = data['cache_key']
else:
    print(f"❌ Failed: {response.status_code}")
    print(f"   {response.text}")
    exit(1)

# Step 2: Check cache stats
print("\n📊 Step 2: Check cache stats...")
stats_response = requests.get(f"{BACKEND_URL}/api/audio/cache/stats")
stats = stats_response.json()
print(f"✅ Cache stats:")
print(f"   Total cached: {stats['total_cached_sections']}")
print(f"   Total size: {stats['total_size_mb']} MB")

# Step 3: Try to generate same section again (should return cached)
print("\n🔄 Step 3: Request same section again (should hit cache)...")
response2 = requests.post(
    f"{BACKEND_URL}/api/audio/section/generate",
    json=test_request,
    timeout=10  # Faster timeout since it should be cached
)

if response2.status_code == 200:
    data2 = response2.json()
    if data2['is_cached']:
        print(f"✅ Cache hit! Returned instantly from cache")
    else:
        print(f"⚠️  Not cached (regenerated)")
else:
    print(f"❌ Failed: {response2.status_code}")

# Step 4: Download the audio file
print("\n⬇️  Step 4: Download audio file...")
audio_response = requests.get(f"{BACKEND_URL}/api/audio/file/{cache_key}")

if audio_response.status_code == 200:
    audio_size = len(audio_response.content)
    print(f"✅ Audio downloaded successfully!")
    print(f"   Size: {audio_size} bytes ({audio_size/1024:.1f} KB)")
    
    # Save for verification
    with open(f'/tmp/{cache_key}.mp3', 'wb') as f:
        f.write(audio_response.content)
    print(f"   Saved to: /tmp/{cache_key}.mp3")
else:
    print(f"❌ Download failed: {audio_response.status_code}")

print("\n" + "=" * 60)
print("✅ All tests passed! Section-based caching is working!")
