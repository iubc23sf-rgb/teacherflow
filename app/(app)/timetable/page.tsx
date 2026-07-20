import { createClient } from "@/lib/supabase/server";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import SubjectClassManager from "@/components/timetable/SubjectClassManager";

export const dynamic = "force-dynamic";

async function getOrCreateTimetableId(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: existing } = await supabase
    .from("timetables")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created } = await supabase
    .from("timetables")
    .insert({ user_id: userId, name: "通常時間割" })
    .select("id")
    .single();
  return created?.id as string;
}

export default async function TimetablePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const timetableId = await getOrCreateTimetableId(supabase, userId);

  const [{ data: slots }, { data: subjects }, { data: classes }] =
    await Promise.all([
      supabase
        .from("timetable_slots")
        .select("*, subjects(name, color), classes(name)")
        .eq("timetable_id", timetableId),
      supabase
        .from("subjects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("classes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">時間割</h1>

      <SubjectClassManager subjects={subjects ?? []} classes={classes ?? []} />

      <TimetableGrid
        timetableId={timetableId}
        slots={(slots ?? []) as any}
        subjects={subjects ?? []}
        classes={classes ?? []}
      />
    </div>
  );
}
