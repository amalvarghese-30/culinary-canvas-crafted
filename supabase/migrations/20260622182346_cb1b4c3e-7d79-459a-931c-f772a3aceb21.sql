
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kitchen';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'waiter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  capacity int NOT NULL CHECK (capacity > 0),
  location text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_tables TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_tables TO authenticated;
GRANT ALL ON public.restaurant_tables TO service_role;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tables public read" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "tables staff write" ON public.restaurant_tables FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER tg_restaurant_tables_updated BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  stock numeric(10,2) NOT NULL DEFAULT 0,
  low_stock_at numeric(10,2) NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory staff read" ON public.inventory_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "inventory staff write" ON public.inventory_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER tg_inventory_items_updated BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.restaurant_tables (label, capacity, location) VALUES
  ('T1', 2, 'Window'),
  ('T2', 2, 'Window'),
  ('T3', 4, 'Main floor'),
  ('T4', 4, 'Main floor'),
  ('T5', 6, 'Patio'),
  ('T6', 8, 'Private')
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.inventory_items (name, unit, stock, low_stock_at) VALUES
  ('Momo wrappers', 'pcs', 500, 100),
  ('Chicken mince', 'kg', 8, 3),
  ('Paneer', 'kg', 5, 2),
  ('Cabbage', 'kg', 6, 2),
  ('Schezwan sauce', 'L', 4, 1),
  ('Tandoori marinade', 'L', 3, 1)
ON CONFLICT DO NOTHING;
