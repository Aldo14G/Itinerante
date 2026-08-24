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
