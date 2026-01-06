/**
 * Section-Based Audio Service
 * Handles 3-tier caching for section audio:
 * 1. Device cache (expo-file-system for native, IndexedDB for web)
 * 2. Server cache (backend API + MongoDB)
 * 3. API generation (ElevenLabs)
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import type { DialogueLine, LessonSegmentType } from './types';

const CACHE_DIR = `${FileSystem.documentDirectory}audio-cache/`;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Web-specific caching using Cache API
const WEB_CACHE_NAME = 'audio-section-cache-v1';

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
 * Uses expo-file-system on native, Cache API on web
 */
export async function getDeviceCachedAudio(cacheKey: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Web: Check Cache API but return null to always use HTTP URLs
      // (expo-audio doesn't support blob URLs on web)
      // The browser will automatically use cached version when fetching HTTP URLs
      const cache = await caches.open(WEB_CACHE_NAME);
      const cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        console.log(`[Device Cache] Web hit: ${cacheKey} (will use HTTP URL with browser cache)`);
      } else {
        console.log(`[Device Cache] Web miss: ${cacheKey}`);
      }
      
      // Always return null on web to use HTTP URLs
      return null;
    } else {
      // Native: Use expo-file-system
      const filePath = `${CACHE_DIR}${cacheKey}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        console.log(`[Device Cache] Native hit: ${cacheKey}`);
        return filePath;
      }
      
      console.log(`[Device Cache] Native miss: ${cacheKey}`);
      return null;
    }
  } catch (error) {
    console.error('[Device Cache] Error:', error);
    return null;
  }
}

/**
 * Download and cache audio file to device
 * Uses expo-file-system on native, Cache API on web
 */
export async function cacheAudioToDevice(cacheKey: string, audioUrl: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      // Web: Use Cache API for offline support, but return original URL for playback
      // expo-audio doesn't support blob URLs on web, so we use HTTP URLs directly
      console.log(`[Device Cache] Web caching: ${cacheKey}`);
      
      const response = await fetch(audioUrl);
      const cache = await caches.open(WEB_CACHE_NAME);
      await cache.put(cacheKey, response.clone());
      
      console.log(`[Device Cache] Web cached: ${cacheKey}`);
      
      // Return the original HTTP URL (browser will use cached version automatically)
      return audioUrl;
    } else {
      // Native: Use expo-file-system
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      
      const filePath = `${CACHE_DIR}${cacheKey}.mp3`;
      
      console.log(`[Device Cache] Native downloading: ${cacheKey}`);
      
      const downloadResult = await FileSystem.downloadAsync(audioUrl, filePath);
      
      if (downloadResult.status === 200) {
        console.log(`[Device Cache] Native cached: ${cacheKey}`);
        return filePath;
      }
      
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
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
      speakerA: speakerA.toLowerCase(),
      speakerB: speakerB.toLowerCase(),
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
      body: JSON.stringify({
        section_type: requestData.sectionType,
        language: requestData.language,
        location: requestData.location,
        speaker_a: requestData.speakerA,  // Convert to snake_case for backend
        speaker_b: requestData.speakerB,  // Convert to snake_case for backend
        dialogue_lines: requestData.dialogueLines
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const rawData: any = await response.json();
    
    // Map snake_case backend response to camelCase
    const data: SectionAudioResponse = {
      cacheKey: rawData.cache_key,
      audioUrl: rawData.audio_url,
      timestamps: rawData.timestamps,
      duration: rawData.duration,
      isCached: rawData.is_cached
    };
    
    console.log('[Section Audio] Response mapped:', { audioUrl: data.audioUrl, isCached: data.isCached });
    
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
    if (Platform.OS === 'web') {
      // Web: Clear Cache API
      await caches.delete(WEB_CACHE_NAME);
      console.log('[Device Cache] Web cleared');
    } else {
      // Native: Delete file directory
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
        console.log('[Device Cache] Native cleared');
      }
    }
  } catch (error) {
    console.error('[Device Cache] Clear error:', error);
  }
}
