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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      b2b_requests: {
        Row: {
          business_link: string | null
          business_proof_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gst_number: string | null
          id: string
          phone: string | null
          shop_name: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_link?: string | null
          business_proof_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          phone?: string | null
          shop_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_link?: string | null
          business_proof_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          phone?: string | null
          shop_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bangle_occasions: {
        Row: {
          bangle_id: string
          created_at: string
          id: string
          occasion_id: string
        }
        Insert: {
          bangle_id: string
          created_at?: string
          id?: string
          occasion_id: string
        }
        Update: {
          bangle_id?: string
          created_at?: string
          id?: string
          occasion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bangle_occasions_bangle_id_fkey"
            columns: ["bangle_id"]
            isOneToOne: false
            referencedRelation: "bangles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bangle_occasions_bangle_id_fkey"
            columns: ["bangle_id"]
            isOneToOne: false
            referencedRelation: "bangles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bangle_occasions_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasions"
            referencedColumns: ["id"]
          },
        ]
      }
      bangles: {
        Row: {
          available_colors: string[] | null
          available_sizes: string[] | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          number_of_stock: number | null
          price: number
          retail_price: number | null
          secondary_image_url: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          number_of_stock?: number | null
          price?: number
          retail_price?: number | null
          secondary_image_url?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          number_of_stock?: number | null
          price?: number
          retail_price?: number | null
          secondary_image_url?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          audience: string | null
          created_at: string | null
          id: string
          message: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          pincode: string
          state: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          pincode: string
          state: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          pincode?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      occasions: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          bangle_id: string
          cancelled_qty: number | null
          color: string
          created_at: string
          id: string
          order_id: string
          quantity: number
          size: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          bangle_id: string
          cancelled_qty?: number | null
          color: string
          created_at?: string
          id?: string
          order_id: string
          quantity?: number
          size: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          bangle_id?: string
          cancelled_qty?: number | null
          color?: string
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          size?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_bangle_id_fkey"
            columns: ["bangle_id"]
            isOneToOne: false
            referencedRelation: "bangles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_bangle_id_fkey"
            columns: ["bangle_id"]
            isOneToOne: false
            referencedRelation: "bangles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address_id: string | null
          id: string
          meta: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address_id?: string | null
          id?: string
          meta?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address_id?: string | null
          id?: string
          meta?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gst_no: string | null
          id: string
          phone: string | null
          pincode: string | null
          profile_pic_url: string | null
          shop_name: string | null
          transport_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gst_no?: string | null
          id: string
          phone?: string | null
          pincode?: string | null
          profile_pic_url?: string | null
          shop_name?: string | null
          transport_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gst_no?: string | null
          id?: string
          phone?: string | null
          pincode?: string | null
          profile_pic_url?: string | null
          shop_name?: string | null
          transport_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          email: string | null
          facebook_link: string | null
          id: number
          instagram_link: string | null
          logo_url: string | null
          site_name: string | null
          social_links: Json | null
          twitter_link: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          facebook_link?: string | null
          id: number
          instagram_link?: string | null
          logo_url?: string | null
          site_name?: string | null
          social_links?: Json | null
          twitter_link?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          facebook_link?: string | null
          id?: number
          instagram_link?: string | null
          logo_url?: string | null
          site_name?: string | null
          social_links?: Json | null
          twitter_link?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      bangles_public: {
        Row: {
          available_colors: string[] | null
          available_sizes: string[] | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          name: string | null
          number_of_stock: number | null
          price: number | null
          retail_price: number | null
          secondary_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          number_of_stock?: number | null
          price?: never
          retail_price?: never
          secondary_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          available_colors?: string[] | null
          available_sizes?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          number_of_stock?: number | null
          price?: never
          retail_price?: never
          secondary_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_wholesale: { Args: { uid: string }; Returns: boolean }
      decrement_stock: { Args: { p_order_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_b2b_proof: { Args: { p_url: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
