// Supabase のレスポンスは data/error を両方返すが、error を無視して data を
// `?? []` 等で握りつぶすと権限エラーなどが「データなし」に見えてしまう
// (2026-07-20 の GRANT 不足インシデント参照)。最低限サーバーログに残す。
export function logSupabaseError(
  context: string,
  error: { message: string } | null
) {
  if (error) {
    console.error(`[supabase] ${context}:`, error.message);
  }
}
