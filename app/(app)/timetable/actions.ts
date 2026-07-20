"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSubject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const color = String(formData.get("color") ?? "#3B82F6");

  await supabase.from("subjects").insert({ user_id: user.id, name, color });
  revalidatePath("/timetable");
}

export async function deleteSubject(subjectId: string) {
  const supabase = createClient();
  await supabase.from("subjects").delete().eq("id", subjectId);
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

  await supabase.from("classes").insert({ user_id: user.id, name, grade });
  revalidatePath("/timetable");
}

export async function deleteClassGroup(classId: string) {
  const supabase = createClient();
  await supabase.from("classes").delete().eq("id", classId);
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

  const { data: existing } = await supabase
    .from("timetable_slots")
    .select("id")
    .eq("timetable_id", timetableId)
    .eq("day_of_week", dayOfWeek)
    .eq("period", period)
    .maybeSingle();

  if (!subjectId) {
    if (existing) {
      await supabase.from("timetable_slots").delete().eq("id", existing.id);
    }
    revalidatePath("/timetable");
    return;
  }

  if (existing) {
    await supabase
      .from("timetable_slots")
      .update({ subject_id: subjectId, class_id: classId, room })
      .eq("id", existing.id);
  } else {
    await supabase.from("timetable_slots").insert({
      timetable_id: timetableId,
      day_of_week: dayOfWeek,
      period,
      subject_id: subjectId,
      class_id: classId,
      room,
    });
  }

  revalidatePath("/timetable");
}
