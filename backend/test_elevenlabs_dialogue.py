"""
Test script to verify ElevenLabs text-to-dialogue API access
"""

import os
import sys
from elevenlabs import ElevenLabs

async def test_dialogue_api():
    api_key = os.environ.get('ELEVENLABS_API_KEY')
    if not api_key:
        print("❌ ELEVENLABS_API_KEY not set")
        sys.exit(1)
    
    print("✅ API Key found")
    print(f"   Key prefix: {api_key[:10]}...")
    
    client = ElevenLabs(api_key=api_key)
    print("✅ Client initialized")
    
    # Check if text_to_dialogue is available
    if hasattr(client, 'text_to_dialogue'):
        print("✅ text_to_dialogue endpoint available")
        
        # Try a simple test
        try:
            print("\n🧪 Testing with simple 2-line dialogue...")
            
            test_inputs = [
                {
                    "text": "Hello, welcome to our test!",
                    "voice_id": "EXAVITQu4vr4xnSDxMaL"  # Bella
                },
                {
                    "text": "Hi there, this is working!",
                    "voice_id": "onwK4e9ZLuTAKqWW03F9"  # Daniel
                }
            ]
            
            response = client.text_to_dialogue.convert(
                inputs=test_inputs,
                model_id="eleven_v3"
            )
            
            # Collect audio bytes
            audio_data = b""
            for chunk in response:
                audio_data += chunk
            
            print(f"✅ API call successful!")
            print(f"   Audio size: {len(audio_data)} bytes ({len(audio_data)/1024:.1f} KB)")
            
            # Save test file
            with open('/tmp/test_dialogue.mp3', 'wb') as f:
                f.write(audio_data)
            print(f"   Saved to: /tmp/test_dialogue.mp3")
            
            return True
            
        except Exception as e:
            print(f"❌ API call failed: {e}")
            print(f"   Error type: {type(e).__name__}")
            return False
    else:
        print("❌ text_to_dialogue not found")
        print(f"   Available methods: {[x for x in dir(client) if not x.startswith('_')]}")
        return False

if __name__ == "__main__":
    import asyncio
    result = asyncio.run(test_dialogue_api())
    sys.exit(0 if result else 1)
