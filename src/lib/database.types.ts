/**
 * Database types for Supabase
 * Generated based on the schema defined in MIGRATION_PLAN.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          native_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          native_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          native_language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          language: string;
          location: string;
          title: string;
          description: string | null;
          difficulty: string;
          speaker1_name: string;
          speaker1_role: string;
          speaker2_name: string;
          speaker2_role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          language: string;
          location: string;
          title: string;
          description?: string | null;
          difficulty?: string;
          speaker1_name: string;
          speaker1_role: string;
          speaker2_name: string;
          speaker2_role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          language?: string;
          location?: string;
          title?: string;
          description?: string | null;
          difficulty?: string;
          speaker1_name?: string;
          speaker1_role?: string;
          speaker2_name?: string;
          speaker2_role?: string;
          created_at?: string;
        };
      };
      lesson_sections: {
        Row: {
          id: string;
          lesson_id: string;
          section_type: string;
          order_index: number;
          content: Json;
          audio_url: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          section_type: string;
          order_index: number;
          content: Json;
          audio_url?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          section_type?: string;
          order_index?: number;
          content?: Json;
          audio_url?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed_sections: string[];
          last_position_ms: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed_sections?: string[];
          last_position_ms?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed_sections?: string[];
          last_position_ms?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_cache: {
        Row: {
          id: string;
          cache_key: string;
          audio_url: string;
          metadata: Json | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cache_key: string;
          audio_url: string;
          metadata?: Json | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cache_key?: string;
          audio_url?: string;
          metadata?: Json | null;
          duration_ms?: number | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
