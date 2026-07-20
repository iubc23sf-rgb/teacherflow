"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function uploadDocument(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: file.type || undefined });
  logSupabaseError("documents.upload", uploadError);
  if (uploadError) return;

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    file_name: file.name,
    storage_path: storagePath,
    size_bytes: file.size,
  });
  logSupabaseError("documents.insertMetadata", insertError);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

export async function deleteDocument(documentId: string, storagePath: string) {
  const supabase = createClient();

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([storagePath]);
  logSupabaseError("documents.deleteStorage", storageError);

  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);
  logSupabaseError("documents.deleteMetadata", dbError);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

export async function getDocumentUrl(storagePath: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60 * 10);
  logSupabaseError("documents.signedUrl", error);
  return data?.signedUrl ?? null;
}
