import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default async function TimetablePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: timetable } = await supabase
    .from("timetables")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  const { data: slots } = timetable
    ? await supabase
        .from("timetable_slots")
        .select("*, subjects(name, color), classes(name)")
        .eq("timetable_id", timetable.id)
    : { data: [] as any[] };

  const slotMap = new Map<string, any>();
  (slots ?? []).forEach((slot: any) => {
    slotMap.set(`${slot.day_of_week}-${slot.period}`, slot);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">時間割</h1>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-16 px-3 py-2 text-left text-xs text-gray-400">
                時限
              </th>
              {DAYS.map((day) => (
                <th key={day} className="px-3 py-2 text-center font-medium">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-3 text-xs text-gray-400">{period}</td>
                {DAYS.map((_, dayIndex) => {
                  const slot = slotMap.get(`${dayIndex}-${period}`);
                  return (
                    <td key={dayIndex} className="px-2 py-2 text-center">
                      {slot ? (
                        <div className="rounded-md bg-brand-50 px-2 py-1.5">
                          <p className="text-xs font-medium text-brand-700">
                            {slot.subjects?.name ?? "-"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {slot.classes?.name ?? ""} {slot.room ?? ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-200">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        時間割データが空の場合は Supabase の timetables / timetable_slots
        テーブルにレコードを登録してください（Phase2 で編集UIを追加予定）。
      </p>
    </div>
  );
}
