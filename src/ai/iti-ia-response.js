function authorName(book) {
  return book.author || (book.contributors ?? [])
    .map((item) => item.author?.fullName)
    .filter(Boolean)
    .join(", ") || undefined;
}

export function groundedSelection(candidates, requestedSlugs = [], limit = 3) {
  const bySlug = new Map(candidates.map((book) => [book.slug, book]));
  const selected = [];
  for (const slug of requestedSlugs) {
    const book = bySlug.get(slug);
    if (book && !selected.includes(book)) selected.push(book);
    if (selected.length === limit) break;
  }
  return selected.length ? selected : candidates.slice(0, limit);
}

function groundedReason(book) {
  const author = authorName(book);
  const classification = book.subgenre?.name || book.subgenreName || book.genre;
  const details = [classification, book.format, author].filter(Boolean).join(" · ");
  return details || "Resultado recuperado del catálogo.";
}

export function buildRecommendationMessage(candidates, requestedSlugs, { datasetKey, modelAvailable }) {
  const isTestData = datasetKey !== "inventory";
  const recommendedBooks = groundedSelection(candidates, requestedSlugs).map((book) => {
    const recommendation = {
      slug: book.slug,
      title: book.title,
      author: authorName(book),
      genre: book.subgenre?.category?.name || book.category?.name || book.genre,
      coverUrl: book.coverUrl || undefined,
      coverAlt: book.coverAlt || undefined,
      reason: groundedReason(book),
      sourceUrl: book.sourceUrl,
      verifiedAt: book.verifiedAt,
      datasetKey: book.datasetKey,
      sourceLabel: book.sourceLabel,
      isTestData,
    };
    if (!isTestData) {
      recommendation.whatsappPrefill = `Hola, me interesa el libro "${book.title}" recomendado por Iti IA. ¿Esta disponible?`;
    }
    return Object.fromEntries(Object.entries(recommendation).filter(([, value]) => value !== undefined));
  });

  const text = recommendedBooks.length === 1
    ? "Encontré una opción en el catálogo:"
    : `Encontré ${recommendedBooks.length} opciones en el catálogo:`;
  return {
    role: "model",
    content: [
      { text },
      { toolRequest: { name: "recommendBooks", input: { recommendedBooks } } },
    ],
  };
}

export function buildQuestionMessage(question) {
  return {
    role: "model",
    content: [{ toolRequest: { name: "askQuestion", input: { question, type: "FREEFORM" } } }],
  };
}
