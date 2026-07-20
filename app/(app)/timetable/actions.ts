"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export async function createSubject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const color = String(formData.get("color") ?? "#3B82F6");

  const { error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, name, color });
  logSupabaseError("timetable.createSubject", error);
  revalidatePath("/timetable");
}

export async function deleteSubject(subjectId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  logSupabaseError("timetable.deleteSubject", error);
  revalidatePath("/timetable");
}

export async function createClassGroup(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const grade = String(formData.get("grade") ?? "").trim() || null;

  const { error } = await supabase
    .from("classes")
    .insert({ user_id: user.id, name, grade });
  logSupabaseError("timetable.createClassGroup", error);
  revalidatePath("/timetable");
}

export async function deleteClassGroup(classId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  logSupabaseError("timetable.deleteClassGroup", error);
  revalidatePath("/timetable");
}

export async function saveSlot({
  timetableId,
  dayOfWeek,
  period,
  subjectId,
  classId,
  room,
}: {
  timetableId: string;
  dayOfWeek: number;
  period: number;
  subjectId: string | null;
  classId: string | null;
  room: string | null;
}) {
  const supabase = createClient();

  const { data: existing, error: selectError } = await supabase
    .from("timetable_slots")
    .select("id")
    .eq("timetable_id", timetableId)
    .eq("day_of_week", dayOfWeek)
    .eq("period", period)
    .maybeSingle();
  logSupabaseError("timetable.saveSlot.select", selectError);

  if (!subjectId) {
    if (existing) {
      const { error } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("id", existing.id);
      logSupabaseError("timetable.saveSlot.delete", error);
    }
    revalidatePath("/timetable");
    return;
  }

  if (existing) {
    const { error } = await supabase
      .from("timetable_slots")
      .update({ subject_id: subjectId, class_id: classId, room })
      .eq("id", existing.id);
    logSupabaseError("timetable.saveSlot.update", error);
  } else {
    const { error } = await supabase.from("timetable_slots").insert({
      timetable_id: timetableId,
      day_of_week: dayOfWeek,
      period,
      subject_id: subjectId,
      class_id: classId,
      room,
    });
    logSupabaseError("timetable.saveSlot.insert", error);
  }

  revalidatePath("/timetable");
}
