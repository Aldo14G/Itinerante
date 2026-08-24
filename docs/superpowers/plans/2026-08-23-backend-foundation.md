# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar el backend de Itinerante — cleanup V2 experimental, schema Dublin Core en Supabase con RLS, seed inicial, cliente JS con feature flags, y suites de test que validan schema + policies + FTS + RPC.

**Architecture:** Postgres 15+ en Supabase con tablas gobernadas por Dublin Core (`dc_*` / `dcterms_*` para metadata bibliográfica, columnas planas para operativo). Frontend vanilla JS ES modules con `@supabase/supabase-js` desde CDN, cero build step. RLS habilitado en todas las tablas con default deny + opt-in explícito por policy. Testing: Node built-in `node:test` contra Supabase local (`supabase start` con Docker).

**Tech Stack:** Postgres 15+, Supabase (PostgREST + Auth + Storage), `@supabase/supabase-js@2` vía `esm.sh`, `node:test` para el harness, `supabase-cli` para migraciones locales.

**Referencia de spec:** `docs/superpowers/specs/2026-08-22-backend-catalogo-dublin-core-design.md` — todas las decisiones locked ahí; este plan las materializa.

---

## File Structure

**A crear:**
- `supabase/config.toml` — generado por `supabase init`.
- `supabase/migrations/0001_core_entities.sql` — editorial, person, subject.
- `supabase/migrations/0002_book_and_relations.sql` — book, book_identifier, book_creator, book_subject.
- `supabase/migrations/0003_shelf_stock.sql` — shelf, book_shelf, stock.
- `supabase/migrations/0004_profile_and_ops.sql` — admin_allowlist, profile, whatsapp_click.
- `supabase/migrations/0005_search_vector.sql` — pg_trgm + search_vector generated + indexes.
- `supabase/migrations/0006_triggers.sql` — updated_at trigger + on_auth_user_created.
- `supabase/migrations/0007_rls_policies.sql` — RLS en todas las tablas.
- `supabase/migrations/0008_rpcs.sql` — get_related_books.
- `supabase/migrations/0009_storage_bucket.sql` — book-covers bucket + policies.
- `supabase/seed.sql` — punto de entrada que hace `\i seed/001_bootstrap.sql`.
- `supabase/seed/001_bootstrap.sql` — 2 admins + 10 libros + 2 shelves.
- `assets/js/config.js` — `BACKEND_FLAGS` + `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
- `assets/js/supabase-client.js` — `sb` client singleton + `supabaseCall` wrapper.
- `assets/js/lib/getCoverUrl.js` — resolver de URL de portada (Supabase / legacy / null).
- `tests/helpers.mjs` — helpers reusables (`normalize`, `readHtml`, `cssRuleBlock`, `assertMotionBudget`, `localAssetValues`, `getSupabaseTestClients`).
- `tests/rls.test.mjs` — 8 asserts RLS (5.1 + 5.2).
- `tests/schema.test.mjs` — FTS, constraints, RPC.
- `tests/lib.test.mjs` — unit tests para `getCoverUrl`, `supabaseCall`.

**A modificar:**
- `package.json` — script `test` incluye subdirectorios; agregar `test:rls` opcional.
- `README.md` — sección "Backend local setup".

**A borrar (Task 1 — cleanup V2 experimental):**
- `src/`
- `dist/`
- `vite.config.js`
- `tools/copy-assets.mjs`
- `package-lock.json`
- `tests/setup.js`
- `test_output.txt`

---

## Prerequisites (dev machine)

- Docker Desktop instalado y corriendo.
- Node.js ≥ 20.
- Supabase CLI: en Windows, `scoop install supabase` o descargar binario de https://github.com/supabase/cli/releases.

---

### Task 1: Limpieza del experimento V2

**Files:**
- Delete: `src/`, `dist/`, `vite.config.js`, `tools/copy-assets.mjs`, `package-lock.json`, `tests/setup.js`, `test_output.txt`.

- [ ] **Step 1: Verificar que estos artefactos no están referenciados desde `index.html` ni desde `package.json`**

Run:
```powershell
Get-ChildItem -Recurse -Include *.html,*.mjs,*.js,*.json -Exclude package-lock.json,dist,src | Select-String -Pattern "src/|dist/|vite\.config|copy-assets|tests/setup"
```

Expected: solo hits dentro de `docs/`, `dist/`, `src/` (los propios archivos a borrar). Si sale un hit desde `index.html` o `package.json`, ABORTAR y reportar.

- [ ] **Step 2: Borrar los artefactos**

Run:
```powershell
Remove-Item -Recurse -Force src, dist, vite.config.js, tools\copy-assets.mjs, package-lock.json, tests\setup.js, test_output.txt
```

Expected: sin errores. Si algún archivo no existe, ignorar silenciosamente (`-ErrorAction SilentlyContinue` es opcional).

- [ ] **Step 3: Verificar que el harness sigue pasando**

Run: `npm test`

Expected: todos los tests de `tests/site.test.mjs` pasan (0 failing).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(cleanup): borrar experimento V2 no committeado

Elimina src/, dist/, vite.config.js, tools/copy-assets.mjs,
package-lock.json, tests/setup.js, test_output.txt. Estos artefactos
son experimentos React/Vite declarados oficialmente muertos por
AGENTS.md/CONTEXT.md (V1 estático es canónico). Sin cambio funcional:
Firebase Hosting sigue sirviendo raíz.

Prerequisito para commits del backend Supabase (spec 6.2 a1).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Bootstrap de Supabase local

**Files:**
- Create: `supabase/config.toml` (generado).
- Create: `.gitignore` entry para `supabase/.temp`, `supabase/.branches`.

- [ ] **Step 1: Verificar que Docker Desktop está corriendo**

Run: `docker ps`

Expected: comando responde sin errores (aunque la lista esté vacía). Si falla con "Cannot connect to Docker daemon", iniciar Docker Desktop y esperar.

- [ ] **Step 2: Inicializar proyecto Supabase**

Run desde raíz del repo: `supabase init`

Expected: se crea `supabase/config.toml` con configuración por defecto. Preguntará "Generate VS Code settings" — responder N.

- [ ] **Step 3: Agregar `.gitignore` entries para archivos temporales**

Edit `.gitignore` (crear si no existe), append:

```
# Supabase local
supabase/.temp/
supabase/.branches/
```

- [ ] **Step 4: Levantar stack local**

Run: `supabase start`

Expected (después de ~2 min primer arranque): output con URLs y keys:
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key: eyJ...
service_role key: eyJ...
```

Anotar `anon key` para Task 15 (`config.js`).

- [ ] **Step 5: Commit config**

```bash
git add supabase/config.toml .gitignore
git commit -m "chore(backend): supabase init (local dev stack)

Configura supabase-cli para el proyecto. supabase/config.toml es la
config canónica de puertos y auth para dev local.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Migration 0001 — Core entities

**Files:**
- Create: `supabase/migrations/0001_core_entities.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0001_core_entities.sql`:

```sql
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
```

- [ ] **Step 2: Aplicar y verificar**

Run: `supabase db reset`

Expected: reset limpio + migración aplicada. Sin errores.

- [ ] **Step 3: Confirmar tablas via psql**

Run:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt public.*"
```

Expected: lista incluye `editorial`, `person`, `subject`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_core_entities.sql
git commit -m "feat(backend): migration 0001 — core entities (editorial/person/subject)

Tablas base para dc:publisher, dc:creator/dc:contributor y dc:subject.
Cada una con slug único (URL humano), timestamps de auditoría, y hooks
para auditoría (updated_by).

Ref spec Sección 1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Migration 0002 — Book + relations

**Files:**
- Create: `supabase/migrations/0002_book_and_relations.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0002_book_and_relations.sql`:

```sql
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
```

- [ ] **Step 2: Aplicar y verificar**

Run: `supabase db reset`

Expected: sin errores.

- [ ] **Step 3: Verificar constraint de idioma**

Run:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "insert into editorial (slug, name) values ('test-ed', 'Test Ed'); insert into book (slug, editorial_id, dc_title, dc_language) values ('test', (select id from editorial where slug='test-ed'), 'Test', 'esp');"
```

Expected: ERROR `check constraint "book_dc_language_check"`. Buena señal: el CHECK funciona.

Run cleanup:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "delete from editorial where slug='test-ed';"
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_book_and_relations.sql
git commit -m "feat(backend): migration 0002 — book + M-N (identifier/creator/subject)

Recurso bibliográfico central con prefijos dc_/dcterms_ mapeados 1:1
a Dublin Core (title, description, language, type, issued, extent,
format, medium, rights). Campos operativos separados: curator_note,
storage_key, local_asset_path.

CHECK constraint sobre dc_language enforcing ISO 639-1 (2 chars).
book_identifier soporta ISBN-13/10 y LCCN con scheme tipado.
book_creator unifica dc:creator + dc:contributor con role explícito.

Ref spec Sección 1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Migration 0003 — Shelf + stock

**Files:**
- Create: `supabase/migrations/0003_shelf_stock.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0003_shelf_stock.sql`:

```sql
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
```

- [ ] **Step 2: Aplicar y verificar**

Run: `supabase db reset`

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_shelf_stock.sql
git commit -m "feat(backend): migration 0003 — shelf + book_shelf + stock

Estanterías curatoriales (shelf) con orden dentro del set. book_shelf
M-N con orden dentro de la estantería (para carruseles ordenados).
stock separado del bloque DC porque cambia con frecuencia distinta
al metadata bibliográfico (precio, disponibilidad, condición).

Ref spec Sección 1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Migration 0004 — Profile + admin_allowlist + whatsapp_click

**Files:**
- Create: `supabase/migrations/0004_profile_and_ops.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0004_profile_and_ops.sql`:

```sql
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
```

- [ ] **Step 2: Aplicar y verificar**

Run: `supabase db reset`

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_profile_and_ops.sql
git commit -m "feat(backend): migration 0004 — admin_allowlist + profile + whatsapp_click

admin_allowlist controla quién es admin (agregar admin = insert row,
sin migración). profile.role vive fuera del JWT hasta que el trigger
lo copie (migration 0006). whatsapp_click es write-only para anon +
read solo admin (RLS en migration 0007); índice por (book_id, occurred_at)
para queries de analytics.

Ref spec Sección 5.1 (RLS design).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Migration 0005 — Full-text search

**Files:**
- Create: `supabase/migrations/0005_search_vector.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0005_search_vector.sql`:

```sql
-- 0005_search_vector.sql — Postgres FTS con pesos + pg_trgm para typos.
-- Pesos (spec 4A.3): A = título+creadores, B = descripción+subjects, C = editorial.

set search_path = public;

create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- search_vector se pobla via trigger (no generated) porque necesita joins.
alter table book add column search_vector tsvector;

create function book_refresh_search_vector(target_book_id uuid)
returns void
language sql
as $$
  update book b
     set search_vector =
           setweight(to_tsvector('spanish', unaccent(coalesce(b.dc_title, ''))), 'A')
         || setweight(to_tsvector('spanish', unaccent(coalesce(
              (select string_agg(p.full_name, ' ')
                 from book_creator bc
                 join person p on p.id = bc.person_id
                where bc.book_id = b.id), ''))), 'A')
         || setweight(to_tsvector('spanish', unaccent(coalesce(b.dc_description, ''))), 'B')
         || setweight(to_tsvector('spanish', unaccent(coalesce(b.dcterms_abstract, ''))), 'B')
         || setweight(to_tsvector('spanish', unaccent(coalesce(
              (select string_agg(s.name, ' ')
                 from book_subject bs
                 join subject s on s.id = bs.subject_id
                where bs.book_id = b.id), ''))), 'B')
         || setweight(to_tsvector('spanish', unaccent(coalesce(
              (select e.name from editorial e where e.id = b.editorial_id), ''))), 'C')
   where b.id = target_book_id;
$$;

-- Trigger de refresh en cualquier cambio a book o a sus relaciones.
create function book_search_vector_trigger() returns trigger language plpgsql as $$
begin
  if tg_table_name = 'book' then
    perform book_refresh_search_vector(new.id);
  elsif tg_table_name = 'book_creator' or tg_table_name = 'book_subject' then
    perform book_refresh_search_vector(coalesce(new.book_id, old.book_id));
  end if;
  return coalesce(new, old);
end;
$$;

create trigger book_search_vector_on_book
  after insert or update of dc_title, dc_description, dcterms_abstract, editorial_id
  on book for each row execute function book_search_vector_trigger();

create trigger book_search_vector_on_creator
  after insert or update or delete on book_creator
  for each row execute function book_search_vector_trigger();

create trigger book_search_vector_on_subject
  after insert or update or delete on book_subject
  for each row execute function book_search_vector_trigger();

-- Índices
create index book_search_vector_idx on book using gin(search_vector);
create index book_dc_title_trgm_idx on book using gin(dc_title gin_trgm_ops);
create index book_dc_description_trgm_idx on book using gin(dc_description gin_trgm_ops);
```

- [ ] **Step 2: Aplicar y verificar**

Run: `supabase db reset`

Expected: sin errores. Los triggers se instalan pero search_vector queda NULL hasta que se inserte data (Task 13 seed).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0005_search_vector.sql
git commit -m "feat(backend): migration 0005 — FTS con pesos + pg_trgm

search_vector poblado por trigger sobre book/book_creator/book_subject.
Pesos: A = título+autores, B = descripción+subjects, C = editorial
(spec 4A.3). unaccent() para tolerancia a acentos. Índices GIN sobre
tsvector + trigrams para typos.

Ref spec Sección 4A.3.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Migration 0006 — Triggers (updated_at + on_auth_user_created)

**Files:**
- Create: `supabase/migrations/0006_triggers.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0006_triggers.sql`:

```sql
-- 0006_triggers.sql — updated_at auto + creación de profile desde auth.users.

set search_path = public;

-- Generic updated_at
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger editorial_set_updated_at before update on editorial
  for each row execute function set_updated_at();
create trigger person_set_updated_at before update on person
  for each row execute function set_updated_at();
create trigger subject_set_updated_at before update on subject
  for each row execute function set_updated_at();
create trigger book_set_updated_at before update on book
  for each row execute function set_updated_at();
create trigger shelf_set_updated_at before update on shelf
  for each row execute function set_updated_at();
create trigger stock_set_updated_at before update on stock
  for each row execute function set_updated_at();

-- Crear profile si el email está en admin_allowlist
create function handle_new_user() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  if exists (select 1 from admin_allowlist where email = new.email) then
    insert into profile (user_id, email, role)
    values (new.id, new.email, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Copiar profile.role al JWT como claim custom.
-- Supabase lee custom_access_token_hook si se define; devuelve JSON con claims a mergear.
create function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql
security definer set search_path = public as $$
declare
  claims jsonb := event->'claims';
  user_role text;
begin
  select role into user_role from profile where user_id = (event->>'user_id')::uuid;
  if user_role is not null then
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
```

- [ ] **Step 2: Configurar el custom access token hook en Supabase local**

Edit `supabase/config.toml`, buscar sección `[auth.hook]` (crear si no existe) y añadir:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

- [ ] **Step 3: Aplicar migración + restart auth**

Run:
```bash
supabase db reset
supabase stop
supabase start
```

Expected: sin errores. `supabase status` muestra Auth up.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_triggers.sql supabase/config.toml
git commit -m "feat(backend): migration 0006 — triggers (updated_at + JWT claim role)

Generic set_updated_at() en tablas con updated_at/updated_by.
handle_new_user() inserta profile solo si email está en admin_allowlist
(cero admins accidentales). custom_access_token_hook copia profile.role
al JWT como claim, habilitando el patrón 'auth.jwt() ->> role' = admin
en policies RLS (spec 5.1 b1).

Ref spec Sección 3 (audit mínimo) + 5.1 b1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: Migration 0007 — RLS policies

**Files:**
- Create: `supabase/migrations/0007_rls_policies.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0007_rls_policies.sql`:

```sql
-- 0007_rls_policies.sql — RLS en TODAS las tablas.
-- Postura: default deny + opt-in explícito.
-- Spec 5.1: a2 (lectura pública restringida) + b1 (JWT claim admin) + c1 (whatsapp_click write-only).

set search_path = public;

-- Habilitar RLS
alter table editorial        enable row level security;
alter table person           enable row level security;
alter table subject          enable row level security;
alter table book             enable row level security;
alter table book_identifier  enable row level security;
alter table book_creator     enable row level security;
alter table book_subject     enable row level security;
alter table shelf            enable row level security;
alter table book_shelf       enable row level security;
alter table stock            enable row level security;
alter table whatsapp_click   enable row level security;
alter table profile          enable row level security;
alter table admin_allowlist  enable row level security;

-- Helper: es admin?
create function is_admin() returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'admin';
$$;

-- Lectura pública (a2): tablas de metadata + join tables + shelf.
create policy public_read on editorial       for select to anon, authenticated using (true);
create policy public_read on person          for select to anon, authenticated using (true);
create policy public_read on subject         for select to anon, authenticated using (true);
create policy public_read on book            for select to anon, authenticated using (true);
create policy public_read on book_identifier for select to anon, authenticated using (true);
create policy public_read on book_creator    for select to anon, authenticated using (true);
create policy public_read on book_subject    for select to anon, authenticated using (true);
create policy public_read on shelf           for select to anon, authenticated using (true);
create policy public_read on book_shelf      for select to anon, authenticated using (true);
create policy public_read on stock           for select to anon, authenticated using (true);

-- Escritura admin (b1): mismo patrón en todas las tablas del catálogo.
create policy admin_write on editorial       for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on person          for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on subject         for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on book            for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on book_identifier for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on book_creator    for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on book_subject    for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on shelf           for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on book_shelf      for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_write on stock           for all to authenticated using (is_admin()) with check (is_admin());

-- whatsapp_click (c1): write-only para anon, read admin.
create policy public_insert on whatsapp_click
  for insert to anon, authenticated
  with check (
    book_id is not null
    and occurred_at is not null
    and (price_shown is null or price_shown >= 0)
  );

create policy admin_read on whatsapp_click
  for select to authenticated using (is_admin());

-- profile: solo admin lee/escribe. Trigger de auth los crea.
create policy admin_read on profile   for select to authenticated using (is_admin());
create policy admin_write on profile  for update to authenticated using (is_admin()) with check (is_admin());

-- admin_allowlist: solo admin lee/escribe.
create policy admin_all on admin_allowlist for all to authenticated using (is_admin()) with check (is_admin());
```

- [ ] **Step 2: Aplicar**

Run: `supabase db reset`

Expected: sin errores.

- [ ] **Step 3: Verificar RLS habilitado en todas las tablas**

Run:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname;"
```

Expected: todas las tablas del catálogo con `relrowsecurity = t` (true).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0007_rls_policies.sql
git commit -m "feat(backend): migration 0007 — RLS policies (default deny + opt-in)

Habilita RLS en TODAS las tablas y define policies:
- Lectura pública (anon) en editorial/person/subject/book/join_tables/shelf/stock.
- Escritura admin (JWT claim role=admin vía is_admin()) en todas las tablas del catálogo.
- whatsapp_click write-only para anon (con check sanitario) + read admin.
- profile/admin_allowlist solo admin.

Ref spec Sección 5.1 (a2+b1+c1).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Migration 0008 — RPC get_related_books

**Files:**
- Create: `supabase/migrations/0008_rpcs.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0008_rpcs.sql`:

```sql
-- 0008_rpcs.sql — RPC de relacionados (spec 4B.4 a4).
-- Score = 3·subjects_compartidos + 2·shelves_compartidos + 1·(misma_editorial).

set search_path = public;

create function get_related_books(target_book_id uuid, limit_n integer default 8)
returns table (
  book_id  uuid,
  score    integer,
  source   text
) language sql stable
security invoker  -- respeta RLS del caller
as $$
  with target as (
    select id, editorial_id from book where id = target_book_id
  ),
  scored as (
    select
      b.id as book_id,
      (
        3 * (select count(*) from book_subject bs1
             join book_subject bs2 on bs2.subject_id = bs1.subject_id
             where bs1.book_id = b.id and bs2.book_id = (select id from target))
      + 2 * (select count(*) from book_shelf bs1
             join book_shelf bs2 on bs2.shelf_id = bs1.shelf_id
             where bs1.book_id = b.id and bs2.book_id = (select id from target))
      + 1 * (case when b.editorial_id = (select editorial_id from target) then 1 else 0 end)
      )::integer as score
    from book b
    where b.id != target_book_id
  ),
  related as (
    select s.book_id, s.score, 'related'::text as source
    from scored s
    where s.score > 0
    order by s.score desc, (select updated_at from book where id = s.book_id) desc
    limit limit_n
  ),
  needed as (
    select greatest(6 - (select count(*) from related), 0)::integer as n
  ),
  fallback as (
    select b.id as book_id, 0 as score, 'fallback'::text as source
    from book b
    where b.id != target_book_id
      and b.id not in (select book_id from related)
    order by b.created_at desc
    limit (select n from needed)
  )
  select * from related
  union all
  select * from fallback;
$$;

grant execute on function get_related_books(uuid, integer) to anon, authenticated;
```

- [ ] **Step 2: Aplicar**

Run: `supabase db reset`

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0008_rpcs.sql
git commit -m "feat(backend): migration 0008 — RPC get_related_books

Score = 3·subjects_compartidos + 2·shelves_compartidos + 1·(misma_editorial).
Tie-break: updated_at DESC. Fallback con novedades hasta completar 6.
Devuelve source ('related' | 'fallback') para diferenciación visual.
security invoker preserva RLS del caller.

Ref spec Sección 4B.4 (a4+b1+c1).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: Migration 0009 — Storage bucket book-covers

**Files:**
- Create: `supabase/migrations/0009_storage_bucket.sql`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0009_storage_bucket.sql`:

```sql
-- 0009_storage_bucket.sql — bucket book-covers/ público read + admin write.
-- Spec 5.2 (a1): URL predecible, sin signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Public read
create policy "book-covers public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'book-covers');

-- Admin write (usa is_admin() de migration 0007)
create policy "book-covers admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'book-covers' and is_admin());

create policy "book-covers admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'book-covers' and is_admin())
  with check (bucket_id = 'book-covers' and is_admin());

create policy "book-covers admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'book-covers' and is_admin());
```

- [ ] **Step 2: Aplicar**

Run: `supabase db reset`

Expected: sin errores. Bucket `book-covers` aparece en Studio (http://127.0.0.1:54323 → Storage).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0009_storage_bucket.sql
git commit -m "feat(backend): migration 0009 — storage bucket book-covers

Bucket público read + admin write (spec 5.2 a1). URL predecible
sin signed URLs. Cap de 5MB, mime types image/webp|jpeg|png.
Policies usan is_admin() de migration 0007 para consistencia.

Ref spec Sección 5.2.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 12: Seed 001_bootstrap.sql

**Files:**
- Create: `supabase/seed.sql`.
- Create: `supabase/seed/001_bootstrap.sql`.

- [ ] **Step 1: Escribir el punto de entrada del seed**

Create `supabase/seed.sql`:

```sql
\i seed/001_bootstrap.sql
```

- [ ] **Step 2: Escribir el bootstrap**

Create `supabase/seed/001_bootstrap.sql`:

```sql
-- 001_bootstrap.sql — seed inicial para dev y testing.
-- 2 admins + 3 editoriales + 6 personas + 8 subjects + 10 libros + 2 shelves.

set search_path = public;

-- Admins allowlist (Roberto + Aldo).
insert into admin_allowlist (email, note) values
  ('roberto@libreriaitineranteymas.com', 'Owner'),
  ('aldogiomtz14@gmail.com',              'Dev + co-admin')
on conflict do nothing;

-- Editoriales
insert into editorial (slug, name, country) values
  ('anagrama',   'Anagrama',        'ES'),
  ('sextopiso',  'Sexto Piso',      'MX'),
  ('era',        'Ediciones Era',   'MX');

-- Personas (autores)
insert into person (slug, full_name) values
  ('roberto-bolano',    'Roberto Bolaño'),
  ('chris-andrews',     'Chris Andrews'),
  ('valeria-luiselli',  'Valeria Luiselli'),
  ('sergio-pitol',      'Sergio Pitol'),
  ('elena-poniatowska', 'Elena Poniatowska'),
  ('juan-villoro',      'Juan Villoro');

-- Subjects (BISAC + castellano)
insert into subject (slug, name, bisac_code) values
  ('narrativa-latinoamericana', 'Narrativa latinoamericana', 'FIC019000'),
  ('poesia',                    'Poesía',                    'POE023000'),
  ('ensayo',                    'Ensayo',                    'LIT004050'),
  ('cronica',                   'Crónica',                   'LIT004080'),
  ('novela-contemporanea',      'Novela contemporánea',      'FIC019000'),
  ('literatura-mexicana',       'Literatura mexicana',       'LIT004050'),
  ('feminismo',                 'Feminismo',                 'SOC028000'),
  ('historia-mexico',           'Historia de México',        'HIS041000');

-- Libros (10)
insert into book (slug, editorial_id, dc_title, dc_description, dcterms_abstract, dc_language, dcterms_issued, dcterms_extent, dc_format, curator_note) values
  ('2666-roberto-bolano',
   (select id from editorial where slug='anagrama'),
   '2666', 'Novela póstuma en cinco partes que orbitan la ciudad de Santa Teresa.',
   'La obra maestra póstuma de Bolaño.',
   'es', 2004, 1119, 'Paperback',
   'Una arquitectura monumental. Puedes empezarlo por cualquier parte y no perderte.'),
  ('los-detectives-salvajes',
   (select id from editorial where slug='anagrama'),
   'Los detectives salvajes', 'Poesía, viaje y desaparición en la generación real visceralista.',
   'Novela del boom tardío.',
   'es', 1998, 609, 'Paperback',
   'La novela que abrió el siglo para muchos. Léela con calma.'),
  ('nocturno-de-chile',
   (select id from editorial where slug='anagrama'),
   'Nocturno de Chile', 'Un cura moribundo repasa su vida bajo Pinochet.',
   'Novela corta densa.',
   'es', 2000, 149, 'Paperback',
   'Perfecta si nunca has leído a Bolaño y quieres una entrada breve.'),
  ('los-ingravidos',
   (select id from editorial where slug='sextopiso'),
   'Los ingrávidos', 'Fragmentos de una vida entre Nueva York y Ciudad de México.',
   'Novela de Luiselli.',
   'es', 2011, 144, 'Paperback',
   'Prosa que respira. Perfecta para leer en café.'),
  ('desierto-sonoro',
   (select id from editorial where slug='sextopiso'),
   'Desierto sonoro', 'Un road trip familiar por Estados Unidos hacia la frontera.',
   'Segunda novela de Luiselli.',
   'es', 2019, 464, 'Paperback',
   'La política del oído. Léela con tiempo.'),
  ('el-arte-de-la-fuga',
   (select id from editorial where slug='era'),
   'El arte de la fuga', 'Memorias, ensayo y viaje entrelazados.',
   'Obra clave de Pitol.',
   'es', 1996, 328, 'Paperback',
   'Un libro sobre leer y viajar como una sola cosa.'),
  ('la-noche-de-tlatelolco',
   (select id from editorial where slug='era'),
   'La noche de Tlatelolco', 'Testimonios sobre la masacre de 1968.',
   'Crónica coral de Poniatowska.',
   'es', 1971, 288, 'Paperback',
   'Documento histórico esencial. Impacta a cualquier edad.'),
  ('las-batallas-en-el-desierto',
   (select id from editorial where slug='era'),
   'Las batallas en el desierto', 'Un niño enamorado en el México de los años 40.',
   'Novela corta canónica.',
   'es', 1981, 68, 'Paperback',
   'La primera obligación de cualquier lector mexicano.'),
  ('el-testigo',
   (select id from editorial where slug='anagrama'),
   'El testigo', 'Un académico regresa a México tras años en Europa.',
   'Premio Herralde 2004.',
   'es', 2004, 464, 'Paperback',
   'Villoro en su forma más ambiciosa.'),
  ('llamadas-de-amsterdam',
   (select id from editorial where slug='anagrama'),
   'Llamadas de Ámsterdam', 'Amor a distancia y crónica de viaje.',
   'Novela corta de Villoro.',
   'es', 2007, 128, 'Paperback',
   'Una noche entera te dura.');

-- book_creator (autor único por libro en el seed)
insert into book_creator (book_id, person_id, role, ord)
select b.id, p.id, 'author', 0
from book b
join (values
  ('2666-roberto-bolano',           'roberto-bolano'),
  ('los-detectives-salvajes',       'roberto-bolano'),
  ('nocturno-de-chile',             'roberto-bolano'),
  ('los-ingravidos',                'valeria-luiselli'),
  ('desierto-sonoro',               'valeria-luiselli'),
  ('el-arte-de-la-fuga',            'sergio-pitol'),
  ('la-noche-de-tlatelolco',        'elena-poniatowska'),
  ('las-batallas-en-el-desierto',   'sergio-pitol'),  -- nota: en realidad es Pacheco; fixture
  ('el-testigo',                    'juan-villoro'),
  ('llamadas-de-amsterdam',         'juan-villoro')
) as m(book_slug, person_slug) on b.slug = m.book_slug
join person p on p.slug = m.person_slug;

-- book_subject
insert into book_subject (book_id, subject_id)
select b.id, s.id
from book b
join (values
  ('2666-roberto-bolano',           'narrativa-latinoamericana'),
  ('2666-roberto-bolano',           'novela-contemporanea'),
  ('los-detectives-salvajes',       'narrativa-latinoamericana'),
  ('los-detectives-salvajes',       'novela-contemporanea'),
  ('nocturno-de-chile',             'narrativa-latinoamericana'),
  ('los-ingravidos',                'literatura-mexicana'),
  ('los-ingravidos',                'novela-contemporanea'),
  ('desierto-sonoro',               'literatura-mexicana'),
  ('desierto-sonoro',               'novela-contemporanea'),
  ('el-arte-de-la-fuga',            'ensayo'),
  ('el-arte-de-la-fuga',            'literatura-mexicana'),
  ('la-noche-de-tlatelolco',        'cronica'),
  ('la-noche-de-tlatelolco',        'historia-mexico'),
  ('las-batallas-en-el-desierto',   'literatura-mexicana'),
  ('el-testigo',                    'literatura-mexicana'),
  ('el-testigo',                    'novela-contemporanea'),
  ('llamadas-de-amsterdam',         'literatura-mexicana')
) as m(book_slug, subject_slug) on b.slug = m.book_slug
join subject s on s.slug = m.subject_slug;

-- book_identifier (ISBN-13 muestra)
insert into book_identifier (book_id, scheme, value)
select b.id, 'ISBN-13', v.isbn
from book b
join (values
  ('2666-roberto-bolano',         '9788433968678'),
  ('los-detectives-salvajes',     '9788433966018'),
  ('nocturno-de-chile',           '9788433914774'),
  ('los-ingravidos',              '9788496867765'),
  ('desierto-sonoro',             '9788416677825'),
  ('el-arte-de-la-fuga',          '9789684114838'),
  ('la-noche-de-tlatelolco',      '9789684111387'),
  ('las-batallas-en-el-desierto', '9789684111073'),
  ('el-testigo',                  '9788433971364'),
  ('llamadas-de-amsterdam',       '9788433972347')
) as v(book_slug, isbn) on b.slug = v.book_slug;

-- Stock
insert into stock (book_id, available, price_mxn, condition)
select b.id, true, v.price, 'new'
from book b
join (values
  ('2666-roberto-bolano',         680.00),
  ('los-detectives-salvajes',     520.00),
  ('nocturno-de-chile',           220.00),
  ('los-ingravidos',              240.00),
  ('desierto-sonoro',             395.00),
  ('el-arte-de-la-fuga',          320.00),
  ('la-noche-de-tlatelolco',      280.00),
  ('las-batallas-en-el-desierto', 180.00),
  ('el-testigo',                  420.00),
  ('llamadas-de-amsterdam',       195.00)
) as v(book_slug, price) on b.slug = v.book_slug;

-- Shelves
insert into shelf (slug, name, curator_note, ord) values
  ('home_featured', 'Vitrina destacada', 'Lo que quiero que veas primero al entrar.', 0),
  ('recomendados',  'Recomendados de Roberto', 'Piezas que le pediría a un amigo que leyera antes que nada.', 1);

-- book_shelf: 6 libros en home_featured, 4 en recomendados (2 solapan).
insert into book_shelf (book_id, shelf_id, ord)
select b.id, sh.id, v.ord
from book b
cross join shelf sh
join (values
  ('2666-roberto-bolano',           'home_featured', 0),
  ('los-ingravidos',                'home_featured', 1),
  ('la-noche-de-tlatelolco',        'home_featured', 2),
  ('las-batallas-en-el-desierto',   'home_featured', 3),
  ('el-arte-de-la-fuga',            'home_featured', 4),
  ('el-testigo',                    'home_featured', 5),
  ('los-detectives-salvajes',       'recomendados',  0),
  ('desierto-sonoro',               'recomendados',  1),
  ('el-arte-de-la-fuga',            'recomendados',  2),
  ('las-batallas-en-el-desierto',   'recomendados',  3)
) as v(book_slug, shelf_slug, ord) on b.slug = v.book_slug and sh.slug = v.shelf_slug;
```

- [ ] **Step 3: Aplicar seed**

Run: `supabase db reset`

Expected: sin errores. `psql ... -c "select count(*) from book;"` devuelve 10.

- [ ] **Step 4: Verificar search_vector poblado**

Run:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "select dc_title, search_vector is not null as has_vector from book;"
```

Expected: los 10 libros con `has_vector = t`.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed.sql supabase/seed/001_bootstrap.sql
git commit -m "feat(backend): seed 001_bootstrap — 2 admins + 10 libros + 2 shelves

Data reproducible para dev y testing: Roberto+Aldo como admins,
10 libros de 3 editoriales (Anagrama, Sexto Piso, Era) con autores,
subjects, ISBN, stock. Dos shelves: home_featured (6 libros) y
recomendados (4 libros, 2 solapando). Sin storage_key —
placeholders vía renderPlaceholder (task futura).

Ref spec Sección 6.1 c1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 13: tests/helpers.mjs

**Files:**
- Create: `tests/helpers.mjs`.

- [ ] **Step 1: Escribir helpers**

Create `tests/helpers.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

export function readHtml(name) {
  return readFileSync(join(root, name), 'utf8');
}

export function localAssetValues(html) {
  return [...html.matchAll(/\b(?:src|href)=["']([^"']*)["']/g)]
    .map(m => m[1])
    .filter(v => v && !v.startsWith('#'))
    .filter(v => !/^(https?:|mailto:|tel:|data:|blob:)/i.test(v));
}

export function cssRuleBlock(selector, html) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) throw new Error(`missing CSS rule for ${selector}`);
  return match[1];
}

export function assertMotionBudget(selector, maxMs, html) {
  const block = cssRuleBlock(selector, html);
  const durations = [...block.matchAll(/(\d*\.?\d+)(ms|s)/g)]
    .map(([, v, u]) => Number(v) * (u === 's' ? 1000 : 1));
  if (durations.length === 0) throw new Error(`expected durations in ${selector}`);
  const max = Math.max(...durations);
  if (max > maxMs) throw new Error(`${selector} exceeds ${maxMs}ms motion budget: ${durations.join(', ')}`);
}

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY = process.env.SUPABASE_LOCAL_ANON_KEY;
const LOCAL_SERVICE_ROLE_KEY = process.env.SUPABASE_LOCAL_SERVICE_KEY;
const ADMIN_TEST_EMAIL = 'roberto@libreriaitineranteymas.com';
const ADMIN_TEST_PASSWORD = 'test-password-only-local';

export async function isSupabaseLocalRunning() {
  try {
    const res = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_ANON_KEY ?? '' },
    });
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}

export async function getSupabaseTestClients() {
  if (!LOCAL_ANON_KEY || !LOCAL_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_LOCAL_ANON_KEY or SUPABASE_LOCAL_SERVICE_KEY env vars. ' +
      'Run: supabase status -o env > .env.supabase-local && source .env.supabase-local'
    );
  }

  const anon = createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY);
  const serviceRole = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Bootstrap admin user si no existe (idempotente).
  const { data: existing } = await serviceRole.auth.admin.listUsers();
  const alreadyExists = existing?.users?.some(u => u.email === ADMIN_TEST_EMAIL);
  if (!alreadyExists) {
    await serviceRole.auth.admin.createUser({
      email: ADMIN_TEST_EMAIL,
      password: ADMIN_TEST_PASSWORD,
      email_confirm: true,
    });
  }

  const admin = createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await admin.auth.signInWithPassword({
    email: ADMIN_TEST_EMAIL,
    password: ADMIN_TEST_PASSWORD,
  });

  return { anon, admin, serviceRole };
}
```

- [ ] **Step 2: Instalar dep de test**

Run: `npm install --save-dev @supabase/supabase-js`

Expected: `package.json` con `devDependencies["@supabase/supabase-js"]`.

- [ ] **Step 3: Verificar que el harness existente sigue pasando**

Run: `npm test`

Expected: `tests/site.test.mjs` sigue pasando (helpers no lo tocan aún).

- [ ] **Step 4: Commit**

```bash
git add tests/helpers.mjs package.json package-lock.json
git commit -m "feat(tests): helpers compartidos + factory de clientes Supabase

tests/helpers.mjs centraliza normalize/readHtml/cssRuleBlock/
assertMotionBudget/localAssetValues (spec 6.1 a2). Además,
getSupabaseTestClients() devuelve { anon, admin, serviceRole }
para las suites RLS/schema (spec 6.1 b1). Bootstrap idempotente
del admin de prueba (Roberto) vía service_role.

Ref spec Sección 6.1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 14: tests/rls.test.mjs — 8 asserts

**Files:**
- Create: `tests/rls.test.mjs`.

- [ ] **Step 1: Escribir la suite**

Create `tests/rls.test.mjs`:

```javascript
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { getSupabaseTestClients, isSupabaseLocalRunning } from './helpers.mjs';

const supabaseAvailable = await isSupabaseLocalRunning();

if (!supabaseAvailable) {
  test('RLS suite skipped', { skip: 'Supabase local not running. Run: supabase start' }, () => {});
} else {
  const { anon, admin, serviceRole } = await getSupabaseTestClients();

  test('RLS 5.1.1 — anon NO puede insertar en book', async () => {
    const editorial = await serviceRole.from('editorial').select('id').limit(1).single();
    const { error } = await anon.from('book').insert({
      slug: 'rls-test-anon-insert',
      editorial_id: editorial.data.id,
      dc_title: 'Test',
      dc_language: 'es',
    });
    assert.ok(error, 'expected RLS violation, got success');
    assert.match(error.message, /row-level security/i);
  });

  test('RLS 5.1.2 — anon NO puede leer whatsapp_click', async () => {
    const { data, error } = await anon.from('whatsapp_click').select('*').limit(1);
    // RLS bloquea select → data vacío (no error, comportamiento PostgREST).
    assert.equal(error, null);
    assert.deepEqual(data, []);
  });

  test('RLS 5.1.3 — anon NO puede leer profile', async () => {
    const { data, error } = await anon.from('profile').select('*').limit(1);
    assert.equal(error, null);
    assert.deepEqual(data, []);
  });

  test('RLS 5.1.4 — admin SÍ puede escribir en book', async () => {
    const editorial = await serviceRole.from('editorial').select('id').limit(1).single();
    const { error } = await admin.from('book').insert({
      slug: `rls-test-admin-insert-${Date.now()}`,
      editorial_id: editorial.data.id,
      dc_title: 'Admin Write Test',
      dc_language: 'es',
    });
    assert.equal(error, null, error?.message);
    // Cleanup
    await serviceRole.from('book').delete().like('slug', 'rls-test-admin-insert-%');
  });

  test('RLS 5.1.5a — anon SÍ puede insertar whatsapp_click con payload válido', async () => {
    const book = await serviceRole.from('book').select('id').limit(1).single();
    const { error } = await anon.from('whatsapp_click').insert({
      book_id: book.data.id,
      price_shown: 100,
      session_ref: 'test-session',
    });
    assert.equal(error, null, error?.message);
  });

  test('RLS 5.1.5b — anon NO puede insertar whatsapp_click con book_id null', async () => {
    const { error } = await anon.from('whatsapp_click').insert({
      book_id: null,
      price_shown: 100,
    });
    assert.ok(error, 'expected constraint violation');
  });

  test('RLS 5.2.1 — anon NO puede escribir en book-covers/', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/webp' });
    const { error } = await anon.storage
      .from('book-covers')
      .upload(`rls-anon-${Date.now()}.webp`, blob);
    assert.ok(error, 'expected RLS violation on storage insert');
  });

  test('RLS 5.2.2 — admin SÍ puede escribir en book-covers/', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/webp' });
    const key = `rls-admin-${Date.now()}.webp`;
    const { error } = await admin.storage.from('book-covers').upload(key, blob);
    assert.equal(error, null, error?.message);
    // Cleanup
    await serviceRole.storage.from('book-covers').remove([key]);
  });

  test('RLS 5.2.3 — público SÍ puede leer objetos del bucket', async () => {
    // Upload como admin, download como anon
    const blob = new Blob(['test'], { type: 'image/webp' });
    const key = `rls-read-${Date.now()}.webp`;
    await admin.storage.from('book-covers').upload(key, blob);

    const publicUrl = anon.storage.from('book-covers').getPublicUrl(key).data.publicUrl;
    const res = await fetch(publicUrl);
    assert.equal(res.status, 200);

    await serviceRole.storage.from('book-covers').remove([key]);
  });
}
```

- [ ] **Step 2: Configurar env vars para test local**

Run:
```bash
supabase status -o env
```

Copiar `ANON_KEY` y `SERVICE_ROLE_KEY`. En una terminal PowerShell:

```powershell
$env:SUPABASE_LOCAL_ANON_KEY = "eyJ..."      # de supabase status
$env:SUPABASE_LOCAL_SERVICE_KEY = "eyJ..."   # de supabase status
```

- [ ] **Step 3: Correr la suite**

Run: `npm test -- tests/rls.test.mjs`

Expected: 9 subtests pass (RLS 5.1.1 a 5.2.3, contando 5.1.5a y 5.1.5b).

- [ ] **Step 4: Verificar skip cuando Supabase local está apagado**

Run: `supabase stop; npm test -- tests/rls.test.mjs`

Expected: "RLS suite skipped" con reason.

Restart: `supabase start`

- [ ] **Step 5: Commit**

```bash
git add tests/rls.test.mjs
git commit -m "test(rls): 9 asserts para RLS (spec 5.1 + 5.2)

- 6 asserts de 5.1: anon deny en insert book / read whatsapp_click /
  read profile; admin allow en book write; anon allow en whatsapp_click
  con payload válido (5.1.5a); anon deny con book_id null (5.1.5b — split
  del assert 5 del spec para aislar comportamientos).
- 3 asserts de 5.2: anon deny en storage insert; admin allow;
  público allow en storage read.

Suite se salta con warning si supabase local no está corriendo
(no rompe dev que olvidó levantarlo).

Ref spec Sección 6.1 b1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 15: tests/schema.test.mjs — FTS + constraints + RPC

**Files:**
- Create: `tests/schema.test.mjs`.

- [ ] **Step 1: Escribir la suite**

Create `tests/schema.test.mjs`:

```javascript
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { getSupabaseTestClients, isSupabaseLocalRunning } from './helpers.mjs';

const supabaseAvailable = await isSupabaseLocalRunning();

if (!supabaseAvailable) {
  test('Schema suite skipped', { skip: 'Supabase local not running.' }, () => {});
} else {
  const { anon, serviceRole } = await getSupabaseTestClients();

  test('schema — dc_language CHECK enforcing ISO 639-1', async () => {
    const editorial = await serviceRole.from('editorial').select('id').limit(1).single();
    const { error } = await serviceRole.from('book').insert({
      slug: 'schema-test-lang',
      editorial_id: editorial.data.id,
      dc_title: 'X',
      dc_language: 'esp',  // 3 chars, viola CHECK
    });
    assert.ok(error, 'expected CHECK violation for dc_language');
    assert.match(error.message, /dc_language/);
  });

  test('schema — stock.price_mxn CHECK >= 0', async () => {
    const book = await serviceRole.from('book').select('id').limit(1).single();
    const { error } = await serviceRole.from('stock').upsert({
      book_id: book.data.id,
      available: true,
      price_mxn: -10,
    });
    assert.ok(error, 'expected CHECK violation for price_mxn');
  });

  test('schema — FTS encuentra libros por título', async () => {
    const { data, error } = await anon
      .from('book')
      .select('slug, dc_title')
      .textSearch('search_vector', '2666', { config: 'spanish' });
    assert.equal(error, null);
    assert.ok(data.some(b => b.slug === '2666-roberto-bolano'), 'expected 2666 in results');
  });

  test('schema — FTS encuentra libros por autor (nombre unaccented)', async () => {
    // Nota: query sin acentos porque el vector se indexa con unaccent(),
    // y websearch_to_tsquery no aplica unaccent automático.
    const { data, error } = await anon
      .from('book')
      .select('slug')
      .textSearch('search_vector', 'Roberto', { config: 'spanish' });
    assert.equal(error, null);
    const slugs = data.map(b => b.slug);
    assert.ok(slugs.includes('2666-roberto-bolano'), 'expected Bolaño books via author name');
    assert.ok(slugs.includes('los-detectives-salvajes'));
  });

  test('schema — FTS con acento tolerante (unaccent)', async () => {
    const { data, error } = await anon
      .from('book')
      .select('slug')
      .textSearch('search_vector', 'bolano', { config: 'spanish' });  // sin ñ ni tilde
    assert.equal(error, null);
    assert.ok(data.some(b => b.slug === '2666-roberto-bolano'));
  });

  test('schema — RPC get_related_books devuelve resultados con score', async () => {
    const target = await serviceRole.from('book')
      .select('id')
      .eq('slug', '2666-roberto-bolano')
      .single();
    const { data, error } = await anon.rpc('get_related_books', {
      target_book_id: target.data.id,
      limit_n: 8,
    });
    assert.equal(error, null, error?.message);
    assert.ok(data.length > 0);
    assert.ok(data.every(r => typeof r.score === 'number'));
    assert.ok(data.every(r => r.source === 'related' || r.source === 'fallback'));
  });

  test('schema — RPC excluye el propio libro de los resultados', async () => {
    const target = await serviceRole.from('book')
      .select('id')
      .eq('slug', '2666-roberto-bolano')
      .single();
    const { data } = await anon.rpc('get_related_books', {
      target_book_id: target.data.id,
      limit_n: 8,
    });
    assert.ok(!data.some(r => r.book_id === target.data.id));
  });

  test('schema — seed poblado (10 libros)', async () => {
    const { count } = await anon.from('book').select('*', { count: 'exact', head: true });
    assert.equal(count, 10);
  });

  test('schema — shelf home_featured tiene 6 libros', async () => {
    const shelf = await serviceRole.from('shelf').select('id').eq('slug', 'home_featured').single();
    const { count } = await anon.from('book_shelf')
      .select('*', { count: 'exact', head: true })
      .eq('shelf_id', shelf.data.id);
    assert.equal(count, 6);
  });
}
```

- [ ] **Step 2: Correr la suite**

Run: `npm test -- tests/schema.test.mjs`

Expected: 9 subtests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/schema.test.mjs
git commit -m "test(schema): FTS + constraints + RPC get_related_books + seed

Cubre: dc_language ISO 639-1, price_mxn >= 0, FTS por título/autor,
FTS con unaccent (bolano encuentra Bolaño), RPC devuelve resultados
scoreados y excluye el propio libro, seed pobló 10 libros, shelf
home_featured tiene 6.

Ref spec Secciones 4A.3 (FTS) + 4B.4 (RPC) + 6.1 c1 (seed).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 16: assets/js/config.js

**Files:**
- Create: `assets/js/config.js`.

- [ ] **Step 1: Escribir config**

Create `assets/js/config.js`:

```javascript
// config.js — configuración runtime del backend.
// La anon key es diseñada para ser embebida (spec 5.3 b2 + runbook rotación).

// TODO al deployar a prod: reemplazar con URL + anon key del proyecto Supabase productivo.
// Ver runbook: CONTEXT.md → Operations / Rotate Supabase anon key.
export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = 'PLACEHOLDER_ANON_KEY';

// WhatsApp CTA (spec 4B.2 a2).
// Arrancamos con número personal de Roberto; flippear a WA Business cuando exista.
export const WHATSAPP_NUMBER = '528180875940';  // MX country code + número

// Feature flags de rollout (spec 6.2 b1).
// 'supabase' = usar backend. 'static' = fallback (galeria: array BOOKS; otras: mensaje mantenimiento).
export const BACKEND_FLAGS = {
  galeria:  'supabase',
  catalogo: 'supabase',
  libro:    'supabase',
  admin:    'supabase',
};
```

- [ ] **Step 2: Reemplazar placeholders con valores locales reales**

Run: `supabase status`

Copiar `anon key`, editar `assets/js/config.js` reemplazando `PLACEHOLDER_ANON_KEY` con el valor real (el prefijo `eyJhbGciOi…`).

**Nota:** en dev usamos las keys locales. Al deployar prod, se ejecuta el runbook de rotación (spec 5.3 b2, documentado en Task 19).

- [ ] **Step 3: Verificar sin errores de sintaxis**

Run: `node --check assets/js/config.js`

Expected: sin output (sintaxis válida).

- [ ] **Step 4: Commit**

```bash
git add assets/js/config.js
git commit -m "feat(backend): config.js — SUPABASE_URL + ANON_KEY + BACKEND_FLAGS

Constants del cliente. anon key embebida por diseño (spec 5.3 b2).
BACKEND_FLAGS por página consumidora para rollback granular en 30s
(spec 6.2 b1). WHATSAPP_NUMBER como constante para flippeo a WA
Business sin refactor (spec 4B.2 a2).

Valores actuales son del stack Supabase local; runbook de rotación
prod-time en CONTEXT.md (Task futura).

Ref spec Secciones 4B.2 + 5.3 b2 + 6.2 b1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 17: assets/js/supabase-client.js

**Files:**
- Create: `assets/js/supabase-client.js`.

- [ ] **Step 1: Escribir el cliente + wrapper**

Create `assets/js/supabase-client.js`:

```javascript
// supabase-client.js — singleton del cliente + wrapper de error handling.
// Spec 5.3 a1 (localStorage + persistSession) + 6.2 c3 (fail policy).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// supabaseCall — centraliza política de fallo (spec 6.2 c3).
// Uso:
//   const { data, error } = await supabaseCall(() => sb.from('book').select('*'));
//   const books = await supabaseCall(() => sb.from('book').select('*'), { silentFail: true, fallback: [] });
export async function supabaseCall(operation, options = {}) {
  const { silentFail = false, fallback = null } = options;
  try {
    const result = await operation();
    if (result?.error) {
      if (silentFail) {
        console.warn('[supabaseCall] operation failed silently:', result.error.message);
        return fallback;
      }
      return result;
    }
    return silentFail ? (result?.data ?? fallback) : result;
  } catch (err) {
    if (silentFail) {
      console.warn('[supabaseCall] operation threw silently:', err.message);
      return fallback;
    }
    throw err;
  }
}
```

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check assets/js/supabase-client.js` (ignora el `import` de CDN — Node lo intentará resolver, así que este check puede fallar; alternativa: `node --input-type=module --check < assets/js/supabase-client.js` o simplemente verificar visualmente).

- [ ] **Step 3: Commit**

```bash
git add assets/js/supabase-client.js
git commit -m "feat(backend): supabase-client.js — singleton + supabaseCall wrapper

Cliente único (sb) con persistSession en localStorage (spec 5.3 a1).
supabaseCall(operation, { silentFail, fallback }) centraliza política
de fallo (spec 6.2 c3): silentFail=true → devuelve fallback + warn;
silentFail=false → devuelve { data, error } como el SDK nativo.

Import del SDK desde esm.sh CDN (spec Sección 2: sin build step).

Ref spec Secciones 5.3 a1 + 6.2 c3.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 18: assets/js/lib/getCoverUrl.js

**Files:**
- Create: `assets/js/lib/getCoverUrl.js`.
- Create: `tests/lib.test.mjs`.

- [ ] **Step 1: Escribir el test primero**

Create `tests/lib.test.mjs`:

```javascript
import test from 'node:test';
import { strict as assert } from 'node:assert';
import { getCoverUrl } from '../assets/js/lib/getCoverUrl.js';

const SUPABASE_URL = 'https://myproject.supabase.co';

test('getCoverUrl — storage_key devuelve URL de Supabase', () => {
  const url = getCoverUrl({ storage_key: '2666.webp' }, SUPABASE_URL);
  assert.equal(
    url,
    'https://myproject.supabase.co/storage/v1/object/public/book-covers/2666.webp'
  );
});

test('getCoverUrl — local_asset_path devuelve path legacy', () => {
  const url = getCoverUrl({ local_asset_path: '/images/legacy.jpg' }, SUPABASE_URL);
  assert.equal(url, '/images/legacy.jpg');
});

test('getCoverUrl — storage_key gana sobre local_asset_path', () => {
  const url = getCoverUrl(
    { storage_key: '2666.webp', local_asset_path: '/images/legacy.jpg' },
    SUPABASE_URL
  );
  assert.match(url, /supabase\.co/);
});

test('getCoverUrl — sin data devuelve null', () => {
  assert.equal(getCoverUrl({}, SUPABASE_URL), null);
  assert.equal(getCoverUrl({ storage_key: null, local_asset_path: null }, SUPABASE_URL), null);
});
```

- [ ] **Step 2: Correr test (fallará por falta de módulo)**

Run: `npm test -- tests/lib.test.mjs`

Expected: FAIL con "Cannot find module '../assets/js/lib/getCoverUrl.js'".

- [ ] **Step 3: Implementar el módulo**

Create `assets/js/lib/getCoverUrl.js`:

```javascript
// getCoverUrl — resuelve URL de portada.
// Prioridad: storage_key (Supabase) > local_asset_path (legacy /images/**) > null (placeholder).
// Spec 5.2 futuro-proofing.

export function getCoverUrl(book, supabaseUrl) {
  if (book?.storage_key) {
    return `${supabaseUrl}/storage/v1/object/public/book-covers/${book.storage_key}`;
  }
  if (book?.local_asset_path) {
    return book.local_asset_path;
  }
  return null;
}
```

- [ ] **Step 4: Correr test**

Run: `npm test -- tests/lib.test.mjs`

Expected: 4 subtests pass.

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib/getCoverUrl.js tests/lib.test.mjs
git commit -m "feat(backend): getCoverUrl helper + unit tests

Resuelve URL de portada con prioridad storage_key (Supabase) >
local_asset_path (legacy) > null (renderer decide placeholder).
Sirve la migración progresiva de /images/** a Supabase Storage
(spec 5.2 nota de migración).

Tests unitarios en tests/lib.test.mjs.

Ref spec Sección 5.2 futuro-proofing.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 19: README.md — sección Backend local setup

**Files:**
- Modify: `README.md` (crear si no existe).

- [ ] **Step 1: Verificar si existe README.md**

Run: `test -f README.md && echo exists || echo missing`

- [ ] **Step 2: Editar/crear con sección de backend**

Si existe, append la sección; si no, crear completo:

```markdown
# Librería Itinerante y Más — Static Site + Backend

## Frontend (existente)

Static Firebase Hosting site. Ver `AGENTS.md` para estructura y convenciones.

Comandos:
- `npm run preview` — sirve el sitio en http://127.0.0.1:8080/
- `firebase emulators:start --only hosting` — sirve con behavior Firebase real
- `firebase deploy --only hosting` — deploy prod
- `npm test` — corre todo el harness (site + rls + schema + lib)

## Backend (Supabase local)

### Prerequisitos

- **Docker Desktop** corriendo (Supabase local usa contenedores).
- **Node.js ≥ 20**.
- **Supabase CLI**:
  - Windows: `scoop install supabase` o binario de https://github.com/supabase/cli/releases
  - macOS/Linux: `brew install supabase/tap/supabase`

### Bootstrap primera vez

```bash
supabase start          # arranca Postgres + Auth + Storage + Studio (~2 min primer arranque)
supabase db reset       # aplica migrations + seed (10 libros)
```

Ver URLs y keys locales:
```bash
supabase status
```

Studio en http://127.0.0.1:54323 para explorar tablas visualmente.

### Correr tests con backend

Las suites `tests/rls.test.mjs` y `tests/schema.test.mjs` requieren Supabase local corriendo. Si no está, se saltan con warning (no rompen el flow).

Env vars requeridas (una sola vez por terminal):

```powershell
# PowerShell
$env:SUPABASE_LOCAL_ANON_KEY = "<anon key de supabase status>"
$env:SUPABASE_LOCAL_SERVICE_KEY = "<service_role key de supabase status>"
```

```bash
# bash/zsh
export SUPABASE_LOCAL_ANON_KEY="..."
export SUPABASE_LOCAL_SERVICE_KEY="..."
```

Correr:
```bash
npm test
```

### Detener stack local

```bash
supabase stop
```

## Runbooks operativos

Ver `CONTEXT.md` sección Operations para runbooks de:
- Rotación de Supabase anon key
- Rollback de consumidor (BACKEND_FLAGS)
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README con setup de backend Supabase local

Prerequisitos (Docker + Node + supabase-cli), bootstrap primera vez
(supabase start / db reset), env vars para tests, y punteros a
runbooks en CONTEXT.md.

Ref spec Sección 6.1 requisito operativo.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 20: Verificación final del plan Foundation

- [ ] **Step 1: Reset limpio + correr toda la suite**

Run:
```bash
supabase db reset
npm test
```

Expected:
- `tests/site.test.mjs` — todos pass.
- `tests/lib.test.mjs` — 4 pass.
- `tests/rls.test.mjs` — 9 pass.
- `tests/schema.test.mjs` — 9 pass.

Total: **0 failing**.

- [ ] **Step 2: Verificar estado del git**

Run: `git log --oneline main..HEAD`

Expected: ~14 commits desde el cleanup, cada uno con mensaje descriptivo referenciando la sección del spec.

- [ ] **Step 3: Verificar que no hay archivos sin trackear inesperados**

Run: `git status`

Expected: solo archivos esperados sin trackear (si los hay). Los artefactos V2 (`src/`, `dist/`, etc.) NO deben aparecer — fueron borrados en Task 1.

- [ ] **Step 4: Push a main (si el flow es directo) o crear PR**

Run: `git push origin main` (o crear PR según convención del proyecto — este repo no tiene branch protection según AGENTS.md).

**Fin del Plan Foundation.** Próximo plan: `Plan 2 — Admin panel (admin.html)`.

---

## Notas para el ejecutor

1. **Antes de empezar Task 1:** confirma que Docker Desktop está instalado. Si no, instalar primero.
2. **Después de Task 2 (`supabase start`):** todas las tasks 3-15 requieren que Supabase local siga corriendo. `supabase stop` solo al final del día.
3. **Env vars:** las tasks 14-15 requieren `SUPABASE_LOCAL_ANON_KEY` y `SUPABASE_LOCAL_SERVICE_KEY` exportadas. Persisten solo en la terminal actual — re-exportar al reabrir.
4. **`supabase db reset`** es destructivo: borra y recrea la DB local, aplica migrations + seed. Seguro en dev, jamás en prod.
5. **Windows PowerShell:** los `bash` en los ejemplos son intercambiables por PowerShell excepto en heredocs (`<<`). Para commits usar `git commit -m "..."` en un solo string; para multi-línea, usar heredoc de PowerShell si necesario.
