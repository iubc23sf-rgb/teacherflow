"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function createLessonProgress(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const unit_name = String(formData.get("unit_name") ?? "").trim();
  const subject_id = String(formData.get("subject_id") ?? "") || null;
  if (!unit_name || !subject_id) return;

  const class_id = String(formData.get("class_id") ?? "") || null;
  const planned_hours = Math.max(0, Number(formData.get("planned_hours") ?? 0) || 0);
  const target_test_date = String(formData.get("target_test_date") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("lesson_progress").insert({
    user_id: user.id,
    subject_id,
    class_id,
    unit_name,
    planned_hours,
    completed_hours: 0,
    target_test_date,
    notes,
  });
  logSupabaseError("lessonProgress.create", error);

  revalidatePath("/lesson-progress");
  revalidatePath("/dashboard");
}

export async function updateCompletedHours(progressId: string, completedHours: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("lesson_progress")
    .update({ completed_hours: Math.max(0, completedHours || 0), updated_at: new Date().toISOString() })
    .eq("id", progressId);
  logSupabaseError("lessonProgress.updateCompletedHours", error);

  revalidatePath("/lesson-progress");
  revalidatePath("/dashboard");
}

export async function deleteLessonProgress(progressId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("lesson_progress")
    .delete()
    .eq("id", progressId);
  logSupabaseError("lessonProgress.delete", error);

  revalidatePath("/lesson-progress");
  revalidatePath("/dashboard");
}
