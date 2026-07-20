"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function createInterview(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const student_name = String(formData.get("student_name") ?? "").trim();
  const interview_date = String(formData.get("interview_date") ?? "");
  if (!student_name || !interview_date) return;

  const class_id = String(formData.get("class_id") ?? "") || null;
  const interview_type = String(formData.get("interview_type") ?? "other");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("interview_records").insert({
    user_id: user.id,
    student_name,
    class_id,
    interview_date,
    interview_type,
    notes,
  });
  logSupabaseError("interviews.createInterview", error);

  revalidatePath("/interviews");
  revalidatePath("/dashboard");
}

export async function deleteInterview(interviewId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("interview_records")
    .delete()
    .eq("id", interviewId);
  logSupabaseError("interviews.deleteInterview", error);

  revalidatePath("/interviews");
  revalidatePath("/dashboard");
}
