const STOP_WORDS = new Set([
  "a", "algo", "busco", "con", "dame", "de", "del", "el", "en", "hay",
  "la", "las", "libro", "los", "me", "para", "por", "que", "quiero",
  "recomienda", "recomiendame", "the", "tienen", "un", "una", "y",
]);

const EXPANSIONS = [
  [/ciencia ficcion|espacial|espacio|sci fi|scifi/, "science fiction space sci-fi"],
  [/misterio|suspenso|tension|policiaca|detective|crimen|thriller/, "mystery thriller psychological crime detective suspense"],
  [/romantica|romantico|romance|amor|enamorados/, "romance romantasy contemporary romance"],
  [/fantasia|magia|dragones|epica/, "fantasy romantasy magical"],
  [/habitos|productividad|autoayuda|superacion|disciplina|crecimiento/, "habits productivity self help self-help atomic personal development"],
  [/psicologia|salud mental|ansiedad|mente|terapia|emociones/, "psychology health anxiety mental emotional"],
  [/infantil|ninos|ninas|pequenos|cuentos infantiles|ilustrado/, "children picture graphic novel kids illustrated"],
  [/\bmanga\b|comic|tebeo|historieta/, "graphic novel manga comic illustrated"],
  [/terror|horror|miedo|sobrenatural|fantasmas/, "horror terror supernatural ghost frightening"],
  [/distopia|distopica|apocalipsis|postapocaliptico/, "dystopia dystopian apocalypse post-apocalyptic"],
  [/negra|noir|policial/, "mystery thriller crime detective noir police"],
  [/cuentos|antologia|relatos/, "fiction short stories anthology collection"],
  [/teatro|dramaturgia|obra de teatro/, "fiction plays drama theater"],
  [/clasico|clasicos|clasica|obra maestra/, "classic classics masterpiece timeless"],
  [/espiritual|espiritualidad|religion|budismo|mindfulness|meditacion/, "spirituality religion buddhism mindfulness meditation"],
  [/feminismo|feminista/, "feminism feminist women gender"],
  [/true crime|crimen real|asesinos/, "true crime murder serial killers investigation"],
  [/fisica|biologia|quimica|cosmos|astronomia/, "science physics biology chemistry cosmos astronomy"],
  [/memorias|biografia|autobiografia|vida de/, "memoir biography autobiographical life story"],
  [/historica|historico|historia|segunda guerra|guerra|siglo/, "historical history world war vintage"],
  [/clima|climatica|naturaleza|medio ambiente|ecologia/, "climate nature environmental ecology"],
  [/arte|dibujar|colorear|diseno|fotografia/, "art drawing activity coloring design photography"],
  [/regalo|diario|agenda|cuaderno/, "gift journal notebook planner"],
  [/ensayo|no ficcion|divulgacion/, "non fiction essay non-fiction"],
  [/cocina|recetas|gastronomia|comida/, "cookbook cooking recipes food culinary"],
  [/negocios|finanzas|dinero|inversion|economia|liderazgo/, "business finance money investing economics leadership"],
  [/filosofia|pensamiento|etica|existencial/, "philosophy thought ethics existential"],
  [/poesia|poema|poemas|verso|lirica/, "poetry poem poems verse lyrical"],
  [/\bnovela\b/, "fiction novel"],
  [/\bficcion\b/, "fiction"],
];

export function normalizeSearchText(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function localSearchTerms(value) {
  const normalized = normalizeSearchText(value);
  const expanded = [normalized];
  for (const [pattern, terms] of EXPANSIONS) {
    if (pattern.test(normalized)) expanded.push(terms);
  }
  return [...new Set(expanded.join(" ").split(/\s+/).filter((term) => term && !STOP_WORDS.has(term)))];
}

function authorNames(book) {
  return (book.contributors ?? []).map((item) => item.author?.fullName).filter(Boolean).join(" ");
}

/**
 * Rescate por prefijo para errores de dedo y variantes morfologicas
 * ("terorr" ~ "terror", "distopico" ~ "distopia"). Solo puntua libros que la
 * coincidencia exacta descarto (score 0), asi nunca reordena resultados
 * exactos: suma recuperacion sin mover a los ganadores verificados.
 */
function prefixRescueScore(queryTerms, book) {
  const doc = documentTerms([
    book.title, authorNames(book), book.subgenre?.name, book.genre,
    ...(book.tags ?? []),
  ].filter(Boolean).join(" "));
  if (!doc.length) return 0;
  let score = 0;
  for (const term of queryTerms) {
    if (term.length < 4) continue;
    for (const token of doc) {
      if (token.length < 4) continue;
      if (token.startsWith(term) || term.startsWith(token)
        || token.slice(0, 3) === term.slice(0, 3)) {
        score += 1;
        break;
      }
    }
  }
  return score;
}

function documentTerms(value) {
  return normalizeSearchText(value).split(/\s+/).filter((term) => term && !STOP_WORDS.has(term));
}

function scoreBook(query, queryTerms, book) {
  const title = normalizeSearchText(book.title);
  const author = normalizeSearchText(authorNames(book));
  const category = normalizeSearchText(book.subgenre?.category?.name ?? book.genre);
  const subgenre = normalizeSearchText(book.subgenre?.name);
  const tags = normalizeSearchText((book.tags ?? []).join(" "));
  const allTerms = new Set(documentTerms([
    book.title, author, book.editorial?.name, book.description, book.searchText, book.genre,
    category, subgenre, book.format, ...(book.tags ?? []),
  ].filter(Boolean).join(" ")));
  const titleTerms = new Set(documentTerms(title));
  const authorTerms = new Set(documentTerms(author));
  const genreTerms = new Set(documentTerms(`${category} ${subgenre}`));
  const tagTerms = new Set(documentTerms(tags));

  let score = title.includes(query) || query.includes(title) ? 40 : 0;
  for (const term of queryTerms) {
    if (!allTerms.has(term)) continue;
    score += 2;
    if (titleTerms.has(term)) score += 6;
    if (authorTerms.has(term)) score += 5;
    if (genreTerms.has(term)) score += 4;
    if (tagTerms.has(term)) score += 5;
  }
  return score;
}

/**
 * Ranking hibrido para el dataset pequeno de prueba. Exige coincidencia
 * lexical verificable; pgvector solo desempata y no puede fabricar afinidad.
 * @template T
 * @param {string} query
 * @param {T[]} books
 * @param {string[]} [vectorOrder]
 * @returns {T[]}
 */
export function rankTestBooks(query, books, vectorOrder = []) {
  const normalized = normalizeSearchText(query);
  const terms = localSearchTerms(query);
  const typedTerms = documentTerms(query);
  if (!normalized || terms.length === 0) return [];

  return books.map((book) => {
    const vectorIndex = vectorOrder.indexOf(book.slug);
    const exact = scoreBook(normalized, terms, book);
    return { book, score: exact > 0 ? exact : prefixRescueScore(typedTerms, book), vectorIndex: vectorIndex < 0 ? Number.MAX_SAFE_INTEGER : vectorIndex };
  })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score
      || (left.book.sourceRank ?? Number.MAX_SAFE_INTEGER) - (right.book.sourceRank ?? Number.MAX_SAFE_INTEGER)
      || left.vectorIndex - right.vectorIndex
      || (right.book.sourceRating ?? 0) - (left.book.sourceRating ?? 0))
    .map(({ book }) => book);
}
