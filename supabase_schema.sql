-- Create Clients Table
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  phone_ia text,
  contact_name text,
  contact_email text,
  contact_phone text,
  cost_per_minute numeric,
  api_key_retail text,
  agent_id text,
  workspace_name text,
  user_id uuid references auth.users(id) -- Optional: to link to a specific Supabase user if needed
);

-- Create Agents Table (Linked to Clients)
create table public.agents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  personality text,
  -- Storing complex structured data as JSONB for flexibility as requested
  knowledge_base text, -- "Uno será dar información y para eso hay que meter una base de conocimiento"
  agenda_config jsonb, -- "Agenda ... cal.com o Google Calendar" -> { "type": "cal.com", "url": "..." }
  transfer_config jsonb, -- "Transferencias ... números y a quién" -> [{ "number": "+123", "who": "Reception" }]
  notice_config jsonb  -- "Avisos ... email/whatsapp/crm" -> { "email": "...", "whatsapp": "...", "crm_info": "..." }
);

-- Create Invoices Table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  amount numeric not null,
  status text default 'pending', -- pending, paid, cancelled
  issue_date date default CURRENT_DATE,
  pdf_url text
);

-- Enable RLS (Row Level Security) - Recommended for security
alter table public.clients enable row level security;
alter table public.agents enable row level security;
alter table public.invoices enable row level security;

-- Create policies (Simplest: Public read/write if you don't have auth set up yet, 
-- but ideally should be authenticated. For now, we'll allow all for verified users or service role)
-- WARNING: Modify these policies for production!
create policy "Enable read access for all users" on public.clients for select using (true);
create policy "Enable insert for all users" on public.clients for insert with check (true);
create policy "Enable update for all users" on public.clients for update using (true);

create policy "Enable read access for all users" on public.agents for select using (true);
create policy "Enable insert for all users" on public.agents for insert with check (true);
create policy "Enable update for all users" on public.agents for update using (true);

create policy "Enable read access for all users" on public.invoices for select using (true);
create policy "Enable insert for all users" on public.invoices for insert with check (true);
create policy "Enable update for all users" on public.invoices for update using (true);
