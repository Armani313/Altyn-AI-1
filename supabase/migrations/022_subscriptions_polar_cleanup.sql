DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'kaspi_order_id'
  ) THEN
    ALTER TABLE public.subscriptions
      RENAME COLUMN kaspi_order_id TO polar_subscription_id;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_unique_idx
  ON public.subscriptions(polar_subscription_id)
  WHERE polar_subscription_id IS NOT NULL;

DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;

COMMENT ON TABLE public.subscriptions IS
  'Subscription records synchronized from the active billing provider.';
