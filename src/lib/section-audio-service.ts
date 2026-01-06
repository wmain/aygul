/**
 * Section-Based Audio Service
 * Handles 3-tier caching for section audio:
 * 1. Device cache (expo-file-system)
 * 2. Server cache (backend API + MongoDB)
 * 3. API generation (ElevenLabs)
 */

import * as FileSystem from 'expo-file-system';
import type { DialogueLine, LessonSegmentType } from './types';

const CACHE_DIR = `${FileSystem.documentDirectory}audio-cache/`;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface SectionAudioResponse {
  cacheKey: string;
  audioUrl: string;
  timestamps: Array<{
    text: string;
    speaker_id: number;
    start: number;
    end: number;
    emotion?: string;
  }>;
  duration: number;
  isCached: boolean;
}

interface GenerateSectionRequest {
  sectionType: string;
  language: string;
  location: string;
  speakerA: string;
  speakerB: string;
  dialogueLines: Array<{
    text: string;
    spokenText?: string;
    speakerId: number;
    emotion?: string;
  }>;
}

/**
 * Generate cache key for a section
 */
export function generateSectionCacheKey(
  language: string,
  sectionType: string,
  location: string,
  speakerA: string,
  speakerB: string
): string {
  const lang = language.toLowerCase().trim();
  const section = sectionType.toLowerCase().trim().replace(/_/g, '');
  const loc = location.toLowerCase().trim().replace(/_/g, '');
  const spkA = speakerA.toLowerCase().trim();
  const spkB = speakerB.toLowerCase().trim();
  
  return `${lang}_${section}_${loc}_${spkA}_${spkB}`;
}

/**
 * Check if section audio exists in device cache
 */
export async function getDeviceCachedAudio(cacheKey: string): Promise<string | null> {
  try {
    const filePath = `${CACHE_DIR}${cacheKey}.mp3`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      console.log(`[Device Cache] Hit: ${cacheKey}`);
      return filePath;
    }
    
    console.log(`[Device Cache] Miss: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('[Device Cache] Error:', error);
    return null;
  }
}

/**
 * Download and cache audio file to device
 */
export async function cacheAudioToDevice(cacheKey: string, audioUrl: string): Promise<string> {
  try {
    // Ensure cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    
    const filePath = `${CACHE_DIR}${cacheKey}.mp3`;
    
    console.log(`[Device Cache] Downloading: ${cacheKey}`);
    
    // Download file
    const downloadResult = await FileSystem.downloadAsync(audioUrl, filePath);
    
    if (downloadResult.status === 200) {
      console.log(`[Device Cache] Cached: ${cacheKey}`);
      return filePath;
    }
    
    throw new Error(`Download failed with status ${downloadResult.status}`);
  } catch (error) {
    console.error('[Device Cache] Download error:', error);
    throw error;
  }
}

/**
 * Get section audio through 3-tier caching system
 * 
 * @returns Audio URI (local file path or remote URL)
 */
export async function getSectionAudio(
  language: string,
  sectionType: string,
  location: string,
  speakerA: string,
  speakerB: string,
  dialogueLines: DialogueLine[],
  onProgress?: (progress: number, status: string) => void
): Promise<SectionAudioResponse> {
  const cacheKey = generateSectionCacheKey(language, sectionType, location, speakerA, speakerB);
  
  onProgress?.(0.1, 'Checking cache...');
  
  // Tier 1: Check device cache
  const deviceCached = await getDeviceCachedAudio(cacheKey);
  if (deviceCached) {
    onProgress?.(1, 'Loaded from device');
    return {
      cacheKey,
      audioUrl: deviceCached,
      timestamps: [], // Will be populated from stored metadata if needed
      duration: 0,
      isCached: true
    };
  }
  
  onProgress?.(0.3, 'Checking server...');
  
  // Tier 2 & 3: Check server cache or generate
  try {
    const requestData: GenerateSectionRequest = {
      sectionType,
      language,
      location,
      speakerA,
      speakerB,
      dialogueLines: dialogueLines.map(line => ({
        text: line.text,
        spokenText: line.spokenText,
        speakerId: line.speakerId,
        emotion: line.emotion
      }))
    };
    
    const response = await fetch(`${BACKEND_URL}/api/audio/section/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data: SectionAudioResponse = await response.json();
    
    if (data.isCached) {
      onProgress?.(0.7, 'Found on server');
    } else {
      onProgress?.(0.7, 'Generated new audio');
    }
    
    // Download and cache to device
    onProgress?.(0.8, 'Caching to device...');
    const localPath = await cacheAudioToDevice(cacheKey, data.audioUrl);
    
    onProgress?.(1, 'Ready to play');
    
    return {
      ...data,
      audioUrl: localPath // Use local path for playback
    };
    
  } catch (error) {
    console.error('[Section Audio] Error:', error);
    throw error;
  }
}

/**
 * Get all sections for a lesson configuration
 * Groups dialogue lines by section type
 */
export function groupLinesBySection(lines: DialogueLine[]): Map<string, DialogueLine[]> {
  const sectionMap = new Map<string, DialogueLine[]>();
  
  lines.forEach(line => {
    const sectionType = line.segmentType || 'NATURAL';
    
    if (!sectionMap.has(sectionType)) {
      sectionMap.set(sectionType, []);
    }
    
    sectionMap.get(sectionType)!.push(line);
  });
  
  return sectionMap;
}

/**
 * Clear device cache (for testing/debugging)
 */
export async function clearDeviceCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      console.log('[Device Cache] Cleared');
    }
  } catch (error) {
    console.error('[Device Cache] Clear error:', error);
  }
}
