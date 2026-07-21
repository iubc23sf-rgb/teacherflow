"use client";

import Link from "next/link";
import { useState, useTransition, type DragEvent } from "react";
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

function WeekRow({
  title,
  weekDates,
  slotsByDay,
  todayKey,
  badgeClass,
  dragOverDate,
  onDragEnterDate,
  onDragLeaveDate,
  onDropDate,
}: {
  title: string;
  weekDates: Date[];
  slotsByDay: Record<number, SlotBadge[]>;
  todayKey: string;
  badgeClass: string;
  dragOverDate: string | null;
  onDragEnterDate: (dateKey: string) => void;
  onDragLeaveDate: (dateKey: string) => void;
  onDropDate: (dateKey: string, e: DragEvent) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-500">{title}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {weekDates.map((d, dayOfWeek) => {
          const isToday = d.toDateString() === todayKey;
          const badges = slotsByDay[dayOfWeek] ?? [];
          const dateKey = formatDateParam(d);
          const isDragOver = dragOverDate === dateKey;

          return (
            <Link
              key={d.toISOString()}
              href={`/timetable/special?date=${dateKey}`}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => onDragEnterDate(dateKey)}
              onDragLeave={() => onDragLeaveDate(dateKey)}
              onDrop={(e) => {
                e.preventDefault();
                onDropDate(dateKey, e);
              }}
              className={`block min-h-[80px] rounded-md border p-1.5 transition hover:border-brand-300 hover:bg-brand-50/40 ${
                isToday
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                  : "border-gray-100"
              } ${isDragOver ? "ring-2 ring-orange-400" : ""}`}
            >
              <p
                className={`mb-1 text-center text-[10px] ${
                  isToday ? "font-semibold text-brand-700" : "text-gray-400"
                }`}
              >
                {WEEKDAY_LABELS[dayOfWeek]} {d.getDate()}
              </p>
              <div className="space-y-1">
                {badges.map((s) => (
                  <div
                    key={s.id}
                    className={`truncate rounded px-1.5 py-1 text-[10px] font-medium ${badgeClass}`}
                    title={s.name}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
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

  const handleDrop = (dateKey: string, e: DragEvent) => {
    setDragOverDate(null);
    const payload = getDragPayload(e);
    if (payload?.source === "task") {
      startTransition(() => updateTaskDueDate(payload.taskId, dateKey));
    }
  };

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

      <div className="space-y-3">
        <WeekRow
          title="自分の授業"
          weekDates={weekDates}
          slotsByDay={personalSlotsByDay}
          todayKey={todayKey}
          badgeClass="bg-brand-100 text-brand-700"
          dragOverDate={dragOverDate}
          onDragEnterDate={setDragOverDate}
          onDragLeaveDate={(dateKey) =>
            setDragOverDate((k) => (k === dateKey ? null : k))
          }
          onDropDate={handleDrop}
        />
        <WeekRow
          title="担任クラスの授業"
          weekDates={weekDates}
          slotsByDay={homeroomSlotsByDay}
          todayKey={todayKey}
          badgeClass="bg-purple-100 text-purple-700"
          dragOverDate={dragOverDate}
          onDragEnterDate={setDragOverDate}
          onDragLeaveDate={(dateKey) =>
            setDragOverDate((k) => (k === dateKey ? null : k))
          }
          onDropDate={handleDrop}
        />
      </div>
    </section>
  );
}
