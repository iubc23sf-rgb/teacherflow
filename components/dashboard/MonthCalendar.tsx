"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { getDragPayload } from "@/lib/dnd";
import { updateTaskDueDate } from "@/app/(app)/tasks/actions";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function formatDateParam(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DateBadge = { id: string; title: string; colorClass: string };

export default function MonthCalendar({
  weeks,
  monthDate,
  monthLabel,
  prevHref,
  nextHref,
  todayKey,
  eventsByDate,
}: {
  weeks: Date[][];
  monthDate: Date;
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  todayKey: string;
  eventsByDate: Record<string, DateBadge[]>;
}) {
  const [, startTransition] = useTransition();
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

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

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-2">
        {weeks.map((week) =>
          week.map((d) => {
            const isCurrentMonth = d.getMonth() === monthDate.getMonth();
            const isToday = d.toDateString() === todayKey;
            const badges = eventsByDate[d.toDateString()] ?? [];
            const dateKey = formatDateParam(d);
            const isDragOver = dragOverDate === dateKey;

            return (
              <div
                key={d.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverDate(dateKey)}
                onDragLeave={() =>
                  setDragOverDate((k) => (k === dateKey ? null : k))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDate(null);
                  const payload = getDragPayload(e);
                  if (payload?.source === "task") {
                    startTransition(() => updateTaskDueDate(payload.taskId, dateKey));
                  }
                }}
                className={`min-h-[100px] rounded-md border p-1.5 transition ${
                  isToday ? "border-brand-300 bg-brand-50" : "border-gray-100"
                } ${isDragOver ? "ring-2 ring-orange-400" : ""}`}
              >
                <p
                  className={`text-xs ${
                    isToday
                      ? "font-semibold text-brand-700"
                      : isCurrentMonth
                        ? "text-gray-600"
                        : "text-gray-300"
                  }`}
                >
                  {d.getDate()}
                </p>
                {isCurrentMonth && badges.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {badges.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className={`truncate rounded px-1 py-0.5 text-[10px] ${b.colorClass}`}
                        title={b.title}
                      >
                        {b.title}
                      </div>
                    ))}
                    {badges.length > 3 && (
                      <p className="text-[10px] text-gray-400">
                        他{badges.length - 3}件
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-100" />
          タスク期限
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-100" />
          面談
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-100" />
          部活
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-200" />
          校務分掌
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-100" />
          学校行事
        </span>
      </div>
    </section>
  );
}
