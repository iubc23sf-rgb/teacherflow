const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

type SlotBadge = { id: string; name: string };

export default function WeekCalendar({
  weekDates,
  personalSlotsByDay,
  homeroomSlotsByDay,
  todayKey,
}: {
  weekDates: Date[];
  personalSlotsByDay: Record<number, SlotBadge[]>;
  homeroomSlotsByDay: Record<number, SlotBadge[]>;
  todayKey: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        今週の授業（週表示）
      </h2>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {WEEKDAY_LABELS.map((label, i) => {
          const isToday = weekDates[i].toDateString() === todayKey;
          return (
            <div key={label} className="py-1">
              {isToday ? (
                <div className="mx-auto flex w-fit flex-col items-center rounded-md bg-brand-600 px-2 py-0.5 text-white">
                  <p className="text-[10px] leading-tight">{label}</p>
                  <p className="font-mono text-sm font-semibold leading-tight">
                    {weekDates[i].getDate()}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-400">{label}</p>
                  <p className="font-mono text-gray-600">
                    {weekDates[i].getDate()}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {weekDates.map((d, dayOfWeek) => {
          const isToday = d.toDateString() === todayKey;
          const personal = personalSlotsByDay[dayOfWeek] ?? [];
          const homeroom = homeroomSlotsByDay[dayOfWeek] ?? [];

          return (
            <div
              key={d.toISOString()}
              className={`min-h-[110px] rounded-md border p-1.5 ${
                isToday
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                  : "border-gray-100"
              }`}
            >
              <div className="space-y-1">
                {personal.map((s) => (
                  <div
                    key={`p-${s.id}`}
                    className="truncate rounded bg-brand-100 px-1.5 py-1 text-[10px] font-medium text-brand-700"
                    title={`自分：${s.name}`}
                  >
                    {s.name}
                  </div>
                ))}
                {homeroom.map((s) => (
                  <div
                    key={`h-${s.id}`}
                    className="truncate rounded bg-purple-100 px-1.5 py-1 text-[10px] font-medium text-purple-700"
                    title={`担任クラス：${s.name}`}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-brand-100" />
          自分の時間割
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-100" />
          担任クラスの時間割
        </span>
      </div>
    </section>
  );
}
