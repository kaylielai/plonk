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
      availability_responses: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          participant_id: string
          slots: Json
          submitted_via: Database["public"]["Enums"]["response_source"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          participant_id: string
          slots?: Json
          submitted_via?: Database["public"]["Enums"]["response_source"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          participant_id?: string
          slots?: Json
          submitted_via?: Database["public"]["Enums"]["response_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_responses_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "idea_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          pinned: boolean
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          pinned?: boolean
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          pinned?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_color: string
          created_at: string
          created_by: string
          id: string
          invite_token: string
          name: string
        }
        Insert: {
          cover_color?: string
          created_at?: string
          created_by: string
          id?: string
          invite_token?: string
          name: string
        }
        Update: {
          cover_color?: string
          created_at?: string
          created_by?: string
          id?: string
          invite_token?: string
          name?: string
        }
        Relationships: []
      }
      hangouts: {
        Row: {
          confirmed_by: string
          confirmed_time: string
          created_at: string
          id: string
          idea_id: string
        }
        Insert: {
          confirmed_by: string
          confirmed_time: string
          created_at?: string
          id?: string
          idea_id: string
        }
        Update: {
          confirmed_by?: string
          confirmed_time?: string
          created_at?: string
          id?: string
          idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hangouts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_participants: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          lite_display_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          lite_display_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          lite_display_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_participants_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          confirmed_by: string | null
          confirmed_time: string | null
          created_at: string
          created_by: string
          group_id: string | null
          id: string
          recipient_user_id: string | null
          status: Database["public"]["Enums"]["idea_status"]
          suggested_day: string | null
          suggested_time: string | null
          tag: string
          timeframe_label: string
          title: string
          updated_at: string
        }
        Insert: {
          confirmed_by?: string | null
          confirmed_time?: string | null
          created_at?: string
          created_by: string
          group_id?: string | null
          id?: string
          recipient_user_id?: string | null
          status?: Database["public"]["Enums"]["idea_status"]
          suggested_day?: string | null
          suggested_time?: string | null
          tag: string
          timeframe_label: string
          title: string
          updated_at?: string
        }
        Update: {
          confirmed_by?: string | null
          confirmed_time?: string | null
          created_at?: string
          created_by?: string
          group_id?: string | null
          id?: string
          recipient_user_id?: string | null
          status?: Database["public"]["Enums"]["idea_status"]
          suggested_day?: string | null
          suggested_time?: string | null
          tag?: string
          timeframe_label?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      lite_tokens: {
        Row: {
          created_at: string
          expires_at: string
          idea_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          idea_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          idea_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "lite_tokens_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          onboarded_at: string | null
          passport_cover_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          onboarded_at?: string | null
          passport_cover_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          onboarded_at?: string | null
          passport_cover_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stamps: {
        Row: {
          art_url: string | null
          caption: string | null
          created_at: string
          hangout_id: string
          id: string
          owner_user_id: string
          photo_url: string | null
          tag: string
        }
        Insert: {
          art_url?: string | null
          caption?: string | null
          created_at?: string
          hangout_id: string
          id?: string
          owner_user_id: string
          photo_url?: string | null
          tag: string
        }
        Update: {
          art_url?: string | null
          caption?: string | null
          created_at?: string
          hangout_id?: string
          id?: string
          owner_user_id?: string
          photo_url?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamps_hangout_id_fkey"
            columns: ["hangout_id"]
            isOneToOne: false
            referencedRelation: "hangouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_access_idea: {
        Args: { _idea_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      lite_idea_summary: {
        Args: { _token: string }
        Returns: {
          group_name: string
          idea_id: string
          response_count: number
          tag: string
          timeframe_label: string
          title: string
        }[]
      }
      lite_submit_availability: {
        Args: { _display_name: string; _slots: Json; _token: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      idea_status:
        | "collecting"
        | "suggested"
        | "confirmed"
        | "completed"
        | "stale"
      response_source: "app" | "lite"
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
      app_role: ["admin", "user"],
      idea_status: [
        "collecting",
        "suggested",
        "confirmed",
        "completed",
        "stale",
      ],
      response_source: ["app", "lite"],
    },
  },
} as const
