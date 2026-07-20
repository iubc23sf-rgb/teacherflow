"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function createSchoolEvent(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = String(formData.get("title") ?? "").trim();
  const event_date = String(formData.get("event_date") ?? "");
  if (!title || !event_date) return;

  const category = String(formData.get("category") ?? "other");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("school_events").insert({
    user_id: user.id,
    title,
    event_date,
    category,
    notes,
  });
  logSupabaseError("events.createSchoolEvent", error);

  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function deleteSchoolEvent(eventId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("school_events")
    .delete()
    .eq("id", eventId);
  logSupabaseError("events.deleteSchoolEvent", error);

  revalidatePath("/events");
  revalidatePath("/dashboard");
}
