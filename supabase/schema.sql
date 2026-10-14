create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null, email text not null, phone text not null,
  service text, location text, preferred_date date, details text not null,
  status text not null default 'new' check (status in ('new','contacted','site_visit','won','lost')),
  notes text
);
-- RLS on with no public policies: only the server functions (service key) can read or write.
alter table public.bookings enable row level security;