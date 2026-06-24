ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS default_address_line text,
  ADD COLUMN IF NOT EXISTS default_city text,
  ADD COLUMN IF NOT EXISTS default_pincode text;