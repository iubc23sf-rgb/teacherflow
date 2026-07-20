import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import DocumentUploadForm from "@/components/documents/DocumentUploadForm";
import DocumentList from "@/components/documents/DocumentList";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  logSupabaseError("documents.list", error);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">資料・ファイル</h1>

      <DocumentUploadForm />
      <DocumentList documents={(documents ?? []) as any} />
    </div>
  );
}
