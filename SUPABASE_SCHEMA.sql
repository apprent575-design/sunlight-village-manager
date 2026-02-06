
-- ⚠️ WARNING: This will DROP existing tables to rebuild the schema correctly.
drop table if exists public.expenses cascade;
drop table if exists public.bookings cascade;
drop table if exists public.units cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.profiles cascade;

-- 1. Create Profiles Table (Linked to Auth Users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'user', -- 'admin' or 'user'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. Create Subscriptions Table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  duration_days integer not null,
  price numeric default 0,
  status text default 'active', -- 'active', 'paused', 'expired'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Subscriptions
alter table public.subscriptions enable row level security;
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Admins can view all subscriptions" on public.subscriptions for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 3. Create Units Table
create table public.units (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null, -- 'Chalet', 'Villa', 'Palace'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Units
alter table public.units enable row level security;
create policy "Users can CRUD own units" on public.units for all using (auth.uid() = user_id);
create policy "Admins can view all units" on public.units for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Create Bookings Table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  tenant_name text not null,
  phone text,
  start_date date not null,
  end_date date,
  nights integer default 1,
  nightly_rate numeric default 0,
  village_fee numeric default 0,
  total_rental_price numeric default 0,
  housekeeping_enabled boolean default false,
  housekeeping_price numeric default 0,
  deposit_enabled boolean default false,
  deposit_amount numeric default 0,
  status text default 'Pending',
  payment_status text default 'Unpaid',
  notes text,
  tenant_rating_good boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Bookings
alter table public.bookings enable row level security;
create policy "Users can CRUD own bookings" on public.bookings for all using (auth.uid() = user_id);
create policy "Admins can view all bookings" on public.bookings for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 5. Create Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade,
  title text not null,
  category text,
  amount numeric default 0,
  date date default now(),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on Expenses
alter table public.expenses enable row level security;
create policy "Users can CRUD own expenses" on public.expenses for all using (auth.uid() = user_id);
create policy "Admins can view all expenses" on public.expenses for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 6. Auto-Create Profile Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Admin Helper Function
create or replace function delete_user_by_id(target_user_id uuid)
returns void as $$
begin
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;
