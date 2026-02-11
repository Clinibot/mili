-- Create Client Contacts Table
create table public.client_contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  role text, -- e.g. "Técnico", "Administración", "CEO"
  email text,
  phone text
);

-- Enable RLS
alter table public.client_contacts enable row level security;

-- Create policies (Allow full access for authenticated users/service role for now, adjusting as per existing patterns)
create policy "Enable read access for all users" on public.client_contacts for select using (true);
create policy "Enable insert for all users" on public.client_contacts for insert with check (true);
create policy "Enable update for all users" on public.client_contacts for update using (true);
create policy "Enable delete for all users" on public.client_contacts for delete using (true);
