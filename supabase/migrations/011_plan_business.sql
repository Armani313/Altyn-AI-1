-- Add 'business' plan option to profiles and subscriptions tables
-- (replaces 'enterprise' which was never used in production)

-- profiles.plan: add 'business'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'business'));

-- subscriptions.plan: add 'business'
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('starter', 'pro', 'business'));

-- Migrate any existing 'enterprise' rows (if any) to 'business'
UPDATE profiles SET plan = 'business' WHERE plan = 'enterprise';
UPDATE subscriptions SET plan = 'business' WHERE plan = 'enterprise';
