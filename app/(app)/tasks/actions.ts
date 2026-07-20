"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date,
    priority,
    status: "open",
    source: "manual",
  });

  revalidatePath("/tasks");
}

export async function toggleTask(taskId: string, done: boolean) {
  const supabase = createClient();
  await supabase
    .from("tasks")
    .update({ status: done ? "done" : "open" })
    .eq("id", taskId);

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/tasks");
}
