-- Run in your own Supabase project's SQL Editor. Keep the project service key private.
create table if not exists public.mdk_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.mdk_enquiries (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null check (char_length(name) between 1 and 100),
 organization text not null check (char_length(organization) between 1 and 160),
 designation text not null default '' check (char_length(designation)<=100),
 email text not null check (char_length(email) between 3 and 254),
 phone text not null default '' check (char_length(phone)<=30),
 industry text not null check (char_length(industry) between 1 and 100),
 service text not null check (char_length(service) between 1 and 150),
 topic text not null default '' check (char_length(topic)<=250),
 date text not null default '' check (char_length(date)<=10),
 time text not null default '' check (char_length(time)<=5),
 mode text not null default '' check (char_length(mode)<=20),
 message text not null check (char_length(message) between 10 and 3000)
);
create index if not exists mdk_enquiries_created_at_idx on public.mdk_enquiries(created_at desc);
alter table public.mdk_admins enable row level security;
alter table public.mdk_enquiries enable row level security;
revoke all on public.mdk_admins from anon, authenticated;
revoke all on public.mdk_enquiries from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant insert (name, organization, designation, email, phone, industry, service, topic, date, time, mode, message) on public.mdk_enquiries to anon;
grant select on public.mdk_enquiries to authenticated;
grant select on public.mdk_admins to authenticated;
drop policy if exists "public can submit enquiry" on public.mdk_enquiries;
create policy "public can submit enquiry" on public.mdk_enquiries for insert to anon
 with check (true);
drop policy if exists "admin can read enquiries" on public.mdk_enquiries;
create policy "admin can read enquiries" on public.mdk_enquiries for select to authenticated
 using (exists (select 1 from public.mdk_admins where user_id=(select auth.uid())));
drop policy if exists "admin can verify membership" on public.mdk_admins;
create policy "admin can verify membership" on public.mdk_admins for select to authenticated
 using (user_id=(select auth.uid()));
-- After creating your admin in Authentication > Users, add its real UUID in SQL Editor:
-- insert into public.mdk_admins (user_id) values ('YOUR-ADMIN-USER-UUID');
-- Disable public signups in Authentication settings and create admins in the dashboard.
