"use client";

import { useTransition } from "react";
import { deleteInterview } from "@/app/(app)/interviews/actions";

const TYPE_LABEL: Record<string, string> = {
  sanja: "三者面談",
  hogosha: "保護者面談",
  other: "その他",
};

type InterviewRecord = {
  id: string;
  student_name: string;
  interview_date: string;
  interview_type: string;
  notes: string | null;
  classes: { name: string } | null;
};

export default function InterviewList({
  interviews,
}: {
  interviews: InterviewRecord[];
}) {
  const [isPending, startTransition] = useTransition();

  if (interviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        面談記録がありません。上のフォームから追加してください。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {interviews.map((interview) => (
        <li
          key={interview.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-xs text-gray-400">
              {new Date(interview.interview_date).toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              })}
            </span>
            <span className="font-medium">{interview.student_name}</span>
            {interview.classes?.name && (
              <span className="text-xs text-gray-400">
                {interview.classes.name}
              </span>
            )}
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600">
              {TYPE_LABEL[interview.interview_type] ?? "その他"}
            </span>
            {interview.notes && (
              <span className="truncate text-xs text-gray-400">
                {interview.notes}
              </span>
            )}
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => deleteInterview(interview.id))}
            className="shrink-0 text-xs text-gray-300 hover:text-red-500"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
