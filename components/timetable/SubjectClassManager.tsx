"use client";

import { useTransition } from "react";
import {
  createSubject,
  deleteSubject,
  createClassGroup,
  deleteClassGroup,
  updateSubjectWeeklyPeriods,
} from "@/app/(app)/timetable/actions";
import { setDragPayload } from "@/lib/dnd";

type Subject = { id: string; name: string; color: string; weekly_periods: number | null };
type ClassGroup = { id: string; name: string; grade: string | null };

export default function SubjectClassManager({
  subjects,
  classes,
}: {
  subjects: Subject[];
  classes: ClassGroup[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <details className="rounded-xl border border-gray-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-gray-700">
        科目・クラス管理
      </summary>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-medium text-gray-500">科目</h3>
          <form action={createSubject} className="mb-3 flex flex-wrap gap-2">
            <input
              name="name"
              required
              placeholder="例：数学"
              className="flex-1 min-w-[100px] rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              type="color"
              name="color"
              defaultValue="#3B82F6"
              className="h-8 w-10 rounded border border-gray-300"
            />
            <input
              type="number"
              name="weekly_periods"
              min={0}
              max={30}
              defaultValue={0}
              title="週コマ数（自動生成で使用）"
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              追加
            </button>
          </form>
          <p className="mb-1.5 text-[11px] text-gray-400">
            科目をドラッグして時間割のコマに割り当てられます
          </p>
          <ul className="space-y-1">
            {subjects.map((s) => (
              <li
                key={s.id}
                draggable
                onDragStart={(e) => setDragPayload(e, { source: "subject", subjectId: s.id })}
                className="flex cursor-grab items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm active:cursor-grabbing"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-gray-400">
                    週
                    <input
                      type="number"
                      min={0}
                      max={30}
                      defaultValue={s.weekly_periods ?? 0}
                      onBlur={(e) => {
                        const value = Number(e.target.value) || 0;
                        if (value !== (s.weekly_periods ?? 0)) {
                          startTransition(() =>
                            updateSubjectWeeklyPeriods(s.id, value)
                          );
                        }
                      }}
                      className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                    />
                    コマ
                  </label>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => deleteSubject(s.id))}
                    className="text-xs text-gray-300 hover:text-red-500"
                  >
                    削除
                  </button>
                </span>
              </li>
            ))}
            {subjects.length === 0 && (
              <li className="text-xs text-gray-400">科目がまだありません</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium text-gray-500">クラス</h3>
          <form action={createClassGroup} className="mb-3 flex gap-2">
            <input
              name="name"
              required
              placeholder="例：3年2組"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              name="grade"
              placeholder="学年（任意）"
              className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              追加
            </button>
          </form>
          <ul className="space-y-1">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm"
              >
                <span>
                  {c.name}
                  {c.grade ? `（${c.grade}）` : ""}
                </span>
                <button
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteClassGroup(c.id))}
                  className="text-xs text-gray-300 hover:text-red-500"
                >
                  削除
                </button>
              </li>
            ))}
            {classes.length === 0 && (
              <li className="text-xs text-gray-400">クラスがまだありません</li>
            )}
          </ul>
        </div>
      </div>
    </details>
  );
}
