-- 0003_shelf_stock.sql — estanterías curatoriales + inventario.
-- NO Dublin Core: operativo puro.

set search_path = public;

create table shelf (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,     -- ej. home_featured, recomendados
  name              text not null,
  curator_note      text,                     -- descripción curatorial de la estantería
  ord               integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid
);

create table book_shelf (
  book_id           uuid not null references book(id) on delete cascade,
  shelf_id          uuid not null references shelf(id) on delete cascade,
  ord               integer not null default 0,
  primary key (book_id, shelf_id)
);

create table stock (
  book_id           uuid primary key references book(id) on delete cascade,
  available         boolean not null default false,
  price_mxn         numeric(10,2) not null check (price_mxn >= 0),
  condition         text check (condition in ('new', 'used_like_new', 'used_good', 'used_fair')),
  location          text,                     -- ubicación física interna
  updated_at        timestamptz not null default now(),
  updated_by        uuid
);
