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
      barbershop_clients: {
        Row: {
          barbershop_id: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_settings: {
        Row: {
          allow_online_payments: boolean | null
          auto_confirm_bookings: boolean | null
          barbershop_id: string
          booking_advance_days: number | null
          booking_cancellation_hours: number | null
          created_at: string
          deposit_percentage: number | null
          id: string
          reminder_hours_before: number | null
          require_deposit: boolean | null
          send_booking_reminders: boolean | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          allow_online_payments?: boolean | null
          auto_confirm_bookings?: boolean | null
          barbershop_id: string
          booking_advance_days?: number | null
          booking_cancellation_hours?: number | null
          created_at?: string
          deposit_percentage?: number | null
          id?: string
          reminder_hours_before?: number | null
          require_deposit?: boolean | null
          send_booking_reminders?: boolean | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          allow_online_payments?: boolean | null
          auto_confirm_bookings?: boolean | null
          barbershop_id?: string
          booking_advance_days?: number | null
          booking_cancellation_hours?: number | null
          created_at?: string
          deposit_percentage?: number | null
          id?: string
          reminder_hours_before?: number | null
          require_deposit?: boolean | null
          send_booking_reminders?: boolean | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_settings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          business_hours: Json | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          theme_primary_color: string | null
          theme_secondary_color: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          barbershop_id: string
          booking_date: string
          booking_time: string
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          price: number | null
          professional_id: string | null
          service_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          booking_date: string
          booking_time: string
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price?: number | null
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          booking_date?: string
          booking_time?: string
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price?: number | null
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
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
      client_segment_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          segment_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          segment_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_segment_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "barbershop_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_segment_assignments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "client_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_segments: {
        Row: {
          barbershop_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          barbershop_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          barbershop_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_segments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          expires_at: string
          id: string
          mercadopago_preference_id: string | null
          payment_method: string | null
          plan_id: string
          started_at: string
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          expires_at: string
          id?: string
          mercadopago_preference_id?: string | null
          payment_method?: string | null
          plan_id: string
          started_at?: string
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          mercadopago_preference_id?: string | null
          payment_method?: string | null
          plan_id?: string
          started_at?: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string
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
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          professional_id: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          professional_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          professional_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          barbershop_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number | null
        }
        Insert: {
          barbershop_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number | null
        }
        Update: {
          barbershop_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          barbershop_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_count: number | null
          error_details: Json | null
          filename: string
          id: string
          import_type: string
          status: string
          success_count: number | null
          total_records: number | null
        }
        Insert: {
          barbershop_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number | null
          error_details?: Json | null
          filename: string
          id?: string
          import_type: string
          status?: string
          success_count?: number | null
          total_records?: number | null
        }
        Update: {
          barbershop_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_count?: number | null
          error_details?: Json | null
          filename?: string
          id?: string
          import_type?: string
          status?: string
          success_count?: number | null
          total_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          barbershop_id: string
          channel: string
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          recipient_contact: string
          recipient_id: string | null
          sent_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          barbershop_id: string
          channel: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_contact: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          barbershop_id?: string
          channel?: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_contact?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          barbershop_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          trigger_event: string
          type?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_barbershop_id_fkey"
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
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
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
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          barbershop_id: string | null
          client_id: string
          created_at: string | null
          id: string
          mercadopago_status: string | null
          payment_method: string | null
          plan_id: string | null
          preference_id: string | null
          raw_response: Json | null
          status: string | null
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          barbershop_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          mercadopago_status?: string | null
          payment_method?: string | null
          plan_id?: string | null
          preference_id?: string | null
          raw_response?: Json | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          barbershop_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          mercadopago_status?: string | null
          payment_method?: string | null
          plan_id?: string | null
          preference_id?: string | null
          raw_response?: Json | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          professional_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          professional_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          professional_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_commissions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          percentage: number
          professional_id: string
          status: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          percentage: number
          professional_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          percentage?: number
          professional_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_time_blocks: {
        Row: {
          block_date: string | null
          block_type: string
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          is_recurring: boolean
          notes: string | null
          professional_id: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          block_date?: string | null
          block_type?: string
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          professional_id: string
          start_time: string
          title?: string
          updated_at?: string
        }
        Update: {
          block_date?: string | null
          block_type?: string
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          professional_id?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_time_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          barbershop_id: string
          bio: string | null
          commission_percentage: number | null
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
          commission_percentage?: number | null
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
          commission_percentage?: number | null
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_codes: {
        Row: {
          barbershop_id: string | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          used_by: string | null
        }
        Insert: {
          barbershop_id?: string | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          used_by?: string | null
        }
        Update: {
          barbershop_id?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_codes_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      service_addons: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
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
          benefits: string[] | null
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          barbershop_id: string
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          barbershop_id?: string
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
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
      tutorial_videos: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
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
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
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
      waiting_list: {
        Row: {
          barbershop_id: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          preferred_date: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          professional_id: string | null
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client_profile: {
        Args: { p_email?: string; p_name: string; p_phone?: string }
        Returns: string
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
    }
    Enums: {
      app_role: "super_admin" | "admin" | "barber" | "client"
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
      app_role: ["super_admin", "admin", "barber", "client"],
    },
  },
} as const
