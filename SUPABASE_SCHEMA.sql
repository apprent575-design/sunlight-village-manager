
-- ⚠️ Run this script to fix Data Visibility and Permissions

-- 1. Ensure columns exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'session_logs' and column_name = 'device_id') then
    alter table public.session_logs add column device_id text;
  end if;
end $$;

-- 2. Create a Secure Function to Fetch Logs (Bypasses RLS for Admins)
-- This fixes the "Data in DB but not on site" issue definitively
CREATE OR REPLACE FUNCTION get_user_sessions(target_user_id UUID)
RETURNS SETOF session_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM session_logs 
  WHERE user_id = target_user_id
  ORDER BY last_active_at DESC
  LIMIT 50;
$$;

-- 3. Reset RLS Policies (Just in case)
alter table public.session_logs enable row level security;

drop policy if exists "Users can insert own sessions" on public.session_logs;
drop policy if exists "Users can update own sessions" on public.session_logs;
drop policy if exists "Users can view own sessions" on public.session_logs;
drop policy if exists "Admins can view all sessions" on public.session_logs;
drop policy if exists "Admins can delete sessions" on public.session_logs;

create policy "Users can insert own sessions" on public.session_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.session_logs for update using (auth.uid() = user_id);
create policy "Users can view own sessions" on public.session_logs for select using (auth.uid() = user_id);

-- Admin View Policy
create policy "Admins can view all sessions" on public.session_logs for select using (
  (auth.jwt() ->> 'email') = 'admin@gmail.com' 
  OR 
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Admin Delete Policy (NEW: Allows admins to force logout/clear history)
create policy "Admins can delete sessions" on public.session_logs for delete using (
  (auth.jwt() ->> 'email') = 'admin@gmail.com' 
  OR 
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 4. Ensure Admin Profile Exists
update public.profiles set role = 'admin' where email = 'admin@gmail.com';

-- 5. Enable Realtime for Session Logs (CRITICAL: Triggers instant logout on client)
-- This ensures the browser receives the DELETE event immediately.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'session_logs'
  ) then
    alter publication supabase_realtime add table public.session_logs;
  end if;
end $$;
