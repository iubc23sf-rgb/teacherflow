import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import { getOrCreateTimetableId } from "@/lib/supabase/timetables";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import SubjectClassManager from "@/components/timetable/SubjectClassManager";
import AutoGenerateButton from "@/components/timetable/AutoGenerateButton";

export const dynamic = "force-dynamic";

export default async function TimetablePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [personalTimetableId, homeroomTimetableId] = await Promise.all([
    getOrCreateTimetableId(supabase, userId, "personal"),
    getOrCreateTimetableId(supabase, userId, "homeroom"),
  ]);

  const [
    { data: slots, error: slotsError },
    { data: subjects, error: subjectsError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    supabase
      .from("timetable_slots")
      .select("*, subjects(name, color), classes(name)")
      .in("timetable_id", [personalTimetableId, homeroomTimetableId]),
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
  logSupabaseError("timetable.slots", slotsError);
  logSupabaseError("timetable.subjects", subjectsError);
  logSupabaseError("timetable.classes", classesError);

  const personalSlots = (slots ?? []).filter(
    (s: any) => s.timetable_id === personalTimetableId
  );
  const homeroomSlots = (slots ?? []).filter(
    (s: any) => s.timetable_id === homeroomTimetableId
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">時間割</h1>

      <SubjectClassManager subjects={subjects ?? []} classes={classes ?? []} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">自分の時間割</h2>
          <AutoGenerateButton timetableId={personalTimetableId} />
        </div>
        <TimetableGrid
          timetableId={personalTimetableId}
          slots={personalSlots as any}
          subjects={subjects ?? []}
          classes={classes ?? []}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            担任クラスの時間割
          </h2>
          <AutoGenerateButton timetableId={homeroomTimetableId} />
        </div>
        <TimetableGrid
          timetableId={homeroomTimetableId}
          slots={homeroomSlots as any}
          subjects={subjects ?? []}
          classes={classes ?? []}
        />
      </section>
    </div>
  );
}
