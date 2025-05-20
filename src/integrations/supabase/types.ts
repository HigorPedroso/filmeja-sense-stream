export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      favorite_content: {
        Row: {
          added_at: string
          id: string
          media_type: string
          title: string
          tmdb_id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          media_type: string
          title: string
          tmdb_id: string
          user_id?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          media_type?: string
          title?: string
          tmdb_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          movie_id: number
          poster_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          movie_id: number
          poster_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          movie_id?: number
          poster_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_verifications: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          payment_amount: number | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string
          updated_at: string
          user_id: string
          verification_date: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status: string
          updated_at?: string
          user_id: string
          verification_date?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          updated_at?: string
          user_id?: string
          verification_date?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          backdrop_path: string | null
          created_at: string | null
          id: string
          movie_id: number
          overview: string | null
          platforms: Json | null
          poster_path: string | null
          rating: number | null
          release_year: number | null
          runtime: number | null
          title: string
          user_id: string | null
        }
        Insert: {
          backdrop_path?: string | null
          created_at?: string | null
          id?: string
          movie_id: number
          overview?: string | null
          platforms?: Json | null
          poster_path?: string | null
          rating?: number | null
          release_year?: number | null
          runtime?: number | null
          title: string
          user_id?: string | null
        }
        Update: {
          backdrop_path?: string | null
          created_at?: string | null
          id?: string
          movie_id?: number
          overview?: string | null
          platforms?: Json | null
          poster_path?: string | null
          rating?: number | null
          release_year?: number | null
          runtime?: number | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          current_period_end: string | null
          email: string
          id: string
          is_premium: boolean
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          email: string
          id?: string
          is_premium?: boolean
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          email?: string
          id?: string
          is_premium?: boolean
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          status: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          content_type: string | null
          created_at: string
          genres: string[] | null
          id: string
          languages: string[] | null
          updated_at: string
          user_id: string
          watch_duration: string | null
          watch_time: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          genres?: string[] | null
          id?: string
          languages?: string[] | null
          updated_at?: string
          user_id: string
          watch_duration?: string | null
          watch_time?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          genres?: string[] | null
          id?: string
          languages?: string[] | null
          updated_at?: string
          user_id?: string
          watch_duration?: string | null
          watch_time?: string | null
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          content_id: number
          content_type: string
          created_at: string
          id: number
          poster_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          content_id: number
          content_type: string
          created_at?: string
          id?: number
          poster_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          content_id?: number
          content_type?: string
          created_at?: string
          id?: number
          poster_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      watched_content: {
        Row: {
          created_at: string | null
          id: string
          media_type: string
          title: string
          tmdb_id: number
          user_id: string | null
          watched_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_type: string
          title: string
          tmdb_id: number
          user_id?: string | null
          watched_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          media_type?: string
          title?: string
          tmdb_id?: number
          user_id?: string | null
          watched_at?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
