from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

class TTSRequest(BaseModel):
    text: str
    voice: str
    provider: str = "elevenlabs"

class DialogueRequest(BaseModel):
    config: dict

@app.post("/api/generate-dialogue")
async function generate_dialogue(request: DialogueRequest):
    """Proxy OpenAI dialogue generation to avoid CORS issues"""
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    url = "https://api.openai.com/v1/responses"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    # Build the prompt based on config
    config = request.config
    language = config.get("language", "en")
    location = config.get("location", "coffee_shop")
    situation = config.get("situation", "ordering")
    difficulty = config.get("difficulty", "intermediate")
    
    prompt = f"""Generate a language learning lesson dialogue for the following scenario:
Language: {language}
Location: {location}
Situation: {situation}
Difficulty: {difficulty}

Create a complete lesson with these sections:
1. WELCOME - Introduction (5 lines, alternating speakers)
2. VOCAB - Vocabulary with definitions (4 items)
3. SLOW - Slow dialogue (6 lines)
4. BREAKDOWN - Phrase explanations (3 items)
5. NATURAL - Natural speed dialogue (7 lines)
6. QUIZ - Quiz questions (4 Q&A pairs)
7. CULTURAL - Cultural notes (2 items)

Format each line as:
[SECTION_TYPE] Speaker1/Speaker2: text"""

    payload = {
        "model": "gpt-4o-mini",
        "input": prompt,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            # Extract the text from the response
            # OpenAI responses API structure: data.output[0].content[0].text
            text = ""
            if "output" in data and len(data["output"]) > 0:
                output = data["output"][0]
                if "content" in output and len(output["content"]) > 0:
                    content = output["content"][0]
                    if "text" in content:
                        text = content["text"]
            
            # Return in the format the frontend expects
            return {
                "output": [{
                    "content": [{
                        "text": text
                    }]
                }],
                "output_text": text  # Fallback format
            }
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"OpenAI API request failed: {str(e)}")

@app.post("/api/tts")
async def generate_audio(request: TTSRequest):
    """Proxy TTS requests to avoid CORS issues"""
    
    if request.provider == "elevenlabs":
        if not ELEVENLABS_API_KEY:
            raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice}?output_format=mp3_44100_128"
        headers = {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        payload = {
            "text": request.text,
            "model_id": "eleven_flash_v2_5",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
    else:  # OpenAI
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        payload = {
            "model": "tts-1",
            "input": request.text,
            "voice": request.voice,
            "response_format": "mp3"
        }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            # Return the audio data as base64
            import base64
            audio_data = response.content
            base64_audio = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                "audio": f"data:audio/mpeg;base64,{base64_audio}",
                "success": True
            }
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"API request failed: {str(e)}")

@app.get("/api/health")
async def health():
    return {"status": "healthy"}
