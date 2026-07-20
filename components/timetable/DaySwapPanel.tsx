"use client";

import { useState, useTransition } from "react";
import { applyDaySwap } from "@/app/(app)/timetable/actions";
import { DAY_LABELS } from "@/lib/dayOfWeek";

export default function DaySwapPanel({
  date,
  timetableIds,
}: {
  date: string;
  timetableIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
      <p className="mb-2 text-sm font-semibold text-gray-700">
        この日を別の曜日の時間割にする
      </p>
      <p className="mb-3 text-xs text-gray-500">
        学校行事などでその日の時間割が丸ごと変わる場合、ここでどの曜日のパターンにするか選ぶと、自分の授業・担任クラスの授業の両方に反映されます。個別のコマだけ直したい場合は下から編集してください。
      </p>
      <div className="flex flex-wrap gap-2">
        {DAY_LABELS.map((label, dayOfWeek) => (
          <button
            key={label}
            type="button"
            disabled={isPending}
            onClick={() => {
              setApplied(null);
              startTransition(async () => {
                await applyDaySwap({ date, sourceDayOfWeek: dayOfWeek, timetableIds });
                setApplied(label);
              });
            }}
            className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {label}曜日にする
          </button>
        ))}
      </div>
      {applied && (
        <p className="mt-2 text-xs text-orange-600">
          {applied}曜日の時間割を適用しました。
        </p>
      )}
    </div>
  );
}
