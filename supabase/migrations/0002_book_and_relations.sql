-- 0002_book_and_relations.sql — book (recurso bibliográfico) + M-N.
-- Prefijos dc_/dcterms_ mapean 1:1 a Dublin Core.

set search_path = public;

create table book (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,     -- ej. 2666-roberto-bolano
  editorial_id      uuid not null references editorial(id) on delete restrict,

  -- Dublin Core (metadata bibliográfica)
  dc_title          text not null,
  dc_description    text,                     -- sinopsis larga
  dcterms_abstract  text,                     -- síntesis breve
  dc_language       text not null check (dc_language ~ '^[a-z]{2}$'),  -- ISO 639-1
  dc_type           text not null default 'Text',                       -- DCMI-Type
  dcterms_issued    integer check (dcterms_issued is null or dcterms_issued between 0 and 3000),
  dcterms_extent    integer check (dcterms_extent is null or dcterms_extent > 0),  -- páginas
  dc_format         text,                     -- ej. Paperback, Hardcover
  dcterms_medium    text,                     -- ej. Print, Digital
  dc_rights         text,

  -- Operativo (NO Dublin Core)
  curator_note      text,                     -- nota de Roberto para overlay + ficha
  storage_key       text,                     -- key en book-covers/, null = placeholder
  local_asset_path  text,                     -- legacy /images/**, para migración progresiva

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid
);

create table book_identifier (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references book(id) on delete cascade,
  scheme       text not null check (scheme in ('ISBN-13', 'ISBN-10', 'LCCN')),
  value        text not null,
  unique (scheme, value),
  created_at   timestamptz not null default now()
);

create table book_creator (
  book_id      uuid not null references book(id) on delete cascade,
  person_id    uuid not null references person(id) on delete restrict,
  role         text not null check (role in ('author', 'translator', 'illustrator', 'editor', 'foreword')),
  ord          integer not null default 0,   -- order dentro del rol
  primary key (book_id, person_id, role)
);

create table book_subject (
  book_id      uuid not null references book(id) on delete cascade,
  subject_id   uuid not null references subject(id) on delete cascade,
  primary key (book_id, subject_id)
);
