"use client";

import { useRef, useState } from "react";
import { createSchoolEvent } from "@/app/(app)/events/actions";
import DateField from "@/components/DateField";

export default function EventForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createSchoolEvent(formData);
        formRef.current?.reset();
        setResetKey((k) => k + 1);
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="mb-1 block text-xs text-gray-500">予定名</label>
        <input
          name="title"
          required
          placeholder="例：野球部 練習試合"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <DateField key={resetKey} name="event_date" label="日付" required />
      <div>
        <label className="mb-1 block text-xs text-gray-500">種別</label>
        <select
          name="category"
          defaultValue="other"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="club">部活</option>
          <option value="duty">校務分掌</option>
          <option value="event">学校行事</option>
          <option value="other">その他</option>
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-xs text-gray-500">メモ</label>
        <input
          name="notes"
          placeholder="場所・持ち物など"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
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
