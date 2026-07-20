"use client";

import { useTransition } from "react";
import { toggleTask, deleteTask } from "@/app/(app)/tasks/actions";
import type { Task } from "@/types/database";

const PRIORITY_LABEL: Record<number, string> = { 1: "高", 2: "中", 3: "低" };

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [isPending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        タスクがありません。上のフォームから追加してください。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={task.status === "done"}
              onChange={(e) =>
                startTransition(() => toggleTask(task.id, e.target.checked))
              }
              className="h-4 w-4"
            />
            <span
              className={
                task.status === "done"
                  ? "text-sm text-gray-400 line-through"
                  : "text-sm text-gray-800"
              }
            >
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              重要度: {PRIORITY_LABEL[task.priority] ?? "中"}
            </span>
            <span>{task.due_date ?? "期限なし"}</span>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteTask(task.id))}
              className="text-gray-300 hover:text-red-500"
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
