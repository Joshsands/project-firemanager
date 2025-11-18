-- Add RLS policies to projects table so users only see their own projects
-- Run this in the Supabase SQL editor (or psql) against your project's database.

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT only their own rows
CREATE POLICY "projects_select_owner_only" ON public.projects
  FOR SELECT
  USING (owner_id = auth.uid());

-- Allow authenticated users to INSERT only if owner_id equals auth.uid()
CREATE POLICY "projects_insert_owner_only" ON public.projects
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow authenticated users to UPDATE only their own rows
CREATE POLICY "projects_update_owner_only" ON public.projects
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Allow authenticated users to DELETE only their own rows
CREATE POLICY "projects_delete_owner_only" ON public.projects
  FOR DELETE
  USING (owner_id = auth.uid());

-- Notes:
-- 1) The Supabase service role bypasses RLS; the anon/JS client will be restricted by these policies.
-- 2) Ensure your frontend includes the `owner_id` (set to the authenticated user's id) on INSERTs or rely on a DB trigger to set it.
-- 3) If you need admin users to see all projects, create an additional policy that allows access for a special role/claim.
