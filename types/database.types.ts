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
          cancel_at_period_end: boolean
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
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          kaspi_order_id?: string | null
          starts_at?: string | null
          expires_at?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          delta: number
          reason: CreditTransactionReason
          ref_id: string | null
          balance_after: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          delta: number
          reason: CreditTransactionReason
          ref_id?: string | null
          balance_after: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          delta?: number
          reason?: CreditTransactionReason
          ref_id?: string | null
          balance_after?: number
          metadata?: Json
        }
      }
      refund_failures: {
        Row: {
          id: string
          user_id: string
          amount: number
          reason: string
          ref_id: string | null
          error: string | null
          context: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          reason: string
          ref_id?: string | null
          error?: string | null
          context?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          reason?: string
          ref_id?: string | null
          error?: string | null
          context?: string | null
          resolved_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      // Legacy single-credit wrappers (migration 021 re-implements them atop the
      // *_by variants so existing callers keep working).
      decrement_credits: {
        Args: { p_user_id: string }
        Returns: number
      }
      refund_credit: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      // Migration 021 — amount-aware credit RPCs with audit.
      decrement_credits_by: {
        Args: {
          p_user_id: string
          p_amount: number
          p_reason: CreditTransactionReason
          p_ref_id?: string | null
        }
        Returns: number
      }
      refund_credits_by: {
        Args: {
          p_user_id: string
          p_amount: number
          p_reason: 'refund_generation' | 'refund_video' | 'refund_upscale'
          p_ref_id?: string | null
        }
        Returns: number
      }
      set_subscription_credits: {
        Args: {
          p_user_id: string
          p_plan: 'free' | 'starter' | 'pro' | 'business'
          p_credits: number
          p_reason: 'subscription_grant' | 'subscription_downgrade'
          p_ref_id?: string | null
        }
        Returns: number
      }
      grant_topup_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_ref_id?: string | null
          p_metadata?: Json
        }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

export type CreditTransactionReason =
  | 'signup_trial'
  | 'generation'
  | 'video'
  | 'upscale'
  | 'refund_generation'
  | 'refund_video'
  | 'refund_upscale'
  | 'subscription_grant'
  | 'subscription_downgrade'
  | 'topup_purchase'
  | 'manual_adjustment'

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
