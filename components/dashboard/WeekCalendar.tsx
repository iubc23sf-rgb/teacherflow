"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { getDragPayload } from "@/lib/dnd";
import { updateTaskDueDate } from "@/app/(app)/tasks/actions";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金"];

type SlotBadge = { id: string; name: string };

function formatDateParam(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeekCalendar({
  weekDates,
  personalSlotsByDay,
  homeroomSlotsByDay,
  todayKey,
  prevHref,
  nextHref,
}: {
  weekDates: Date[];
  personalSlotsByDay: Record<number, SlotBadge[]>;
  homeroomSlotsByDay: Record<number, SlotBadge[]>;
  todayKey: string;
  prevHref: string;
  nextHref: string;
}) {
  const weekLabel = `${weekDates[0].getFullYear()}年${
    weekDates[0].getMonth() + 1
  }月${weekDates[0].getDate()}日 〜 ${weekDates[4].getMonth() + 1}月${weekDates[4].getDate()}日`;

  const [, startTransition] = useTransition();
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={prevHref}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
        >
          ← 前週
        </Link>
        <h2 className="text-sm font-semibold text-gray-700">
          今週の授業（{weekLabel}）
        </h2>
        <Link
          href={nextHref}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
        >
          翌週 →
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
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

      <div className="mt-1.5 grid grid-cols-5 gap-1.5">
        {weekDates.map((d, dayOfWeek) => {
          const isToday = d.toDateString() === todayKey;
          const personal = personalSlotsByDay[dayOfWeek] ?? [];
          const homeroom = homeroomSlotsByDay[dayOfWeek] ?? [];
          const dateKey = formatDateParam(d);
          const isDragOver = dragOverDate === dateKey;

          return (
            <Link
              key={d.toISOString()}
              href={`/timetable/special?date=${dateKey}`}
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
              className={`block min-h-[110px] rounded-md border p-1.5 transition hover:border-brand-300 hover:bg-brand-50/40 ${
                isToday
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                  : "border-gray-100"
              } ${isDragOver ? "ring-2 ring-orange-400" : ""}`}
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
            </Link>
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
