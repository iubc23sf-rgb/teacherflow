"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveOverride, clearOverride } from "@/app/(app)/timetable/actions";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [1, 2, 3, 4, 5, 6];

type Slot = {
  day_of_week: number;
  period: number;
  subject_id: string | null;
  class_id: string | null;
  room: string | null;
  subjects: { name: string } | null;
  classes: { name: string } | null;
};

type Override = {
  period: number;
  subject_id: string | null;
  custom_label: string | null;
  class_id: string | null;
  room: string | null;
};

type Option = { id: string; name: string };

function slotLabel(slot: Slot | undefined) {
  if (!slot || !slot.subject_id) return "-";
  return slot.subjects?.name ?? "-";
}

export default function SpecialDayEditor({
  timetableId,
  date,
  dayOfWeek,
  allSlots,
  overridesForDate,
  subjects,
  classes,
  backHref,
}: {
  timetableId: string;
  date: string;
  dayOfWeek: number;
  allSlots: Slot[];
  overridesForDate: Override[];
  subjects: Option[];
  classes: Option[];
  backHref: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingPeriod, setEditingPeriod] = useState<number | null>(null);
  const [mode, setMode] = useState<"subject" | "custom">("subject");
  const [subjectId, setSubjectId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [classId, setClassId] = useState("");
  const [room, setRoom] = useState("");

  const slotMap = new Map<string, Slot>();
  allSlots.forEach((s) => slotMap.set(`${s.day_of_week}-${s.period}`, s));

  const overrideMap = new Map<number, Override>();
  overridesForDate.forEach((o) => overrideMap.set(o.period, o));

  const openEditor = (period: number) => {
    const override = overrideMap.get(period);
    const recurring = slotMap.get(`${dayOfWeek}-${period}`);
    if (override) {
      setMode(override.custom_label ? "custom" : "subject");
      setSubjectId(override.subject_id ?? "");
      setCustomLabel(override.custom_label ?? "");
      setClassId(override.class_id ?? "");
      setRoom(override.room ?? "");
    } else {
      setMode("subject");
      setSubjectId(recurring?.subject_id ?? "");
      setCustomLabel("");
      setClassId(recurring?.class_id ?? "");
      setRoom(recurring?.room ?? "");
    }
    setEditingPeriod(period);
  };

  const applyQuickCopy = (day: number, period: number) => {
    const slot = slotMap.get(`${day}-${period}`);
    setMode("subject");
    setSubjectId(slot?.subject_id ?? "");
    setClassId(slot?.class_id ?? "");
    setRoom(slot?.room ?? "");
    setCustomLabel("");
  };

  const handleSave = () => {
    if (editingPeriod == null) return;
    const period = editingPeriod;
    startTransition(async () => {
      await saveOverride({
        timetableId,
        overrideDate: date,
        period,
        subjectId: mode === "subject" ? subjectId || null : null,
        customLabel: mode === "custom" ? customLabel.trim() || null : null,
        classId: classId || null,
        room: room.trim() || null,
      });
      setEditingPeriod(null);
    });
  };

  const handleMakeEmpty = () => {
    if (editingPeriod == null) return;
    const period = editingPeriod;
    startTransition(async () => {
      await saveOverride({
        timetableId,
        overrideDate: date,
        period,
        subjectId: null,
        customLabel: null,
        classId: null,
        room: null,
      });
      setEditingPeriod(null);
    });
  };

  const handleRevert = () => {
    if (editingPeriod == null) return;
    const period = editingPeriod;
    startTransition(async () => {
      await clearOverride({ timetableId, overrideDate: date, period });
      setEditingPeriod(null);
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          {date} を特別時間割で編集
        </h2>
        <Link
          href={backHref}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          通常表示に戻る
        </Link>
      </div>

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {PERIODS.map((period) => {
          const override = overrideMap.get(period);
          const recurring = slotMap.get(`${dayOfWeek}-${period}`);
          const isOverridden = !!override;
          const displayLabel = override
            ? override.custom_label ?? subjects.find((s) => s.id === override.subject_id)?.name ?? "空きコマ"
            : slotLabel(recurring);

          return (
            <li key={period} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-10 shrink-0 text-xs text-gray-400">
                  {period}限
                </span>
                <span
                  className={
                    isOverridden
                      ? "rounded-md bg-orange-50 px-2 py-1 text-orange-700"
                      : displayLabel === "-"
                        ? "text-gray-300"
                        : "rounded-md bg-brand-50 px-2 py-1 text-brand-700"
                  }
                >
                  {displayLabel === "-" ? "空きコマ" : displayLabel}
                </span>
                {isOverridden && (
                  <span className="text-[10px] text-orange-500">変更あり</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => openEditor(period)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                編集
              </button>
            </li>
          );
        })}
      </ul>

      {editingPeriod != null && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">{editingPeriod}限を編集</p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("subject")}
              className={`rounded-md px-2 py-1 ${
                mode === "subject"
                  ? "bg-brand-600 text-white"
                  : "border border-gray-300 text-gray-600"
              }`}
            >
              登録済み科目
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-md px-2 py-1 ${
                mode === "custom"
                  ? "bg-brand-600 text-white"
                  : "border border-gray-300 text-gray-600"
              }`}
            >
              手入力
            </button>
          </div>

          {mode === "subject" ? (
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">未設定</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="例：特別指導教室"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">クラス未設定</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="教室（任意）"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="mb-1 text-[11px] text-gray-400">
              他のコマの内容をコピー
            </p>
            <div className="grid grid-cols-6 gap-1">
              {DAYS.map((dayLabel, day) =>
                PERIODS.map((p) => (
                  <button
                    key={`${day}-${p}`}
                    type="button"
                    onClick={() => applyQuickCopy(day, p)}
                    title={slotLabel(slotMap.get(`${day}-${p}`))}
                    className="truncate rounded border border-gray-200 px-1 py-1 text-[10px] text-gray-500 hover:bg-gray-50"
                  >
                    {dayLabel}
                    {p}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              保存
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleMakeEmpty}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              空にする
            </button>
            {overrideMap.has(editingPeriod) && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleRevert}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                通常に戻す
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditingPeriod(null)}
              className="px-2 py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
