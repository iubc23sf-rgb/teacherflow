"use client";

import Link from "next/link";
import { Fragment, useState, useTransition, type DragEvent } from "react";
import { getDragPayload, setDragPayload } from "@/lib/dnd";
import {
  updateTaskDueDate,
  scheduleTaskToTimeSlot,
  toggleTask,
  quickAddTask,
  type TaskTimeSlot,
} from "@/app/(app)/tasks/actions";
import { updateInterviewDate } from "@/app/(app)/interviews/actions";
import { updateEventDate } from "@/app/(app)/events/actions";
import { updateTargetTestDate } from "@/app/(app)/lesson-progress/actions";
import { saveOverride } from "@/app/(app)/timetable/actions";
import { BELL_SCHEDULE } from "@/lib/bellSchedule";

const TASK_LANE_LABEL: Record<TaskTimeSlot, string> = {
  morning: "朝",
  noon: "昼",
  afterschool: "放課後",
};

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金"];

const EVENT_CATEGORY_STYLE: Record<string, string> = {
  club: "bg-orange-100 text-orange-700",
  duty: "bg-slate-200 text-slate-700",
  event: "bg-green-100 text-green-700",
  other: "bg-gray-200 text-gray-600",
};

type LessonEntry = {
  id: string;
  subjectId: string | null;
  customLabel: string | null;
  name: string;
  classId: string | null;
  room: string | null;
};

type TaskChip = { id: string; title: string; priority: number };
type InterviewChip = { id: string; student_name: string };
type EventChip = { id: string; title: string; category: string };
type LessonProgressChip = { id: string; unit_name: string };
type TaskLaneChip = { id: string; title: string; status: string };
type TaskLanes = { morning: TaskLaneChip[]; noon: TaskLaneChip[]; afterschool: TaskLaneChip[] };

type QuickAddState = {
  key: string | null;
  title: string;
  open: (key: string) => void;
  cancel: () => void;
  setTitle: (title: string) => void;
  submit: (dueDate: string, timeSlot: TaskTimeSlot | null) => void;
};

function formatDateParam(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeekCalendar({
  weekDates,
  todayKey,
  prevHref,
  nextHref,
  personalTimetableId,
  homeroomTimetableId,
  personalSlotsByDay,
  homeroomSlotsByDay,
  tasksByDay,
  interviewsByDay,
  eventsByDay,
  lessonProgressByDay,
  taskLanesByDay,
}: {
  weekDates: Date[];
  todayKey: string;
  prevHref: string;
  nextHref: string;
  personalTimetableId: string;
  homeroomTimetableId: string;
  personalSlotsByDay: Record<number, Record<number, LessonEntry | null>>;
  homeroomSlotsByDay: Record<number, Record<number, LessonEntry | null>>;
  tasksByDay: Record<number, TaskChip[]>;
  interviewsByDay: Record<number, InterviewChip[]>;
  eventsByDay: Record<number, EventChip[]>;
  lessonProgressByDay: Record<number, LessonProgressChip[]>;
  taskLanesByDay: Record<number, TaskLanes>;
}) {
  const weekLabel = `${weekDates[0].getFullYear()}年${
    weekDates[0].getMonth() + 1
  }月${weekDates[0].getDate()}日 〜 ${weekDates[4].getMonth() + 1}月${weekDates[4].getDate()}日`;

  const [, startTransition] = useTransition();
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addingTitle, setAddingTitle] = useState("");

  const quickAdd: QuickAddState = {
    key: addingKey,
    title: addingTitle,
    open: (key) => {
      setAddingKey(key);
      setAddingTitle("");
    },
    cancel: () => {
      setAddingKey(null);
      setAddingTitle("");
    },
    setTitle: setAddingTitle,
    submit: (dueDate, timeSlot) => {
      const title = addingTitle.trim();
      setAddingKey(null);
      setAddingTitle("");
      if (!title) return;
      startTransition(() => quickAddTask({ title, dueDate, timeSlot }));
    },
  };

  const handleAllDayDrop = (dayIndex: number, e: DragEvent) => {
    e.preventDefault();
    setDragOverKey(null);
    const payload = getDragPayload(e);
    if (!payload) return;
    const dateKey = formatDateParam(weekDates[dayIndex]);
    if (payload.source === "task") {
      startTransition(() => updateTaskDueDate(payload.taskId, dateKey));
    } else if (payload.source === "interview") {
      startTransition(() => updateInterviewDate(payload.interviewId, dateKey));
    } else if (payload.source === "event") {
      startTransition(() => updateEventDate(payload.eventId, dateKey));
    } else if (payload.source === "lessonProgress") {
      startTransition(() => updateTargetTestDate(payload.progressId, dateKey));
    }
  };

  const handleLessonDrop = (
    kind: "personal" | "homeroom",
    targetDayIndex: number,
    targetPeriod: number,
    e: DragEvent
  ) => {
    e.preventDefault();
    setDragOverKey(null);
    const payload = getDragPayload(e);
    if (!payload || payload.source !== "weekLesson" || payload.kind !== kind) return;

    const sourceDayIndex = weekDates.findIndex(
      (d) => formatDateParam(d) === payload.date
    );
    if (sourceDayIndex === -1) return;
    if (sourceDayIndex === targetDayIndex && payload.period === targetPeriod) return;

    const byDay = kind === "personal" ? personalSlotsByDay : homeroomSlotsByDay;
    const sourceEntry = byDay[sourceDayIndex]?.[payload.period] ?? null;
    const targetEntry = byDay[targetDayIndex]?.[targetPeriod] ?? null;
    const timetableId = kind === "personal" ? personalTimetableId : homeroomTimetableId;

    startTransition(async () => {
      await saveOverride({
        timetableId,
        overrideDate: formatDateParam(weekDates[targetDayIndex]),
        period: targetPeriod,
        subjectId: sourceEntry?.subjectId ?? null,
        customLabel: sourceEntry?.customLabel ?? null,
        classId: sourceEntry?.classId ?? null,
        room: sourceEntry?.room ?? null,
      });
      await saveOverride({
        timetableId,
        overrideDate: payload.date,
        period: payload.period,
        subjectId: targetEntry?.subjectId ?? null,
        customLabel: targetEntry?.customLabel ?? null,
        classId: targetEntry?.classId ?? null,
        room: targetEntry?.room ?? null,
      });
    });
  };

  const handleLaneDrop = (dayIndex: number, lane: TaskTimeSlot, e: DragEvent) => {
    e.preventDefault();
    setDragOverKey(null);
    const payload = getDragPayload(e);
    if (!payload || payload.source !== "task") return;
    const dateKey = formatDateParam(weekDates[dayIndex]);
    startTransition(() => scheduleTaskToTimeSlot(payload.taskId, dateKey, lane));
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
          今週の予定（{weekLabel}）
        </h2>
        <Link
          href={nextHref}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
        >
          翌週 →
        </Link>
      </div>

      {/* 終日：タスク・面談・行事・テスト予定 */}
      <div className="grid grid-cols-5 gap-1.5">
        {weekDates.map((d, dayIndex) => {
          const isToday = d.toDateString() === todayKey;
          const cellKey = `allday-${dayIndex}`;
          const isDragOver = dragOverKey === cellKey;
          const tasks = tasksByDay[dayIndex] ?? [];
          const interviews = interviewsByDay[dayIndex] ?? [];
          const events = eventsByDay[dayIndex] ?? [];
          const testDates = lessonProgressByDay[dayIndex] ?? [];

          return (
            <div
              key={cellKey}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverKey(cellKey)}
              onDragLeave={() =>
                setDragOverKey((k) => (k === cellKey ? null : k))
              }
              onDrop={(e) => handleAllDayDrop(dayIndex, e)}
              className={`min-h-[64px] rounded-md border p-1.5 transition ${
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
                {WEEKDAY_LABELS[dayIndex]} {d.getDate()}
              </p>
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div
                    key={`task-${t.id}`}
                    draggable
                    onDragStart={(e) => setDragPayload(e, { source: "task", taskId: t.id })}
                    className="cursor-grab truncate rounded bg-amber-100 px-1.5 py-1 text-[10px] font-medium text-amber-700 active:cursor-grabbing"
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
                {interviews.map((iv) => (
                  <div
                    key={`iv-${iv.id}`}
                    draggable
                    onDragStart={(e) =>
                      setDragPayload(e, { source: "interview", interviewId: iv.id })
                    }
                    className="cursor-grab truncate rounded bg-purple-100 px-1.5 py-1 text-[10px] font-medium text-purple-700 active:cursor-grabbing"
                    title={`面談：${iv.student_name}`}
                  >
                    面談：{iv.student_name}
                  </div>
                ))}
                {events.map((ev) => (
                  <div
                    key={`ev-${ev.id}`}
                    draggable
                    onDragStart={(e) => setDragPayload(e, { source: "event", eventId: ev.id })}
                    className={`cursor-grab truncate rounded px-1.5 py-1 text-[10px] font-medium active:cursor-grabbing ${
                      EVENT_CATEGORY_STYLE[ev.category] ?? EVENT_CATEGORY_STYLE.other
                    }`}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
                {testDates.map((lp) => (
                  <div
                    key={`lp-${lp.id}`}
                    draggable
                    onDragStart={(e) =>
                      setDragPayload(e, { source: "lessonProgress", progressId: lp.id })
                    }
                    className="cursor-grab truncate rounded bg-blue-100 px-1.5 py-1 text-[10px] font-medium text-blue-700 active:cursor-grabbing"
                    title={`テスト：${lp.unit_name}`}
                  >
                    テスト：{lp.unit_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <LessonTimeGrid
        title="自分の授業"
        kind="personal"
        weekDates={weekDates}
        todayKey={todayKey}
        slotsByDay={personalSlotsByDay}
        badgeClass="bg-brand-100 text-brand-700"
        dragOverKey={dragOverKey}
        setDragOverKey={setDragOverKey}
        onDrop={handleLessonDrop}
        taskLanesByDay={taskLanesByDay}
        onLaneDrop={handleLaneDrop}
        onToggleTask={(taskId, done) => startTransition(() => toggleTask(taskId, done))}
        quickAdd={quickAdd}
      />
      <LessonTimeGrid
        title="担任クラスの授業"
        kind="homeroom"
        weekDates={weekDates}
        todayKey={todayKey}
        slotsByDay={homeroomSlotsByDay}
        badgeClass="bg-purple-100 text-purple-700"
        dragOverKey={dragOverKey}
        setDragOverKey={setDragOverKey}
        onDrop={handleLessonDrop}
      />
    </section>
  );
}

function LessonTimeGrid({
  title,
  kind,
  weekDates,
  todayKey,
  slotsByDay,
  badgeClass,
  dragOverKey,
  setDragOverKey,
  onDrop,
  taskLanesByDay,
  onLaneDrop,
  onToggleTask,
  quickAdd,
}: {
  title: string;
  kind: "personal" | "homeroom";
  weekDates: Date[];
  todayKey: string;
  slotsByDay: Record<number, Record<number, LessonEntry | null>>;
  badgeClass: string;
  dragOverKey: string | null;
  setDragOverKey: (updater: string | null | ((k: string | null) => string | null)) => void;
  onDrop: (
    kind: "personal" | "homeroom",
    dayIndex: number,
    period: number,
    e: DragEvent
  ) => void;
  taskLanesByDay?: Record<number, TaskLanes>;
  onLaneDrop?: (dayIndex: number, lane: TaskTimeSlot, e: DragEvent) => void;
  onToggleTask?: (taskId: string, done: boolean) => void;
  quickAdd?: QuickAddState;
}) {
  const quickAddInput = (onSubmit: () => void) => (
    <input
      autoFocus
      value={quickAdd?.title ?? ""}
      onChange={(e) => quickAdd?.setTitle(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (e.nativeEvent.isComposing) return; // 日本語入力の変換確定のEnterは無視
          e.preventDefault();
          onSubmit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          quickAdd?.cancel();
        }
      }}
      onBlur={() => {
        if (!quickAdd?.title.trim()) quickAdd?.cancel();
      }}
      placeholder="タスクを入力してEnter"
      className="w-full rounded border border-brand-300 px-1 py-0.5 text-[10px] focus:outline-none"
    />
  );
  const laneRow = (lane: TaskTimeSlot) => (
    <tr key={`lane-${lane}`} className="border-b border-gray-50 bg-gray-50/60 last:border-0">
      <td className="px-2 py-1 align-top text-[10px] font-medium text-gray-500">
        {TASK_LANE_LABEL[lane]}
      </td>
      {weekDates.map((d, dayIndex) => {
        const chips = taskLanesByDay?.[dayIndex]?.[lane] ?? [];
        const cellKey = `lane-${lane}-${dayIndex}`;
        const addKey = `add-lane-${lane}-${dayIndex}`;
        const isDragOver = dragOverKey === cellKey;
        const dateKey = formatDateParam(d);
        const isAdding = quickAdd?.key === addKey;
        return (
          <td key={dayIndex} className="px-1 py-1 align-top">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverKey(cellKey)}
              onDragLeave={() => setDragOverKey((k) => (k === cellKey ? null : k))}
              onDrop={(e) => onLaneDrop?.(dayIndex, lane, e)}
              className={`min-h-[28px] space-y-0.5 rounded border border-dashed border-gray-200 bg-white/70 px-1 py-1 transition ${
                isDragOver ? "ring-2 ring-orange-400" : ""
              }`}
            >
              {chips.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => setDragPayload(e, { source: "task", taskId: t.id })}
                  className="flex cursor-grab items-center gap-1 truncate rounded bg-amber-50 px-1 py-0.5 text-[10px] text-amber-700 active:cursor-grabbing"
                >
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    onChange={(e) => onToggleTask?.(t.id, e.target.checked)}
                    className="h-3 w-3 shrink-0"
                  />
                  <span
                    className={`truncate ${
                      t.status === "done" ? "text-gray-400 line-through" : ""
                    }`}
                    title={t.title}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
              {isAdding ? (
                quickAddInput(() => quickAdd?.submit(dateKey, lane))
              ) : (
                <button
                  type="button"
                  onClick={() => quickAdd?.open(addKey)}
                  className="w-full text-left text-[10px] text-gray-300 hover:text-brand-500"
                >
                  + タスク
                </button>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="mt-3 rounded-lg border border-gray-100 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-500">{title}</p>
      <div className="overflow-hidden rounded-md border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-16 px-2 py-1 text-left text-[10px] text-gray-400">
                時間
              </th>
              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === todayKey;
                return (
                  <th
                    key={i}
                    className={`px-1 py-1 text-center font-medium ${
                      isToday ? "text-brand-700" : "text-gray-500"
                    }`}
                  >
                    {WEEKDAY_LABELS[i]} {d.getDate()}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {taskLanesByDay && laneRow("morning")}
            {BELL_SCHEDULE.map(({ period, start, end }) => (
              <Fragment key={period}>
                <tr className="border-b border-gray-50 last:border-0">
                  <td className="px-2 py-1 align-top text-[10px] leading-tight text-gray-400">
                    <p className="font-medium text-gray-500">{period}限</p>
                    <p>
                      {start}
                      <br />
                      {end}
                    </p>
                  </td>
                  {weekDates.map((d, dayIndex) => {
                    const entry = slotsByDay[dayIndex]?.[period] ?? null;
                    const cellKey = `${kind}-${dayIndex}-${period}`;
                    const addKey = `add-period-${kind}-${dayIndex}-${period}`;
                    const isDragOver = dragOverKey === cellKey;
                    const dateKey = formatDateParam(d);
                    const isAdding = quickAdd?.key === addKey;
                    return (
                      <td key={dayIndex} className="px-1 py-1">
                        <div
                          draggable={!!entry}
                          onDragStart={(e) => {
                            if (!entry) return;
                            setDragPayload(e, {
                              source: "weekLesson",
                              kind,
                              date: dateKey,
                              period,
                            });
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={() => setDragOverKey(cellKey)}
                          onDragLeave={() =>
                            setDragOverKey((k) => (k === cellKey ? null : k))
                          }
                          onDrop={(e) => onDrop(kind, dayIndex, period, e)}
                          className={`min-h-[36px] rounded px-1 py-1 transition ${
                            entry
                              ? `cursor-grab active:cursor-grabbing ${badgeClass}`
                              : "border border-dashed border-gray-200 bg-gray-50/50"
                          } ${isDragOver ? "ring-2 ring-orange-400" : ""}`}
                        >
                          {entry ? (
                            <p className="truncate font-medium" title={entry.name}>
                              {entry.name}
                            </p>
                          ) : isAdding ? (
                            quickAddInput(() => quickAdd?.submit(dateKey, null))
                          ) : quickAdd ? (
                            <button
                              type="button"
                              onClick={() => quickAdd.open(addKey)}
                              className="w-full text-left text-[10px] text-gray-300 hover:text-brand-500"
                            >
                              + タスク
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-300">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {taskLanesByDay && period === 4 && laneRow("noon")}
              </Fragment>
            ))}
            {taskLanesByDay && laneRow("afterschool")}
          </tbody>
        </table>
      </div>
    </div>
  );
}
