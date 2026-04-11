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
          email: string | null
          plan: 'free' | 'starter' | 'pro' | 'business'
          credits_remaining: number
          trial_credits_decision: 'pending' | 'granted' | 'blocked' | 'legacy'
          trial_credits_granted_at: string | null
          trial_credits_block_reason: string | null
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
          email?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'business'
          credits_remaining?: number
          trial_credits_decision?: 'pending' | 'granted' | 'blocked' | 'legacy'
          trial_credits_granted_at?: string | null
          trial_credits_block_reason?: string | null
          custom_model_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          contact_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          email?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'business'
          credits_remaining?: number
          trial_credits_decision?: 'pending' | 'granted' | 'blocked' | 'legacy'
          trial_credits_granted_at?: string | null
          trial_credits_block_reason?: string | null
          custom_model_url?: string | null
          updated_at?: string
        }
      }
      trial_claims: {
        Row: {
          id: string
          user_id: string
          email_normalized: string | null
          email_domain: string | null
          device_hash: string | null
          ip_hash: string | null
          subnet_hash: string | null
          ua_hash: string | null
          risk_score: number
          decision: 'granted' | 'blocked'
          reason: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_normalized?: string | null
          email_domain?: string | null
          device_hash?: string | null
          ip_hash?: string | null
          subnet_hash?: string | null
          ua_hash?: string | null
          risk_score?: number
          decision: 'granted' | 'blocked'
          reason?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          email_normalized?: string | null
          email_domain?: string | null
          device_hash?: string | null
          ip_hash?: string | null
          subnet_hash?: string | null
          ua_hash?: string | null
          risk_score?: number
          decision?: 'granted' | 'blocked'
          reason?: string | null
          metadata?: Json
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
      video_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image_url: string
          demo_video_url: string
          prompt_template: string
          aspect_ratio: '9:16'
          label: string | null
          is_premium: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          cover_image_url: string
          demo_video_url: string
          prompt_template: string
          aspect_ratio?: '9:16'
          label?: string | null
          is_premium?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          cover_image_url?: string
          demo_video_url?: string
          prompt_template?: string
          aspect_ratio?: '9:16'
          label?: string | null
          is_premium?: boolean
          is_active?: boolean
          sort_order?: number
        }
      }
      video_generations: {
        Row: {
          id: string
          user_id: string
          video_template_id: string | null
          input_image_url: string
          output_video_url: string | null
          status: 'queued' | 'processing' | 'completed' | 'failed'
          provider: string
          provider_operation_name: string | null
          credits_charged: number
          error_message: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_template_id?: string | null
          input_image_url: string
          output_video_url?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          provider?: string
          provider_operation_name?: string | null
          credits_charged?: number
          error_message?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          video_template_id?: string | null
          output_video_url?: string | null
          status?: 'queued' | 'processing' | 'completed' | 'failed'
          provider?: string
          provider_operation_name?: string | null
          credits_charged?: number
          error_message?: string | null
          metadata?: Json
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'starter' | 'pro' | 'business'
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
          plan: 'starter' | 'pro' | 'business'
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
export type VideoTemplate = Database['public']['Tables']['video_templates']['Row']
export type VideoGeneration = Database['public']['Tables']['video_generations']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

export type GenerationStatus = Generation['status']
export type VideoGenerationStatus = VideoGeneration['status']
export type Plan = Profile['plan']
