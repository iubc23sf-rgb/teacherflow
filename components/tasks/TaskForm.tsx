"use client";

import { useRef } from "react";
import { createTask } from "@/app/(app)/tasks/actions";

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTask(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="mb-1 block text-xs text-gray-500">タスク内容</label>
        <input
          name="title"
          required
          placeholder="例：中間テスト作成"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">期限</label>
        <input
          type="date"
          name="due_date"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">重要度</label>
        <select
          name="priority"
          defaultValue={2}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={1}>高</option>
          <option value={2}>中</option>
          <option value={3}>低</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        追加
      </button>
    </form>
  );
}
