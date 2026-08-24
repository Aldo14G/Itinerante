-- 0004_profile_and_ops.sql — admin allowlist, profiles, analytics.

set search_path = public;

create table admin_allowlist (
  email        text primary key,
  note         text,
  created_at   timestamptz not null default now()
);

create table profile (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  role         text not null check (role in ('admin', 'editorial', 'reader')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table whatsapp_click (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references book(id) on delete cascade,
  price_shown  numeric(10,2),
  session_ref  text,                          -- correlator opaco, sin PII
  occurred_at  timestamptz not null default now()
);

-- Índice para admin analytics: clicks por libro
create index whatsapp_click_book_id_idx on whatsapp_click(book_id, occurred_at desc);
