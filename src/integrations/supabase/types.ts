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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      barbershop_clients: {
        Row: {
          barbershop_id: string
          client_id: string
          created_at: string | null
          email: string | null
          first_visit: string | null
          id: string
          is_active: boolean | null
          last_visit: string | null
          notes: string | null
          phone: string | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          barbershop_id: string
          client_id: string
          created_at?: string | null
          email?: string | null
          first_visit?: string | null
          id?: string
          is_active?: boolean | null
          last_visit?: string | null
          notes?: string | null
          phone?: string | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          barbershop_id?: string
          client_id?: string
          created_at?: string | null
          email?: string | null
          first_visit?: string | null
          id?: string
          is_active?: boolean | null
          last_visit?: string | null
          notes?: string | null
          phone?: string | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbershop_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_info: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          opening_days: string[] | null
          opening_time: string | null
          phone: string | null
          photos: string[] | null
          tiktok: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          opening_days?: string[] | null
          opening_time?: string | null
          phone?: string | null
          photos?: string[] | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          opening_days?: string[] | null
          opening_time?: string | null
          phone?: string | null
          photos?: string[] | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      barbershops: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          mensagem_personalizada: string | null
          name: string
          opening_days: string[] | null
          opening_time: string | null
          owner_id: string
          phone: string | null
          primary_color: string
          slug: string
          tiktok: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          mensagem_personalizada?: string | null
          name: string
          opening_days?: string[] | null
          opening_time?: string | null
          owner_id: string
          phone?: string | null
          primary_color?: string
          slug: string
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          mensagem_personalizada?: string | null
          name?: string
          opening_days?: string[] | null
          opening_time?: string | null
          owner_id?: string
          phone?: string | null
          primary_color?: string
          slug?: string
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbershops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders_sent: {
        Row: {
          booking_id: string
          id: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_sent_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          barbershop_id: string
          booking_date: string
          booking_time: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          professional_id: string
          service_id: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          booking_date: string
          booking_time: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          professional_id: string
          service_id: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          booking_date?: string
          booking_time?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          service_id?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          barbershop_id: string
          client_id: string
          created_at: string | null
          end_date: string
          id: string
          payment_status: string | null
          plan_id: string
          services_used_this_month: number | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          barbershop_id: string
          client_id: string
          created_at?: string | null
          end_date: string
          id?: string
          payment_status?: string | null
          plan_id: string
          services_used_this_month?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          barbershop_id?: string
          client_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          payment_status?: string | null
          plan_id?: string
          services_used_this_month?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          title: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          admin_email: string | null
          admin_whatsapp: string | null
          ai_enabled: boolean | null
          barbershop_id: string | null
          created_at: string | null
          custom_message: string | null
          enabled: boolean | null
          id: string
          push_enabled: boolean | null
          reminder_minutes: number | null
          send_sms: boolean | null
          send_to_client: boolean | null
          send_whatsapp: boolean | null
          updated_at: string | null
        }
        Insert: {
          admin_email?: string | null
          admin_whatsapp?: string | null
          ai_enabled?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          custom_message?: string | null
          enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          reminder_minutes?: number | null
          send_sms?: boolean | null
          send_to_client?: boolean | null
          send_whatsapp?: boolean | null
          updated_at?: string | null
        }
        Update: {
          admin_email?: string | null
          admin_whatsapp?: string | null
          ai_enabled?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          custom_message?: string | null
          enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          reminder_minutes?: number | null
          send_sms?: boolean | null
          send_to_client?: boolean | null
          send_whatsapp?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          barbershop_id: string | null
          booking_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          barbershop_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          barbershop_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          barbershop_id: string
          bio: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          rating: number | null
          specialties: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barbershop_id: string
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          rating?: number | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barbershop_id?: string
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          rating?: number | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      registration_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          barbershop_id: string
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          duration_days: number
          id: string
          is_active: boolean | null
          max_services_per_month: number | null
          name: string
          price: number
          services_included: string[] | null
          updated_at: string | null
        }
        Insert: {
          barbershop_id: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_services_per_month?: number | null
          name: string
          price: number
          services_included?: string[] | null
          updated_at?: string | null
        }
        Update: {
          barbershop_id?: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_services_per_month?: number | null
          name?: string
          price?: number
          services_included?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          booking_id: string
          id: string
          subscription_id: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          subscription_id: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          subscription_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_images: {
        Row: {
          barbershop_id: string | null
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          step_order: number | null
          title: string
          tutorial_id: string
          updated_at: string | null
        }
        Insert: {
          barbershop_id?: string | null
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          step_order?: number | null
          title: string
          tutorial_id: string
          updated_at?: string | null
        }
        Update: {
          barbershop_id?: string | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          step_order?: number | null
          title?: string
          tutorial_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_images_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_videos: {
        Row: {
          barbershop_id: string | null
          category_icon: string
          category_id: string
          category_title: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          barbershop_id?: string | null
          category_icon?: string
          category_id: string
          category_title: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          barbershop_id?: string | null
          category_icon?: string
          category_id?: string
          category_title?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_videos_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          barbershop_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_profile: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      expire_subscriptions: { Args: never; Returns: undefined }
      generate_barbershop_slug: { Args: { name: string }; Returns: string }
      has_active_subscription: {
        Args: {
          _barbershop_id: string
          _client_id: string
          _service_id: string
        }
        Returns: {
          can_use: boolean
          has_subscription: boolean
          services_remaining: number
          subscription_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_barbershop_admin: {
        Args: { _barbershop_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "barber" | "client" | "super_admin"
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
      app_role: ["admin", "barber", "client", "super_admin"],
    },
  },
} as const
