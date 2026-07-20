"use client";

import { useState, useTransition } from "react";
import { saveSlot } from "@/app/(app)/timetable/actions";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [1, 2, 3, 4, 5, 6];

type Slot = {
  id: string;
  day_of_week: number;
  period: number;
  subject_id: string | null;
  class_id: string | null;
  room: string | null;
  subjects: { name: string; color: string } | null;
  classes: { name: string } | null;
};

type Option = { id: string; name: string };

export default function TimetableGrid({
  timetableId,
  slots,
  subjects,
  classes,
}: {
  timetableId: string;
  slots: Slot[];
  subjects: Option[];
  classes: Option[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<{ day: number; period: number } | null>(
    null
  );

  const slotMap = new Map<string, Slot>();
  slots.forEach((slot) => slotMap.set(`${slot.day_of_week}-${slot.period}`, slot));

  const editingSlot = editing
    ? slotMap.get(`${editing.day}-${editing.period}`)
    : undefined;

  function handleSave(formData: FormData) {
    if (!editing) return;
    const subjectId = String(formData.get("subject_id") ?? "") || null;
    const classId = String(formData.get("class_id") ?? "") || null;
    const room = String(formData.get("room") ?? "").trim() || null;
    const target = editing;
    startTransition(async () => {
      await saveSlot({
        timetableId,
        dayOfWeek: target.day,
        period: target.period,
        subjectId,
        classId,
        room,
      });
      setEditing(null);
    });
  }

  function handleClear() {
    if (!editing) return;
    const target = editing;
    startTransition(async () => {
      await saveSlot({
        timetableId,
        dayOfWeek: target.day,
        period: target.period,
        subjectId: null,
        classId: null,
        room: null,
      });
      setEditing(null);
    });
  }

  return (
    <div className="space-y-4">
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
                  const isEditing =
                    editing?.day === dayIndex && editing?.period === period;
                  return (
                    <td key={dayIndex} className="px-1.5 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditing({ day: dayIndex, period })}
                        className={`w-full rounded-md px-2 py-1.5 text-left transition ${
                          isEditing ? "ring-2 ring-brand-500" : "hover:bg-gray-50"
                        } ${slot ? "bg-brand-50" : ""}`}
                      >
                        {slot ? (
                          <>
                            <p className="text-xs font-medium text-brand-700">
                              {slot.subjects?.name ?? "-"}
                            </p>
                            <p className="truncate text-[10px] text-gray-400">
                              {slot.classes?.name ?? ""} {slot.room ?? ""}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-200">-</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <form
          action={handleSave}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <p className="w-full text-xs text-gray-500">
            {DAYS[editing.day]}曜 {editing.period}限を編集
          </p>
          <div>
            <label className="mb-1 block text-xs text-gray-500">科目</label>
            <select
              name="subject_id"
              defaultValue={editingSlot?.subject_id ?? ""}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">未設定</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">クラス</label>
            <select
              name="class_id"
              defaultValue={editingSlot?.class_id ?? ""}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">未設定</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">教室</label>
            <input
              name="room"
              defaultValue={editingSlot?.room ?? ""}
              placeholder="例：3-2教室"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            保存
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleClear}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="px-2 py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            閉じる
          </button>
        </form>
      )}

      {subjects.length === 0 && (
        <p className="text-xs text-amber-600">
          科目が未登録です。下の「科目・クラス管理」から先に科目を追加してください。
        </p>
      )}
    </div>
  );
}
