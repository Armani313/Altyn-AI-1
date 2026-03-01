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
      profiles: {
        Row: {
          id: string
          business_name: string | null
          contact_name: string | null
          phone: string | null
          avatar_url: string | null
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_remaining: number
          custom_model_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_name?: string | null
          contact_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_remaining?: number
          custom_model_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          contact_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_remaining?: number
          custom_model_url?: string | null
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          thumbnail_url: string
          category: 'rings' | 'necklaces' | 'bracelets' | 'earrings' | 'universal' | null
          is_active: boolean
          is_premium: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          thumbnail_url: string
          category?: 'rings' | 'necklaces' | 'bracelets' | 'earrings' | 'universal' | null
          is_active?: boolean
          is_premium?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          thumbnail_url?: string
          category?: 'rings' | 'necklaces' | 'bracelets' | 'earrings' | 'universal' | null
          is_active?: boolean
          is_premium?: boolean
          sort_order?: number
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          input_image_url: string
          output_image_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          prompt_override: string | null
          error_message: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          input_image_url: string
          output_image_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          prompt_override?: string | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          output_image_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          metadata?: Json
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'starter' | 'pro' | 'enterprise'
          status: 'pending' | 'active' | 'expired' | 'cancelled'
          kaspi_order_id: string | null
          amount: number
          currency: string
          starts_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: 'starter' | 'pro' | 'enterprise'
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          kaspi_order_id?: string | null
          amount: number
          currency?: string
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          kaspi_order_id?: string | null
          starts_at?: string | null
          expires_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      decrement_credits: {
        Args: { p_user_id: string }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

// Удобные алиасы для использования в компонентах
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

export type GenerationStatus = Generation['status']
export type Plan = Profile['plan']
