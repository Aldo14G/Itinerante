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
-- Nota: subject.bisac_code es UNIQUE en el schema. Etiquetas curatoriales
-- que se solapan con un código general (novela-contemporanea vs
-- narrativa-latinoamericana en FIC019000; literatura-mexicana vs ensayo
-- en LIT004050) quedan con bisac_code=NULL — no inventamos códigos.
insert into subject (slug, name, bisac_code) values
  ('narrativa-latinoamericana', 'Narrativa latinoamericana', 'FIC019000'),
  ('poesia',                    'Poesía',                    'POE023000'),
  ('ensayo',                    'Ensayo',                    'LIT004050'),
  ('cronica',                   'Crónica',                   'LIT004080'),
  ('novela-contemporanea',      'Novela contemporánea',      null),
  ('literatura-mexicana',       'Literatura mexicana',       null),
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
