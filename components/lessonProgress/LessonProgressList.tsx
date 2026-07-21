"use client";

import { useState, useTransition } from "react";
import { updateCompletedHours, deleteLessonProgress } from "@/app/(app)/lesson-progress/actions";

type ProgressRow = {
  id: string;
  unit_name: string;
  planned_hours: number;
  completed_hours: number;
  target_test_date: string | null;
  notes: string | null;
  subjects: { name: string; color: string } | null;
  classes: { name: string } | null;
};

function ProgressRowItem({ row }: { row: ProgressRow }) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(row.completed_hours);

  const planned = row.planned_hours ?? 0;
  const pct = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;

  const commit = (value: number) => {
    setCompleted(value);
    startTransition(() => updateCompletedHours(row.id, value));
  };

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: row.subjects?.color ?? "#3B82F6" }}
          >
            {row.subjects?.name ?? "科目未設定"}
          </span>
          <span className="font-medium">{row.unit_name}</span>
          {row.classes?.name && (
            <span className="text-xs text-gray-400">{row.classes.name}</span>
          )}
          {row.target_test_date && (
            <span className="text-xs text-gray-400">
              テスト：
              {new Date(row.target_test_date).toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => deleteLessonProgress(row.id))}
          className="shrink-0 text-xs text-gray-300 hover:text-red-500"
        >
          削除
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
          <input
            type="number"
            min={0}
            step={1}
            defaultValue={completed}
            onBlur={(e) => {
              const value = Number(e.target.value) || 0;
              if (value !== completed) commit(value);
            }}
            className="w-14 rounded-md border border-gray-300 px-2 py-1 text-right"
          />
          <span>/ {planned}コマ（{pct}%）</span>
        </div>
      </div>

      {row.notes && <p className="text-xs text-gray-400">{row.notes}</p>}
    </li>
  );
}

export default function LessonProgressList({
  progress,
}: {
  progress: ProgressRow[];
}) {
  if (progress.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        授業進度の記録がありません。上のフォームから追加してください。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {progress.map((row) => (
        <ProgressRowItem key={row.id} row={row} />
      ))}
    </ul>
  );
}
