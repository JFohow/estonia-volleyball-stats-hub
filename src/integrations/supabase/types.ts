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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appearances: {
        Row: {
          appearance_id: number
          captain: boolean
          match_id: number
          on_the_bench: boolean
          player_id: number
          player_position_in_match: string | null
          sets_played: number
          sets_started: number
          shirt_number: number | null
        }
        Insert: {
          appearance_id?: number
          captain?: boolean
          match_id: number
          on_the_bench?: boolean
          player_id: number
          player_position_in_match?: string | null
          sets_played?: number
          sets_started?: number
          shirt_number?: number | null
        }
        Update: {
          appearance_id?: number
          captain?: boolean
          match_id?: number
          on_the_bench?: boolean
          player_id?: number
          player_position_in_match?: string | null
          sets_played?: number
          sets_started?: number
          shirt_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appearances_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "appearances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["player_id"]
          },
        ]
      }
      match_sets: {
        Row: {
          estonia_points: number
          match_id: number
          match_set_id: number
          opponent_points: number
          set_number: number
        }
        Insert: {
          estonia_points: number
          match_id: number
          match_set_id?: number
          opponent_points: number
          set_number: number
        }
        Update: {
          estonia_points?: number
          match_id?: number
          match_set_id?: number
          opponent_points?: number
          set_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_sets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      matches: {
        Row: {
          additional_sets_count: number
          city: string | null
          coach: string | null
          competition: string | null
          created_at: string
          estonia_sets: number
          has_additional_sets: boolean
          match_date: string
          match_id: number
          match_type: Database["public"]["Enums"]["match_type"]
          opponent: string
          opponent_sets: number
        }
        Insert: {
          additional_sets_count?: number
          city?: string | null
          coach?: string | null
          competition?: string | null
          created_at?: string
          estonia_sets?: number
          has_additional_sets?: boolean
          match_date: string
          match_id?: number
          match_type: Database["public"]["Enums"]["match_type"]
          opponent: string
          opponent_sets?: number
        }
        Update: {
          additional_sets_count?: number
          city?: string | null
          coach?: string | null
          competition?: string | null
          created_at?: string
          estonia_sets?: number
          has_additional_sets?: boolean
          match_date?: string
          match_id?: number
          match_type?: Database["public"]["Enums"]["match_type"]
          opponent?: string
          opponent_sets?: number
        }
        Relationships: []
      }
      player_match_stats: {
        Row: {
          appearance_id: number
          attack_blocked: number | null
          attack_efficiency: number | null
          attack_errors: number | null
          attack_kill_pct: number | null
          attack_kills: number | null
          attack_total: number | null
          block_points: number | null
          break_points: number | null
          plus_minus: number | null
          points: number | null
          reception_errors: number | null
          reception_excellent_pct: number | null
          reception_positive_pct: number | null
          reception_total: number | null
          serve_aces: number | null
          serve_errors: number | null
          serve_total: number | null
          stat_id: number
          stats_version: Database["public"]["Enums"]["stats_version"]
        }
        Insert: {
          appearance_id: number
          attack_blocked?: number | null
          attack_efficiency?: number | null
          attack_errors?: number | null
          attack_kill_pct?: number | null
          attack_kills?: number | null
          attack_total?: number | null
          block_points?: number | null
          break_points?: number | null
          plus_minus?: number | null
          points?: number | null
          reception_errors?: number | null
          reception_excellent_pct?: number | null
          reception_positive_pct?: number | null
          reception_total?: number | null
          serve_aces?: number | null
          serve_errors?: number | null
          serve_total?: number | null
          stat_id?: number
          stats_version?: Database["public"]["Enums"]["stats_version"]
        }
        Update: {
          appearance_id?: number
          attack_blocked?: number | null
          attack_efficiency?: number | null
          attack_errors?: number | null
          attack_kill_pct?: number | null
          attack_kills?: number | null
          attack_total?: number | null
          block_points?: number | null
          break_points?: number | null
          plus_minus?: number | null
          points?: number | null
          reception_errors?: number | null
          reception_excellent_pct?: number | null
          reception_positive_pct?: number | null
          reception_total?: number | null
          serve_aces?: number | null
          serve_errors?: number | null
          serve_total?: number | null
          stat_id?: number
          stats_version?: Database["public"]["Enums"]["stats_version"]
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_appearance_id_fkey"
            columns: ["appearance_id"]
            isOneToOne: false
            referencedRelation: "appearances"
            referencedColumns: ["appearance_id"]
          },
        ]
      }
      players: {
        Row: {
          birth_county: string | null
          birth_date: string | null
          created_at: string
          first_name: string
          handedness: string | null
          height_cm: number | null
          last_name: string
          place_of_birth: string | null
          player_id: number
          position: string | null
        }
        Insert: {
          birth_county?: string | null
          birth_date?: string | null
          created_at?: string
          first_name: string
          handedness?: string | null
          height_cm?: number | null
          last_name: string
          place_of_birth?: string | null
          player_id?: number
          position?: string | null
        }
        Update: {
          birth_county?: string | null
          birth_date?: string | null
          created_at?: string
          first_name?: string
          handedness?: string | null
          height_cm?: number | null
          last_name?: string
          place_of_birth?: string | null
          player_id?: number
          position?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      match_type: "VM" | "AM" | "MAM"
      stats_version: "ALL" | "AM"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      match_type: ["VM", "AM", "MAM"],
      stats_version: ["ALL", "AM"],
    },
  },
} as const
