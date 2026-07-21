import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import { getOrCreateTimetableId } from "@/lib/supabase/timetables";
import { dayOfWeekFromDate } from "@/lib/dayOfWeek";
import DaySwapPanel from "@/components/timetable/DaySwapPanel";
import SpecialDayEditor from "@/components/timetable/SpecialDayEditor";

export const dynamic = "force-dynamic";

export default async function SpecialDayPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const date =
    searchParams.date ?? new Date().toISOString().slice(0, 10);

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
    { data: personalSlots, error: personalSlotsError },
    { data: homeroomSlots, error: homeroomSlotsError },
    { data: subjects, error: subjectsError },
    { data: classes, error: classesError },
    { data: overrides, error: overridesError },
  ] = await Promise.all([
    supabase
      .from("timetable_slots")
      .select("*, subjects(name, color), classes(name)")
      .eq("timetable_id", personalTimetableId),
    supabase
      .from("timetable_slots")
      .select("*, subjects(name, color), classes(name)")
      .eq("timetable_id", homeroomTimetableId),
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
    supabase
      .from("timetable_overrides")
      .select("*")
      .in("timetable_id", [personalTimetableId, homeroomTimetableId])
      .eq("override_date", date),
  ]);
  logSupabaseError("timetable.special.personalSlots", personalSlotsError);
  logSupabaseError("timetable.special.homeroomSlots", homeroomSlotsError);
  logSupabaseError("timetable.special.subjects", subjectsError);
  logSupabaseError("timetable.special.classes", classesError);
  logSupabaseError("timetable.special.overrides", overridesError);

  const dayOfWeek = dayOfWeekFromDate(date);
  const personalOverrides = (overrides ?? []).filter(
    (o: any) => o.timetable_id === personalTimetableId
  );
  const homeroomOverrides = (overrides ?? []).filter(
    (o: any) => o.timetable_id === homeroomTimetableId
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{date} の特別時間割</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ダッシュボードに戻る
        </Link>
      </div>

      <DaySwapPanel
        date={date}
        timetableIds={[personalTimetableId, homeroomTimetableId]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">
            自分の授業
          </h2>
          <SpecialDayEditor
            timetableId={personalTimetableId}
            date={date}
            dayOfWeek={dayOfWeek}
            allSlots={(personalSlots ?? []) as any}
            overridesForDate={personalOverrides as any}
            subjects={subjects ?? []}
            classes={classes ?? []}
            backHref="/timetable"
          />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">
            担任クラスの授業
          </h2>
          <SpecialDayEditor
            timetableId={homeroomTimetableId}
            date={date}
            dayOfWeek={dayOfWeek}
            allSlots={(homeroomSlots ?? []) as any}
            overridesForDate={homeroomOverrides as any}
            subjects={subjects ?? []}
            classes={classes ?? []}
            backHref="/timetable"
          />
        </div>
      </div>
    </div>
  );
}
