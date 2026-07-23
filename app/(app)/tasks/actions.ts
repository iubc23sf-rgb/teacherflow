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
  revalidatePath("/dashboard");
}

export async function updateTaskDueDate(taskId: string, dueDate: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: dueDate, time_slot: null })
    .eq("id", taskId);
  logSupabaseError("tasks.updateTaskDueDate", error);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export type TaskTimeSlot = "morning" | "noon" | "afterschool";

export async function scheduleTaskToTimeSlot(
  taskId: string,
  dueDate: string,
  timeSlot: TaskTimeSlot
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: dueDate, time_slot: timeSlot })
    .eq("id", taskId);
  logSupabaseError("tasks.scheduleTaskToTimeSlot", error);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function quickAddTask({
  title,
  dueDate,
  timeSlot,
}: {
  title: string;
  dueDate: string;
  timeSlot: TaskTimeSlot | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const trimmed = title.trim();
  if (!trimmed) return;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: trimmed,
    due_date: dueDate,
    time_slot: timeSlot,
    priority: 2,
    status: "open",
    source: "manual",
  });
  logSupabaseError("tasks.quickAddTask", error);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  logSupabaseError("tasks.deleteTask", error);
  revalidatePath("/tasks");
}
