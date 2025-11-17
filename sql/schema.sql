-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- references auth.users.id (implicit)
  name text not null,
  description text,
  booked date,
  closed date,
  contract_amount numeric(12,2),
  margin_start numeric(5,2),
  margin_end numeric(5,2),
  pm_name text,
  customer text,
  created_at timestamp with time zone default now()
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_id uuid not null, -- user id
  title text not null,
  status text check (status in ('todo','in_progress','done')) default 'todo',
  due_date date,
  created_at timestamp with time zone default now()
);

-- Optional: roles (owner, manager, member)
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  role text check (role in ('owner','manager','member')) not null,
  created_at timestamp with time zone default now(),
  unique (project_id, user_id)
);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.memberships enable row level security;

-- Only authenticated users can read/write their own projects
create policy "project_owner_read"
  on public.projects for select
  using (owner_id = auth.uid());

create policy "project_owner_write"
  on public.projects for insert with check (owner_id = auth.uid());

create policy "project_owner_update"
  on public.projects for update using (owner_id = auth.uid());

create policy "project_owner_delete"
  on public.projects for delete using (owner_id = auth.uid());

-- Tasks: assignees can read their tasks; project owner can manage
create policy "task_assignee_read"
  on public.tasks for select
  using (assignee_id = auth.uid());

create policy "task_assignee_write"
  on public.tasks for insert with check (assignee_id = auth.uid());

create policy "task_assignee_update"
  on public.tasks for update
  using (assignee_id = auth.uid());

-- Optional: memberships govern project access
create policy "membership_self_read"
  on public.memberships for select
  using (user_id = auth.uid());

create policy "membership_self_write"
  on public.memberships for insert with check (user_id = auth.uid());

-- Example: allow managers to read all tasks in their project
create policy "manager_project_task_read"
  on public.tasks for select
  using (
    exists (
      select 1 from public.memberships m
      where m.project_id = tasks.project_id
        and m.user_id = auth.uid()
        and m.role in ('owner','manager')
    )
  );
