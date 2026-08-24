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
