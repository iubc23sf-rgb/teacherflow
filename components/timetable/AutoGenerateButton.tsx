"use client";

import { useState, useTransition } from "react";
import { autoGenerateTimetable } from "@/app/(app)/timetable/actions";

export default function AutoGenerateButton({
  timetableId,
}: {
  timetableId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ placed: number; unplaced: number } | null>(
    null
  );

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const res = await autoGenerateTimetable(timetableId);
            setResult(res);
          });
        }}
        className="rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
      >
        {isPending ? "生成中..." : "空きコマに自動生成"}
      </button>
      {result && (
        <span className="text-xs text-gray-500">
          {result.placed}コマ配置しました
          {result.unplaced > 0 && `（${result.unplaced}コマは空きが足りませんでした）`}
        </span>
      )}
    </div>
  );
}
