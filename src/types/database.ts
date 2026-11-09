// Gerado pelo Supabase (generate_typescript_types). NÃO editar à mão: regenere após cada migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_usage: {
        Row: {
          day: string
          seconds: number
          user_id: string
        }
        Insert: {
          day?: string
          seconds?: number
          user_id?: string
        }
        Update: {
          day?: string
          seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_documents: {
        Row: {
          created_at: string
          file_name: string
          health_record_id: string
          id: string
          mime_type: string
          pet_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          health_record_id: string
          id?: string
          mime_type: string
          pet_id: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          health_record_id?: string
          id?: string
          mime_type?: string
          pet_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_documents_health_record_id_fkey"
            columns: ["health_record_id"]
            isOneToOne: false
            referencedRelation: "health_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          application_form: string | null
          created_at: string
          created_by: string | null
          crmv: string | null
          id: string
          lot: string | null
          next_cancelled_at: string | null
          next_done_at: string | null
          next_due_on: string | null
          notes: string | null
          occurred_on: string
          pet_id: string
          title: string
          type: Database["public"]["Enums"]["health_type"]
          updated_at: string
          updated_by: string | null
          vet_name: string | null
        }
        Insert: {
          application_form?: string | null
          created_at?: string
          created_by?: string | null
          crmv?: string | null
          id?: string
          lot?: string | null
          next_cancelled_at?: string | null
          next_done_at?: string | null
          next_due_on?: string | null
          notes?: string | null
          occurred_on: string
          pet_id: string
          title: string
          type: Database["public"]["Enums"]["health_type"]
          updated_at?: string
          updated_by?: string | null
          vet_name?: string | null
        }
        Update: {
          application_form?: string | null
          created_at?: string
          created_by?: string | null
          crmv?: string | null
          id?: string
          lot?: string | null
          next_cancelled_at?: string | null
          next_done_at?: string | null
          next_due_on?: string | null
          notes?: string | null
          occurred_on?: string
          pet_id?: string
          title?: string
          type?: Database["public"]["Enums"]["health_type"]
          updated_at?: string
          updated_by?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_members: {
        Row: {
          created_at: string
          invited_by: string | null
          permission: Database["public"]["Enums"]["member_permission"]
          pet_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          permission?: Database["public"]["Enums"]["member_permission"]
          pet_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          permission?: Database["public"]["Enums"]["member_permission"]
          pet_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_members_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_weights: {
        Row: {
          created_at: string
          id: string
          measured_on: string
          pet_id: string
          recorded_by: string | null
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_on?: string
          pet_id: string
          recorded_by?: string | null
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_on?: string
          pet_id?: string
          recorded_by?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_weights_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_weights_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          allergies: string | null
          archived_at: string | null
          birth_date: string | null
          breed: string | null
          chip_site: string | null
          chronic_conditions: string | null
          coat: string | null
          created_at: string
          created_by: string
          id: string
          microchip: string | null
          name: string
          notes: string | null
          photo_path: string | null
          sex: Database["public"]["Enums"]["pet_sex"]
          species: Database["public"]["Enums"]["species"]
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          archived_at?: string | null
          birth_date?: string | null
          breed?: string | null
          chip_site?: string | null
          chronic_conditions?: string | null
          coat?: string | null
          created_at?: string
          created_by?: string
          id?: string
          microchip?: string | null
          name: string
          notes?: string | null
          photo_path?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          species: Database["public"]["Enums"]["species"]
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          archived_at?: string | null
          birth_date?: string | null
          breed?: string | null
          chip_site?: string | null
          chronic_conditions?: string | null
          coat?: string | null
          created_at?: string
          created_by?: string
          id?: string
          microchip?: string | null
          name?: string
          notes?: string | null
          photo_path?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          species?: Database["public"]["Enums"]["species"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          notification_sound: string
          opening_voice: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name: string
          id: string
          notification_sound?: string
          opening_voice?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          notification_sound?: string
          opening_voice?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_at: string
          document: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: string
          id?: string
          user_id?: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_stats: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      track_usage: { Args: { p_seconds: number }; Returns: undefined }
    }
    Enums: {
      health_type:
        | "vaccine"
        | "dewormer"
        | "flea_tick"
        | "medication"
        | "vet_visit"
        | "exam"
      member_permission: "edit" | "view"
      member_role: "tutor" | "guest"
      pet_sex: "male" | "female" | "unknown"
      species: "dog" | "cat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      health_type: ["vaccine", "dewormer", "flea_tick", "medication", "vet_visit", "exam"],
      member_permission: ["edit", "view"],
      member_role: ["tutor", "guest"],
      pet_sex: ["male", "female", "unknown"],
      species: ["dog", "cat"],
    },
  },
} as const
