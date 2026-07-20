import { logSupabaseError } from "@/lib/supabase/logError";

export type TimetableKind = "personal" | "homeroom";

const TIMETABLE_NAMES: Record<TimetableKind, string> = {
  personal: "自分の時間割",
  homeroom: "担任クラスの時間割",
};

export async function getOrCreateTimetableId(
  supabase: any,
  userId: string,
  kind: TimetableKind
) {
  const { data: existing, error: selectError } = await supabase
    .from("timetables")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .limit(1)
    .maybeSingle();
  logSupabaseError(`timetables.select.${kind}`, selectError);
  if (existing) return existing.id as string;

  const { data: created, error: insertError } = await supabase
    .from("timetables")
    .insert({ user_id: userId, kind, name: TIMETABLE_NAMES[kind] })
    .select("id")
    .single();
  logSupabaseError(`timetables.create.${kind}`, insertError);
  return created?.id as string;
}
