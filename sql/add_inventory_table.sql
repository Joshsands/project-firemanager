-- Inventory table for global inventory management
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qty integer NOT NULL,
  model_no text NOT NULL,
  description text,
  project_name text,
  price numeric(12,2),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read inventory
CREATE POLICY "Allow authenticated users to read inventory" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert inventory
CREATE POLICY "Allow authenticated users to insert inventory" ON public.inventory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete inventory
CREATE POLICY "Allow authenticated users to delete inventory" ON public.inventory
  FOR DELETE USING (auth.role() = 'authenticated');
