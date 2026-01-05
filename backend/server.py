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
async def generate_dialogue(request: DialogueRequest):
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
    
    prompt = f"""Generate a language learning lesson dialogue in PIPE-DELIMITED format.

Language: {language}
Location: {location}
Situation: {situation}
Difficulty: {difficulty}

Format each line EXACTLY as: SpeakerID|SegmentType|[emotion]|dialogue text

- SpeakerID: Use "1" for first speaker, "2" for second speaker
- SegmentType: WELCOME, VOCAB, SLOW, BREAKDOWN, NATURAL, QUIZ, CULTURAL
- emotion: neutral, happy, curious, friendly, polite
- Alternate speakers naturally in dialogue sections

Generate a complete lesson with these sections (total ~30-35 lines):

1. WELCOME (5 lines) - Introduction
   Example: 1|WELCOME|[friendly]|Hello and welcome to our coffee shop lesson!
   
2. VOCAB (4-6 lines) - Vocabulary with definitions
   Example: 1|VOCAB|[neutral]|Coffee - a hot beverage made from roasted beans
   
3. SLOW (6-8 lines) - Slow-paced dialogue between speakers
   Example: 2|SLOW|[polite]|Hello, how can I help you today?
   Example: 1|SLOW|[friendly]|Hi, I would like to order a coffee please
   
4. BREAKDOWN (3-4 lines) - Phrase explanations
   Example: 1|BREAKDOWN|[neutral]|"I would like" is a polite way to make requests
   
5. NATURAL (7-10 lines) - Natural speed dialogue
   Example: 2|NATURAL|[happy]|Hi there! What can I get for you?
   Example: 1|NATURAL|[friendly]|Hey! I'll have a large coffee please
   
6. QUIZ (4-6 lines) - Questions and answers
   Example: 1|QUIZ|[curious]|What does 'order' mean in this context?
   Example: 1|QUIZ|[neutral]|To request food or drink
   
7. CULTURAL (2-3 lines) - Cultural notes
   Example: 1|CULTURAL|[neutral]|In many countries, tipping at coffee shops is customary

IMPORTANT: Output ONLY the pipe-delimited lines, no headers, no extra text."""

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
