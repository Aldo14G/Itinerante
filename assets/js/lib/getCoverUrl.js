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
