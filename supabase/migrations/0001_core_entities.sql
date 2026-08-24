-- 0001_core_entities.sql — editorial, person, subject
-- Fuente de dc:publisher, dc:creator/dc:contributor, dc:subject.

set search_path = public;

create extension if not exists "pgcrypto";  -- gen_random_uuid()

create table editorial (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  country      text,                          -- ISO 3166-1 alpha-2
  website      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid                            -- fk a auth.users; nullable para seed
);

create table person (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  full_name    text not null,
  born_year    integer check (born_year is null or born_year between 0 and 3000),
  died_year    integer check (died_year is null or died_year between 0 and 3000),
  bio_short    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);

create table subject (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  bisac_code   text unique,                    -- ej. FIC019000 (Literary Fiction)
  parent_id    uuid references subject(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);
