
-- ============ PROMOTIONS ============
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read active promos" ON public.promotions FOR SELECT
  USING (active = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE POLICY "admin manage promos" ON public.promotions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));
CREATE TRIGGER promotions_updated BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ORDERS extensions ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points_earned integer NOT NULL DEFAULT 0;

-- ============ LOYALTY POINTS ============
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  reason text NOT NULL DEFAULT 'order',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loyalty_user_idx ON public.loyalty_points(user_id, created_at DESC);
GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own loyalty select" ON public.loyalty_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));

-- Auto credit 1 point per ₹10 when order becomes delivered
CREATE OR REPLACE FUNCTION public.credit_loyalty_on_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pts integer;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') AND NEW.loyalty_points_earned = 0 THEN
    pts := floor(NEW.total / 10)::integer;
    IF pts > 0 THEN
      INSERT INTO public.loyalty_points(user_id, order_id, points, reason)
      VALUES (NEW.user_id, NEW.id, pts, 'order');
      UPDATE public.orders SET loyalty_points_earned = pts WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_loyalty_credit AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.credit_loyalty_on_delivery();

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, menu_item_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audience text NOT NULL DEFAULT 'user' CHECK (audience IN ('user','staff','admin','all')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  kind text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_audience_idx ON public.notifications(audience, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own or audience" ON public.notifications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR audience = 'all'
    OR (audience = 'staff' AND (has_role(auth.uid(),'staff') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'kitchen') OR has_role(auth.uid(),'waiter') OR has_role(auth.uid(),'manager')))
    OR (audience = 'admin' AND has_role(auth.uid(),'admin'))
  );
CREATE POLICY "mark own read" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'staff'));

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "staff write audit" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id AND (has_role(auth.uid(),'staff') OR has_role(auth.uid(),'admin')));

-- Seed a couple of promos for demo
INSERT INTO public.promotions (code, description, discount_type, discount_value, min_order)
VALUES
  ('WELCOME10', '10% off your first order', 'percent', 10, 0),
  ('MOMO50', 'Flat ₹50 off over ₹500', 'flat', 50, 500)
ON CONFLICT (code) DO NOTHING;
