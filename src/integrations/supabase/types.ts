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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          client_id: string
          created_at: string
          discount_percent: number | null
          guest_count: number | null
          id: string
          notes: string | null
          provider_id: string
          selected_options: Json | null
          service_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          booking_date: string
          client_id: string
          created_at?: string
          discount_percent?: number | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          provider_id: string
          selected_options?: Json | null
          service_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          client_id?: string
          created_at?: string
          discount_percent?: number | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          provider_id?: string
          selected_options?: Json | null
          service_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          provider_id: string
          service_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          provider_id: string
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          provider_id?: string
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          currency_code: string
          currency_symbol: string
          dial_code: string
          flag_emoji: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          currency_code: string
          currency_symbol: string
          dial_code?: string
          flag_emoji?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          dial_code?: string
          flag_emoji?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          booking_id: string | null
          coupon_id: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          coupon_id: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          coupon_id?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          provider_id: string | null
          season_label: string | null
          starts_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          provider_id?: string | null
          season_label?: string | null
          starts_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          provider_id?: string | null
          season_label?: string | null
          starts_at?: string
          used_count?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          image_url: string
          provider_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url: string
          provider_id: string
          title?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string
          provider_id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_address: string | null
          business_name: string | null
          city: string | null
          commercial_register_url: string | null
          country_code: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          id_photo_url: string | null
          is_verified: boolean
          national_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
          user_type: string
          verification_notes: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          commercial_register_url?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          id_photo_url?: string | null
          is_verified?: boolean
          national_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          verification_notes?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          commercial_register_url?: string | null
          country_code?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          id_photo_url?: string | null
          is_verified?: boolean
          national_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      provider_stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          provider_id: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          provider_id: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          provider_id?: string
          view_count?: number
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          label: string
          provider_id: string
          sort_order: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          label: string
          provider_id: string
          sort_order?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          label?: string
          provider_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number
          id: string
          referral_count: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent?: number
          id?: string
          referral_count?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          referral_count?: number
          user_id?: string
        }
        Relationships: []
      }
      referral_usages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          referral_code_id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          referral_code_id: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_usages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_usages_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          service_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          service_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean
          note: string | null
          price_override: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          note?: string | null
          price_override?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          note?: string | null
          price_override?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_availability_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_options: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          service_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          service_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          service_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_options_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_tiers: {
        Row: {
          created_at: string
          id: string
          max_quantity: number | null
          min_quantity: number
          option_id: string
          price_per_unit: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          option_id: string
          price_per_unit: number
        }
        Update: {
          created_at?: string
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          option_id?: string
          price_per_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_price_tiers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "service_options"
            referencedColumns: ["id"]
          },
        ]
      }
      service_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asker_id: string
          created_at: string
          id: string
          question: string
          service_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asker_id: string
          created_at?: string
          id?: string
          question: string
          service_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asker_id?: string
          created_at?: string
          id?: string
          question?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_questions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_views: {
        Row: {
          id: string
          service_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          service_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_views_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          admin_rating: number | null
          category_id: string | null
          city: string | null
          country_code: string | null
          created_at: string
          deposit_percent: number | null
          description: string
          discount_percent: number | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          photos: string[] | null
          price_max: number | null
          price_min: number | null
          provider_id: string
          title: string
          updated_at: string
          weekend_price_increase: number | null
        }
        Insert: {
          admin_rating?: number | null
          category_id?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          deposit_percent?: number | null
          description?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          photos?: string[] | null
          price_max?: number | null
          price_min?: number | null
          provider_id: string
          title: string
          updated_at?: string
          weekend_price_increase?: number | null
        }
        Update: {
          admin_rating?: number | null
          category_id?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          deposit_percent?: number | null
          description?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          photos?: string[] | null
          price_max?: number | null
          price_min?: number | null
          provider_id?: string
          title?: string
          updated_at?: string
          weekend_price_increase?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      wedding_list_items: {
        Row: {
          category_name: string
          created_at: string
          id: string
          list_id: string
          notes: string | null
          service_id: string | null
          status: string
        }
        Insert: {
          category_name?: string
          created_at?: string
          id?: string
          list_id: string
          notes?: string | null
          service_id?: string | null
          status?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          list_id?: string
          notes?: string | null
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "wedding_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_list_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_lists: {
        Row: {
          created_at: string
          id: string
          partner_name: string | null
          title: string
          updated_at: string
          user_id: string
          wedding_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_name?: string | null
          title?: string
          updated_at?: string
          user_id: string
          wedding_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_name?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          wedding_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "provider"
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
      app_role: ["admin", "client", "provider"],
    },
  },
} as const
