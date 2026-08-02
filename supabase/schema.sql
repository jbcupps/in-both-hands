-- The Lit Room — Supabase schema (comments + notify signups)
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- Applied to project nfaxjuiafyvfxjgcmvlk as migrations
-- `comments_schema` and `notify_subscribers` (2026-08-02).

create extension if not exists pgcrypto;

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  chapter_slug text not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(body) between 1 and 4000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists comments_chapter_idx
  on public.comments (chapter_slug, created_at);

alter table public.comments enable row level security;

-- Readers (even signed-out) see comments that aren't hidden.
drop policy if exists "read visible comments" on public.comments;
create policy "read visible comments"
  on public.comments for select
  using (hidden = false);

-- Signed-in readers can post as themselves.
drop policy if exists "insert own comments" on public.comments;
create policy "insert own comments"
  on public.comments for insert to authenticated
  with check (auth.uid() = user_id);

-- Readers can delete their own comments.
drop policy if exists "delete own comments" on public.comments;
create policy "delete own comments"
  on public.comments for delete to authenticated
  using (auth.uid() = user_id);

-- The author/admin (you) can read hidden rows and hide/delete anything.
-- Replace the email below with the address you sign in with, if different.
drop policy if exists "admin full access" on public.comments;
create policy "admin full access"
  on public.comments for all to authenticated
  using (auth.jwt() ->> 'email' = 'jbcupps@gmail.com')
  with check (auth.jwt() ->> 'email' = 'jbcupps@gmail.com');

-- Live updates on the page.
alter publication supabase_realtime add table public.comments;

-- ===========================================================================
-- Reader notification signups ("Hear when something new goes up")
-- ===========================================================================
-- The table is reachable ONLY through the two SECURITY DEFINER functions
-- below (plus the service role). No select/insert/update/delete for anon or
-- authenticated: emails can never be listed from the browser.

create table if not exists public.notify_subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique check (char_length(email) <= 320),
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at        timestamptz not null default now()
);

comment on table public.notify_subscribers is
  'Reader emails registered on thelitroom.com for new-chapter notifications.';

alter table public.notify_subscribers enable row level security;
revoke all on table public.notify_subscribers from anon, authenticated;

-- Sign up. Always succeeds for a valid address (duplicate signups are a
-- silent no-op, so the endpoint never reveals who is already on the list).
create or replace function public.notify_signup(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null
     or char_length(v_email) > 320
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'That does not look like an email address.';
  end if;
  -- Safety valve: a personal reader list should never approach this.
  if (select count(*) from public.notify_subscribers) >= 5000 then
    raise exception 'Signups are closed right now.';
  end if;
  insert into public.notify_subscribers (email) values (v_email)
  on conflict (email) do nothing;
end;
$$;

-- Unsubscribe by the secret token from the email link.
create or replace function public.notify_unsubscribe(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notify_subscribers where unsubscribe_token = p_token;
  return found;
end;
$$;

revoke all on function public.notify_signup(text) from public;
revoke all on function public.notify_unsubscribe(uuid) from public;
grant execute on function public.notify_signup(text) to anon, authenticated;
grant execute on function public.notify_unsubscribe(uuid) to anon, authenticated;
