-- Run this in your Supabase SQL editor to add missing project columns.
-- Types: booked/closed -> date, contract_amount/margins -> numeric, pm_name/customer -> text

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS booked date,
  ADD COLUMN IF NOT EXISTS closed date,
  ADD COLUMN IF NOT EXISTS contract_amount numeric,
  ADD COLUMN IF NOT EXISTS margin_start numeric,
  ADD COLUMN IF NOT EXISTS margin_end numeric,
  ADD COLUMN IF NOT EXISTS pm_name text,
  ADD COLUMN IF NOT EXISTS customer text,
  ADD COLUMN IF NOT EXISTS design_review_days integer,
  ADD COLUMN IF NOT EXISTS ahj_approval_days integer,
  ADD COLUMN IF NOT EXISTS rough_in_walk_days integer,
  ADD COLUMN IF NOT EXISTS wire_runs_days integer,
  ADD COLUMN IF NOT EXISTS device_trim_out_days integer,
  ADD COLUMN IF NOT EXISTS programming_testing_days integer,
  ADD COLUMN IF NOT EXISTS final_testing_days integer,
  ADD COLUMN IF NOT EXISTS closeouts_days integer,
  ADD COLUMN IF NOT EXISTS design_review_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ahj_approval_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rough_in_walk_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wire_runs_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_trim_out_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS programming_testing_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_testing_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS closeouts_completed boolean DEFAULT false;

-- Labor matrix columns: 6 labor types × 3 editable columns (quoted, estimated, actual)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS design_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS design_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS design_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS cad_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS cad_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS cad_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS pm_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS pm_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS pm_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS prep_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS prep_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS prep_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS tech_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS tech_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS tech_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS install_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS install_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS install_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS material_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS material_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS material_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS sub_labor_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS sub_labor_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS sub_labor_actual numeric(8,2),
  ADD COLUMN IF NOT EXISTS permit_fee_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS permit_fee_estimated numeric(8,2),
  ADD COLUMN IF NOT EXISTS permit_fee_actual numeric(8,2);

-- Optional: adjust numeric precision if you prefer (e.g., numeric(12,2))
-- ALTER TABLE public.projects ALTER COLUMN contract_amount TYPE numeric(12,2);
