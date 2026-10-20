create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  template text not null default 'simple' check (template in ('simple', 'modern', 'creative')),
  portfolio_data jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists portfolios_user_updated_idx
  on public.portfolios (user_id, updated_at desc);

alter table public.portfolios enable row level security;

drop policy if exists "Owners can read their portfolios" on public.portfolios;
create policy "Owners can read their portfolios"
  on public.portfolios for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Owners can create their portfolios" on public.portfolios;
create policy "Owners can create their portfolios"
  on public.portfolios for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update their portfolios" on public.portfolios;
create policy "Owners can update their portfolios"
  on public.portfolios for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete their portfolios" on public.portfolios;
create policy "Owners can delete their portfolios"
  on public.portfolios for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.portfolios to authenticated;