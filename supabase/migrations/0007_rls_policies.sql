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
