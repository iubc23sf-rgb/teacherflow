"use client";

import { useTransition } from "react";
import {
  createSubject,
  deleteSubject,
  createClassGroup,
  deleteClassGroup,
} from "@/app/(app)/timetable/actions";

type Subject = { id: string; name: string; color: string };
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
          <form action={createSubject} className="mb-3 flex gap-2">
            <input
              name="name"
              required
              placeholder="例：数学"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              type="color"
              name="color"
              defaultValue="#3B82F6"
              className="h-8 w-10 rounded border border-gray-300"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              追加
            </button>
          </form>
          <ul className="space-y-1">
            {subjects.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
                <button
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteSubject(s.id))}
                  className="text-xs text-gray-300 hover:text-red-500"
                >
                  削除
                </button>
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
