-- 0011_fix_role_claim.sql — usar app_role en vez de role para no colisionar con Supabase.
-- Bug: 0006 metía 'admin' en JWT.role, pero Supabase usa role como SQL role vía
-- SET LOCAL role. 'admin' no es un rol Postgres válido (solo anon/authenticated/
-- service_role), rompiendo Storage y PostgREST con error 22023.
-- Fix: claim custom en 'app_role'. is_admin() lee de ahí.

set search_path = public;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql
security definer set search_path = public as $$
declare
  claims jsonb := event->'claims';
  user_role text;
begin
  select role into user_role from profile where user_id = (event->>'user_id')::uuid;
  if user_role is not null then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(user_role));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

create or replace function is_admin() returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', '') = 'admin';
$$;
