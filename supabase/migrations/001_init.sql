-- ============================================================
-- Luminify — Initial Schema
--
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tables ───────────────────────────────────────────────────

-- profiles: one row per auth.users, auto-created on signup
CREATE TABLE IF NOT EXISTS profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  business_name     text,
  contact_name      text,
  phone             text,
  avatar_url        text,
  plan              text        NOT NULL DEFAULT 'free'
                                CHECK (plan IN ('free','starter','pro','enterprise')),
  credits_remaining integer     NOT NULL DEFAULT 3
                                CHECK (credits_remaining >= 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- templates: pose-model thumbnails, managed by admin
CREATE TABLE IF NOT EXISTS templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  thumbnail_url text        NOT NULL DEFAULT '',
  category      text        CHECK (category IN ('rings','necklaces','bracelets','earrings','universal')),
  is_active     boolean     NOT NULL DEFAULT true,
  is_premium    boolean     NOT NULL DEFAULT false,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- generations: AI job history
CREATE TABLE IF NOT EXISTS generations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  template_id      uuid        REFERENCES templates(id) ON DELETE SET NULL,
  input_image_url  text        NOT NULL,
  output_image_url text,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','processing','completed','failed')),
  prompt_override  text,
  error_message    text,
  metadata         jsonb       NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- subscriptions: Kaspi Pay payment records
CREATE TABLE IF NOT EXISTS subscriptions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan           text        NOT NULL CHECK (plan IN ('starter','pro','enterprise')),
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','active','expired','cancelled')),
  kaspi_order_id text,
  amount         numeric     NOT NULL,
  currency       text        NOT NULL DEFAULT 'KZT',
  starts_at      timestamptz,
  expires_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_generations_user_id   ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status    ON generations(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON subscriptions(status);

-- ── Triggers: updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_generations
  BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Trigger: auto-create profile on signup ───────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, business_name, contact_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'contact_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Function: atomic credit decrement ────────────────────────
-- Returns the new credits_remaining, or -1 if already at 0.
-- Called from /api/generate after a successful generation.
CREATE OR REPLACE FUNCTION decrement_credits(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_remaining integer;
BEGIN
  UPDATE profiles
  SET    credits_remaining = credits_remaining - 1
  WHERE  id = p_user_id
    AND  credits_remaining > 0
  RETURNING credits_remaining INTO v_remaining;

  RETURN COALESCE(v_remaining, -1);
END;
$$;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own row
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- templates: anyone authenticated can read active templates
CREATE POLICY "templates_select_active"
  ON templates FOR SELECT USING (is_active = true);

-- generations: users own their rows
CREATE POLICY "generations_select_own"
  ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "generations_insert_own"
  ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generations_update_own"
  ON generations FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions: users own their rows
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_own"
  ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update_own"
  ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
