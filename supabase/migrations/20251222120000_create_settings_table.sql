-- Create settings table for storing app configuration
create table if not exists public.settings (
  id int8 primary key,
  instagram_link text,
  facebook_link text,
  twitter_link text,
  email text,
  whatsapp_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on settings table
alter table public.settings enable row level security;

-- Create RLS policies for settings table
create policy "Allow authenticated users to read settings" on public.settings
  for select to authenticated using (true);

create policy "Allow admins to update settings" on public.settings
  for update to authenticated using (
    (select has_role(auth.uid(), 'admin'))
  );

create policy "Allow admins to insert settings" on public.settings
  for insert to authenticated with check (
    (select has_role(auth.uid(), 'admin'))
  );

-- Seed default row if not exists
insert into public.settings (id, instagram_link, facebook_link, twitter_link, email, whatsapp_number) 
select 1, '', '', '', '', '919876543210' 
where not exists (select 1 from public.settings where id = 1)
on conflict (id) do nothing;
