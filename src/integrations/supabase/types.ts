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
      available_slots: {
        Row: {
          count: number
          id: number
          updated_at: string
        }
        Insert: {
          count?: number
          id?: number
          updated_at?: string
        }
        Update: {
          count?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          pinned: boolean
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          pinned?: boolean
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          pinned?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      expert_pack_settings: {
        Row: {
          benefits: Json
          duration_days: number
          duration_label: string
          highlight: string | null
          id: number
          locked: boolean
          old_price: string | null
          price: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          benefits?: Json
          duration_days?: number
          duration_label?: string
          highlight?: string | null
          id?: number
          locked?: boolean
          old_price?: string | null
          price?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          benefits?: Json
          duration_days?: number
          duration_label?: string
          highlight?: string | null
          id?: number
          locked?: boolean
          old_price?: string | null
          price?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          access_expires_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          plan: Database["public"]["Enums"]["access_plan"]
          token: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          access_expires_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["access_plan"]
          token: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          access_expires_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["access_plan"]
          token?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      plan_settings: {
        Row: {
          benefits: Json
          duration_label: string
          highlight: string | null
          locked: boolean
          old_price: string | null
          plan: Database["public"]["Enums"]["access_plan"]
          price: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          benefits?: Json
          duration_label?: string
          highlight?: string | null
          locked?: boolean
          old_price?: string | null
          plan: Database["public"]["Enums"]["access_plan"]
          price?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          benefits?: Json
          duration_label?: string
          highlight?: string | null
          locked?: boolean
          old_price?: string | null
          plan?: Database["public"]["Enums"]["access_plan"]
          price?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_expires_at: string | null
          avatar_pending_url: string | null
          avatar_reviewed_at: string | null
          avatar_reviewed_by: string | null
          avatar_status: string
          avatar_url: string | null
          chat_unlocked: boolean
          created_at: string
          current_topic: string | null
          current_topic_unlocked: boolean
          days_30_renewals_count: number
          display_name: string | null
          email: string
          expert_unlocked_until: string | null
          highlights_unlocked_until: string | null
          id: string
          last_score: number
          plan: Database["public"]["Enums"]["access_plan"]
          reserve_code_hash: string | null
          secret_answer_hash: string | null
          secret_question: string | null
          show_in_ranking: boolean
          terms_accepted_at: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          access_expires_at?: string | null
          avatar_pending_url?: string | null
          avatar_reviewed_at?: string | null
          avatar_reviewed_by?: string | null
          avatar_status?: string
          avatar_url?: string | null
          chat_unlocked?: boolean
          created_at?: string
          current_topic?: string | null
          current_topic_unlocked?: boolean
          days_30_renewals_count?: number
          display_name?: string | null
          email: string
          expert_unlocked_until?: string | null
          highlights_unlocked_until?: string | null
          id: string
          last_score?: number
          plan?: Database["public"]["Enums"]["access_plan"]
          reserve_code_hash?: string | null
          secret_answer_hash?: string | null
          secret_question?: string | null
          show_in_ranking?: boolean
          terms_accepted_at?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          access_expires_at?: string | null
          avatar_pending_url?: string | null
          avatar_reviewed_at?: string | null
          avatar_reviewed_by?: string | null
          avatar_status?: string
          avatar_url?: string | null
          chat_unlocked?: boolean
          created_at?: string
          current_topic?: string | null
          current_topic_unlocked?: boolean
          days_30_renewals_count?: number
          display_name?: string | null
          email?: string
          expert_unlocked_until?: string | null
          highlights_unlocked_until?: string | null
          id?: string
          last_score?: number
          plan?: Database["public"]["Enums"]["access_plan"]
          reserve_code_hash?: string | null
          secret_answer_hash?: string | null
          secret_question?: string | null
          show_in_ranking?: boolean
          terms_accepted_at?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          counts_for_ranking: boolean
          created_at: string
          difficulty: Database["public"]["Enums"]["quiz_difficulty"]
          id: string
          questions: Json
          score: number
          time_spent_seconds: number
          topic: string
          total_points: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          counts_for_ranking?: boolean
          created_at?: string
          difficulty: Database["public"]["Enums"]["quiz_difficulty"]
          id?: string
          questions: Json
          score?: number
          time_spent_seconds?: number
          topic: string
          total_points?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          counts_for_ranking?: boolean
          created_at?: string
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"]
          id?: string
          questions?: Json
          score?: number
          time_spent_seconds?: number
          topic?: string
          total_points?: number
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          summary: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      study_unlock_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string
          created_at: string
          id: string
          previous_topic: string | null
          student_email: string
          student_id: string
        }
        Insert: {
          action?: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          id?: string
          previous_topic?: string | null
          student_email: string
          student_id: string
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          id?: string
          previous_topic?: string | null
          student_email?: string
          student_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approve_avatar: { Args: { _user_id: string }; Returns: undefined }
      admin_reject_avatar: { Args: { _user_id: string }; Returns: undefined }
      admin_renew_user: {
        Args: {
          _plan: Database["public"]["Enums"]["access_plan"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_unlock_expert: { Args: { _user_id: string }; Returns: undefined }
      admin_unlock_highlights: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_unlock_study: { Args: { _user_id: string }; Returns: undefined }
      get_leaderboard: {
        Args: never
        Returns: {
          attempts: number
          attempts_data: Json
          avatar_url: string
          avg_score: number
          composite_score: number
          created_at: string
          display_name: string
          hard_passed: number
          total_score: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      plan_duration: {
        Args: { _plan: Database["public"]["Enums"]["access_plan"] }
        Returns: string
      }
      purchase_expert_pack: {
        Args: { _days?: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      access_plan:
        | "free"
        | "days_30"
        | "days_60"
        | "days_90"
        | "premium"
        | "days_180"
      app_role: "admin" | "student"
      quiz_difficulty: "easy" | "hard" | "expert"
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
      access_plan: [
        "free",
        "days_30",
        "days_60",
        "days_90",
        "premium",
        "days_180",
      ],
      app_role: ["admin", "student"],
      quiz_difficulty: ["easy", "hard", "expert"],
    },
  },
} as const
