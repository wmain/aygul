/**
 * Supabase Client Configuration
 *
 * This is the central Supabase client used throughout the app.
 * All database queries, auth, and storage operations go through this client.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Supabase client with proper React Native configuration
 * - Uses AsyncStorage for session persistence on native
 * - Disables URL-based session detection (not applicable in RN)
 */
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Helper to get the Supabase Edge Function URL
 */
export function getEdgeFunctionUrl(functionName: string): string {
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

/**
 * Helper to call Supabase Edge Functions with proper auth headers
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = getEdgeFunctionUrl(functionName);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Edge function ${functionName} failed: ${error}`);
  }

  return response.json();
}

/**
 * Get a public URL for a file in Supabase Storage
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
