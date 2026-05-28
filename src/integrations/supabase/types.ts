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
      chats: {
        Row: {
          client_id: string
          client_unread: number
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          listing_id: string | null
          vendor_id: string
          vendor_unread: number
        }
        Insert: {
          client_id: string
          client_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          listing_id?: string | null
          vendor_id: string
          vendor_unread?: number
        }
        Update: {
          client_id?: string
          client_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          listing_id?: string | null
          vendor_id?: string
          vendor_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "chats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          listing_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          listing_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          listing_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address_details: string | null
          bathrooms: number
          bedrooms: number
          cell: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          district: string
          has_balcony: boolean
          has_furnished: boolean
          has_generator: boolean
          has_kitchen: boolean
          has_parking: boolean
          has_security: boolean
          has_water: boolean
          has_wifi: boolean
          id: string
          is_approved: boolean
          is_available: boolean
          is_featured: boolean
          listing_type: Database["public"]["Enums"]["listing_kind"]
          price: number
          price_period: Database["public"]["Enums"]["price_period_kind"]
          property_type: Database["public"]["Enums"]["property_kind"]
          sector: string | null
          size_sqm: number | null
          title: string
          updated_at: string
          vendor_id: string
          views_count: number
        }
        Insert: {
          address_details?: string | null
          bathrooms?: number
          bedrooms?: number
          cell?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          district: string
          has_balcony?: boolean
          has_furnished?: boolean
          has_generator?: boolean
          has_kitchen?: boolean
          has_parking?: boolean
          has_security?: boolean
          has_water?: boolean
          has_wifi?: boolean
          id?: string
          is_approved?: boolean
          is_available?: boolean
          is_featured?: boolean
          listing_type: Database["public"]["Enums"]["listing_kind"]
          price: number
          price_period?: Database["public"]["Enums"]["price_period_kind"]
          property_type: Database["public"]["Enums"]["property_kind"]
          sector?: string | null
          size_sqm?: number | null
          title: string
          updated_at?: string
          vendor_id: string
          views_count?: number
        }
        Update: {
          address_details?: string | null
          bathrooms?: number
          bedrooms?: number
          cell?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          district?: string
          has_balcony?: boolean
          has_furnished?: boolean
          has_generator?: boolean
          has_kitchen?: boolean
          has_parking?: boolean
          has_security?: boolean
          has_water?: boolean
          has_wifi?: boolean
          id?: string
          is_approved?: boolean
          is_available?: boolean
          is_featured?: boolean
          listing_type?: Database["public"]["Enums"]["listing_kind"]
          price?: number
          price_period?: Database["public"]["Enums"]["price_period_kind"]
          property_type?: Database["public"]["Enums"]["property_kind"]
          sector?: string | null
          size_sqm?: number | null
          title?: string
          updated_at?: string
          vendor_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_banned: boolean
          location: string | null
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_banned?: boolean
          location?: string | null
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_banned?: boolean
          location?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          is_resolved: boolean
          listing_id: string
          reason: string
          reporter_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          is_resolved?: boolean
          listing_id: string
          reason: string
          reporter_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          is_resolved?: boolean
          listing_id?: string
          reason?: string
          reporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          activated_by: string | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          payment_method: string
          payment_reference: string | null
          plan: Database["public"]["Enums"]["sub_plan"]
          price_rwf: number
          starts_at: string
          vendor_id: string
        }
        Insert: {
          activated_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          payment_method?: string
          payment_reference?: string | null
          plan: Database["public"]["Enums"]["sub_plan"]
          price_rwf: number
          starts_at?: string
          vendor_id: string
        }
        Update: {
          activated_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          payment_method?: string
          payment_reference?: string | null
          plan?: Database["public"]["Enums"]["sub_plan"]
          price_rwf?: number
          starts_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      vendors: {
        Row: {
          business_name: string | null
          created_at: string
          free_posts_used: number
          id: string
          is_verified: boolean
          subscription_expires_at: string | null
          subscription_status: Database["public"]["Enums"]["sub_status"]
          whatsapp_number: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          free_posts_used?: number
          id: string
          is_verified?: boolean
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["sub_status"]
          whatsapp_number?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          free_posts_used?: number
          id?: string
          is_verified?: boolean
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["sub_status"]
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "vendor" | "admin"
      listing_kind: "rent" | "sale"
      price_period_kind: "monthly" | "yearly" | "fixed"
      property_kind:
        | "house"
        | "apartment"
        | "studio"
        | "room"
        | "commercial"
        | "villa"
      sub_plan: "basic" | "pro"
      sub_status: "free" | "basic" | "pro"
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
      app_role: ["client", "vendor", "admin"],
      listing_kind: ["rent", "sale"],
      price_period_kind: ["monthly", "yearly", "fixed"],
      property_kind: [
        "house",
        "apartment",
        "studio",
        "room",
        "commercial",
        "villa",
      ],
      sub_plan: ["basic", "pro"],
      sub_status: ["free", "basic", "pro"],
    },
  },
} as const
