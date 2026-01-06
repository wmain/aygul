"""
Test to verify dialogue_lines parameter is actually used
"""

import requests
import json

BACKEND_URL = "https://offlinepal-1.preview.emergentagent.com"

# Test with a unique combination that shouldn't be cached
request_body = {
    "section_type": "vocabulary",  # Different section type
    "language": "en",
    "location": "restaurant",  # Different location
    "speaker_a": "alex",  # Different speakers
    "speaker_b": "lisa",
    "dialogue_lines": [
        {"text": "The menu looks delicious!", "speakerId": 1},
        {"text": "Yes, I recommend the pasta.", "speakerId": 2},
        {"text": "Great, I'll try that!", "speakerId": 1}
    ]
}

print("Testing with unique cache key to verify dialogue_lines are used...")
print(f"Expected cache_key: en_vocabulary_restaurant_alex_lisa")
print()
print("Request:")
print(json.dumps(request_body, indent=2))
print()

response = requests.post(
    f"{BACKEND_URL}/api/audio/section/generate",
    json=request_body,
    timeout=60
)

print(f"Status: {response.status_code}")
print()
print("Response:")
data = response.json()
print(json.dumps(data, indent=2))
print()

# Check if the returned text matches what we sent
print("Verification:")
print(f"  is_cached: {data.get('is_cached')}")
print(f"  cache_key: {data.get('cache_key')}")
print()

if data.get('timestamps'):
    print("Returned dialogue text:")
    for i, ts in enumerate(data['timestamps'], 1):
        print(f"  {i}. [{ts.get('speaker_id')}] {ts.get('text')}")
    print()
    
    # Check if any of our input text appears in the output
    input_texts = [line['text'] for line in request_body['dialogue_lines']]
    output_texts = [ts['text'] for ts in data['timestamps']]
    
    matches = [inp for inp in input_texts if inp in output_texts]
    
    if matches:
        print(f"✅ Input dialogue found in output: {matches}")
    else:
        print("⚠️  Input dialogue NOT found in output")
        print("   This suggests dialogue_lines might be ignored or transformed")
