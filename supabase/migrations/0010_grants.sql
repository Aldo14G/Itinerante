-- 0010_grants.sql — GRANTs explícitos para anon/authenticated/service_role.
-- Sin GRANTs, RLS es irrelevante: Postgres corta antes de evaluar policies.
-- Supabase NO auto-otorga permisos en tablas del schema public creadas post-init.

set search_path = public;

-- schema usage (por si acaso)
grant usage on schema public to anon, authenticated, service_role;

-- Lectura pública en tablas del catálogo (RLS filtra si aplicara)
grant select on
  editorial, person, subject, book, book_identifier, book_creator,
  book_subject, shelf, book_shelf, stock
to anon, authenticated;

-- Escritura autenticada (RLS filtra a admin via is_admin() en policies)
grant insert, update, delete on
  editorial, person, subject, book, book_identifier, book_creator,
  book_subject, shelf, book_shelf, stock
to authenticated;

-- whatsapp_click: anon puede INSERT (RLS with_check valida payload),
-- authenticated puede SELECT/UPDATE/DELETE (RLS filtra a admin).
grant insert on whatsapp_click to anon, authenticated;
grant select, update, delete on whatsapp_click to authenticated;

-- profile y admin_allowlist: solo authenticated (RLS filtra a admin)
grant select, update, delete on profile to authenticated;
grant insert on profile to authenticated;  -- trigger handle_new_user() lo usa via SECURITY DEFINER
grant select, insert, update, delete on admin_allowlist to authenticated;

-- service_role bypassea RLS pero no GRANTs. Otorgar all explícitamente.
grant all on all tables in schema public to service_role;

-- Default privileges para futuras tablas (idempotencia forward)
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant select on tables to anon, authenticated;
