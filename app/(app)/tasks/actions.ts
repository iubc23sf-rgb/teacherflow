"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function createTask(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const due_date = String(formData.get("due_date") ?? "") || null;
  const priority = Number(formData.get("priority") ?? 2);

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date,
    priority,
    status: "open",
    source: "manual",
  });
  logSupabaseError("tasks.createTask", error);

  revalidatePath("/tasks");
}

export async function toggleTask(taskId: string, done: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: done ? "done" : "open" })
    .eq("id", taskId);
  logSupabaseError("tasks.toggleTask", error);

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  logSupabaseError("tasks.deleteTask", error);
  revalidatePath("/tasks");
}
