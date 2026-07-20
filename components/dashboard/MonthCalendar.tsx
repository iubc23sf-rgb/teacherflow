import Link from "next/link";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export default function MonthCalendar({
  weeks,
  monthDate,
  monthLabel,
  prevHref,
  nextHref,
  todayKey,
}: {
  weeks: Date[][];
  monthDate: Date;
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

            return (
              <div
                key={d.toISOString()}
                className={`flex h-10 items-center justify-center rounded-md border text-sm ${
                  isToday
                    ? "border-brand-300 bg-brand-50 font-semibold text-brand-700"
                    : "border-gray-100"
                } ${isCurrentMonth ? "text-gray-600" : "text-gray-300"}`}
              >
                {d.getDate()}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
