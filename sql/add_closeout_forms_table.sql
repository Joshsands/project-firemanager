-- Create closeout_forms table
CREATE TABLE IF NOT EXISTS public.closeout_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inspection_date TEXT,
  inspector_name TEXT,
  voltage_reading_main TEXT,
  voltage_reading_backup TEXT,
  system_test_bell BOOLEAN DEFAULT FALSE,
  system_test_voice BOOLEAN DEFAULT FALSE,
  system_test_strobe BOOLEAN DEFAULT FALSE,
  system_test_battery BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.closeout_forms ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY closeout_forms_select ON public.closeout_forms FOR SELECT
  USING (auth.role() = 'authenticated_user');

CREATE POLICY closeout_forms_insert ON public.closeout_forms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY closeout_forms_update ON public.closeout_forms FOR UPDATE
  USING (auth.role() = 'authenticated_user');

CREATE POLICY closeout_forms_delete ON public.closeout_forms FOR DELETE
  USING (auth.role() = 'authenticated_user');
