import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import { getOrCreateTimetableId, type TimetableKind } from "@/lib/supabase/timetables";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import SubjectClassManager from "@/components/timetable/SubjectClassManager";

export const dynamic = "force-dynamic";

const KIND_TABS: { key: TimetableKind; label: string }[] = [
  { key: "personal", label: "自分の時間割" },
  { key: "homeroom", label: "担任クラスの時間割" },
];

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: { kind?: string };
}) {
  const kind: TimetableKind =
    searchParams.kind === "homeroom" ? "homeroom" : "personal";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const timetableId = await getOrCreateTimetableId(supabase, userId, kind);

  const [
    { data: slots, error: slotsError },
    { data: subjects, error: subjectsError },
    { data: classes, error: classesError },
  ] = await Promise.all([
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
  logSupabaseError("timetable.slots", slotsError);
  logSupabaseError("timetable.subjects", subjectsError);
  logSupabaseError("timetable.classes", classesError);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">時間割</h1>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
          {KIND_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/timetable?kind=${tab.key}`}
              className={`rounded-md px-3 py-1.5 ${
                kind === tab.key
                  ? "bg-white font-medium shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

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
