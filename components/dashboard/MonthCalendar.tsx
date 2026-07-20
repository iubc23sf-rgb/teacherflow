import Link from "next/link";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

type SlotBadge = { id: string; name: string };

export default function MonthCalendar({
  weeks,
  monthDate,
  personalSlotsByDay,
  homeroomSlotsByDay,
  monthLabel,
  prevHref,
  nextHref,
  todayKey,
}: {
  weeks: Date[][];
  monthDate: Date;
  personalSlotsByDay: Record<number, SlotBadge[]>;
  homeroomSlotsByDay: Record<number, SlotBadge[]>;
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  todayKey: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={prevHref}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
        >
          ← 前月
        </Link>
        <h2 className="text-sm font-semibold text-gray-700">{monthLabel}</h2>
        <Link
          href={nextHref}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
        >
          翌月 →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.map((week) =>
          week.map((d) => {
            const isCurrentMonth = d.getMonth() === monthDate.getMonth();
            const isToday = d.toDateString() === todayKey;
            const dayOfWeek = (d.getDay() + 6) % 7;
            const personal = personalSlotsByDay[dayOfWeek] ?? [];
            const homeroom = homeroomSlotsByDay[dayOfWeek] ?? [];

            return (
              <div
                key={d.toISOString()}
                className={`min-h-[72px] rounded-md border p-1 ${
                  isToday
                    ? "border-brand-300 bg-brand-50"
                    : "border-gray-100"
                }`}
              >
                <p
                  className={`text-[11px] ${
                    isCurrentMonth ? "text-gray-600" : "text-gray-300"
                  }`}
                >
                  {d.getDate()}
                </p>
                {isCurrentMonth && (
                  <div className="mt-0.5 space-y-0.5">
                    {personal.slice(0, 2).map((s) => (
                      <div
                        key={`p-${s.id}`}
                        className="truncate rounded bg-brand-100 px-1 py-0.5 text-[9px] text-brand-700"
                        title={`自分：${s.name}`}
                      >
                        {s.name}
                      </div>
                    ))}
                    {homeroom.slice(0, 1).map((s) => (
                      <div
                        key={`h-${s.id}`}
                        className="truncate rounded bg-purple-100 px-1 py-0.5 text-[9px] text-purple-700"
                        title={`担任クラス：${s.name}`}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
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
