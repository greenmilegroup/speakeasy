-- Speakeasy Tapas Lounge — events table
-- Run once in the Supabase SQL editor, then paste your URL + anon key into js/config.js.

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  kicker        text default '',
  blurb         text default '',
  category      text not null default 'special'
                check (category in ('music','comedy','special')),
  starts_at     timestamptz,                 -- one-off events
  recurrence    text not null default 'none' check (recurrence in ('none','weekly')),
  weekday       int  check (weekday between 0 and 6),   -- weekly: 0=Sun … 6=Sat
  "time"        text default '19:00',                   -- weekly: "HH:MM"
  duration_min  int  not null default 120,
  price_text    text default '',
  image_url     text default '',
  ticket_url    text default '',
  ticketed      boolean,                 -- null = infer (ticket_url set, or category 'comedy')
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_published_idx on public.events (published);

alter table public.events enable row level security;

-- The website (anon key) may read published events only.
drop policy if exists "public read published" on public.events;
create policy "public read published" on public.events
  for select to anon using (published = true);

-- No anon writes. The MCP server writes with the service-role key, which
-- bypasses RLS. Never put the service-role key in js/config.js.
