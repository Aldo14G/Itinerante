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
