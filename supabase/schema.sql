-- In Both Hands — comments schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).

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
