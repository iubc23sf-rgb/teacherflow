"use client";

import { useRef, useState } from "react";
import { createTask } from "@/app/(app)/tasks/actions";
import DateField from "@/components/DateField";

export default function TaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTask(formData);
        formRef.current?.reset();
        setResetKey((k) => k + 1);
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
      <DateField key={resetKey} name="due_date" label="期限" />
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
