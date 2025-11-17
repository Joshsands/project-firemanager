-- Create change_orders table
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  change_order_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  contact_name TEXT,
  materials_json JSONB DEFAULT '[]'::jsonb,
  internal_labor_json JSONB DEFAULT '{}'::jsonb,
  subcontractor_json JSONB DEFAULT '{}'::jsonb,
  margin_percent NUMERIC(10, 2) DEFAULT 0,
  materials_total NUMERIC(12, 2) DEFAULT 0,
  internal_labor_total NUMERIC(12, 2) DEFAULT 0,
  subcontractor_total NUMERIC(12, 2) DEFAULT 0,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  final_price NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY change_orders_select ON public.change_orders FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY change_orders_insert ON public.change_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY change_orders_update ON public.change_orders FOR UPDATE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY change_orders_delete ON public.change_orders FOR DELETE
  USING (auth.role() = 'authenticated_user');
