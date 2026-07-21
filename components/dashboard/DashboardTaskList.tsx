"use client";

import Link from "next/link";
import { setDragPayload } from "@/lib/dnd";

const PRIORITY_STYLE: Record<number, string> = {
  1: "bg-red-50 text-red-600",
  2: "bg-amber-50 text-amber-600",
  3: "bg-gray-100 text-gray-500",
};
const PRIORITY_LABEL: Record<number, string> = { 1: "高", 2: "中", 3: "低" };

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: number;
};

export default function DashboardTaskList({ tasks }: { tasks: Task[] }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">タスクリスト</h2>
        <Link
          href="/tasks"
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          + 追加
        </Link>
      </div>
      {tasks.length > 0 ? (
        <>
          <p className="mb-2 text-[11px] text-gray-400">
            カレンダーの日付にドラッグすると期限日を設定できます
          </p>
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                draggable
                onDragStart={(e) => setDragPayload(e, { source: "task", taskId: task.id })}
                className="flex cursor-grab items-center justify-between gap-2 rounded-md text-sm active:cursor-grabbing"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                      {new Date(task.due_date).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                      まで
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE[2]
                  }`}
                >
                  {PRIORITY_LABEL[task.priority] ?? "中"}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-gray-400">
          タスクはまだありません。「タスク」画面から追加できます。
        </p>
      )}
      <Link
        href="/tasks"
        className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
      >
        すべてのタスクを見る →
      </Link>
    </section>
  );
}
