"""
Cache Key Generation Utilities
Generates consistent cache keys for section-based audio caching
"""


def generate_cache_key(
    language: str,
    section_type: str,
    location: str,
    speaker_a: str,
    speaker_b: str
) -> str:
    """
    Generate a unique cache key for a section+speaker combination
    
    Format: {language}_{sectionType}_{location}_{speakerA}_{speakerB}
    Example: en_welcome_coffeeshop_maria_jordan
    
    Args:
        language: Language code (en, es, fr)
        section_type: Section type (welcome, vocabulary, etc.)
        location: Location (coffee_shop, restaurant)
        speaker_a: First speaker name
        speaker_b: Second speaker name
        
    Returns:
        Cache key string
    """
    # Normalize inputs
    lang = language.lower().strip()
    section = section_type.lower().strip().replace('_', '')
    loc = location.lower().strip().replace('_', '')
    spk_a = speaker_a.lower().strip()
    spk_b = speaker_b.lower().strip()
    
    return f"{lang}_{section}_{loc}_{spk_a}_{spk_b}"


def get_audio_file_path(cache_key: str, language: str, location: str) -> str:
    """
    Get the file system path for a cached audio file
    
    Args:
        cache_key: The cache key
        language: Language code
        location: Location
        
    Returns:
        Relative path: /audio-cache/{language}/{location}/{cache_key}.mp3
    """
    lang = language.lower().strip()
    loc = location.lower().strip().replace('_', '')
    
    return f"/audio-cache/{lang}/{loc}/{cache_key}.mp3"


def parse_cache_key(cache_key: str) -> dict:
    """
    Parse a cache key back into its components
    
    Args:
        cache_key: Cache key string
        
    Returns:
        Dictionary with language, section_type, location, speaker_a, speaker_b
    """
    parts = cache_key.split('_')
    
    if len(parts) < 5:
        raise ValueError(f"Invalid cache key format: {cache_key}")
    
    return {
        'language': parts[0],
        'section_type': parts[1],
        'location': parts[2],
        'speaker_a': parts[3],
        'speaker_b': parts[4]
    }
