"use client";

import { useTransition } from "react";
import { deleteSchoolEvent } from "@/app/(app)/events/actions";

const CATEGORY_LABEL: Record<string, string> = {
  club: "部活",
  duty: "校務分掌",
  event: "学校行事",
  other: "その他",
};

const CATEGORY_STYLE: Record<string, string> = {
  club: "bg-orange-50 text-orange-600",
  duty: "bg-slate-100 text-slate-600",
  event: "bg-green-50 text-green-600",
  other: "bg-gray-100 text-gray-500",
};

type SchoolEvent = {
  id: string;
  title: string;
  event_date: string;
  category: string;
  notes: string | null;
};

export default function EventList({ events }: { events: SchoolEvent[] }) {
  const [isPending, startTransition] = useTransition();

  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        予定がありません。上のフォームから追加してください。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-xs text-gray-400">
              {new Date(event.event_date).toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              })}
            </span>
            <span className="font-medium">{event.title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                CATEGORY_STYLE[event.category] ?? CATEGORY_STYLE.other
              }`}
            >
              {CATEGORY_LABEL[event.category] ?? "その他"}
            </span>
            {event.notes && (
              <span className="truncate text-xs text-gray-400">
                {event.notes}
              </span>
            )}
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => deleteSchoolEvent(event.id))}
            className="shrink-0 text-xs text-gray-300 hover:text-red-500"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
