"use client";

import { useRef, useState } from "react";
import { createInterview } from "@/app/(app)/interviews/actions";
import DateField from "@/components/DateField";

type ClassOption = { id: string; name: string };

export default function InterviewForm({ classes }: { classes: ClassOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createInterview(formData);
        formRef.current?.reset();
        setResetKey((k) => k + 1);
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-xs text-gray-500">生徒名</label>
        <input
          name="student_name"
          required
          placeholder="例：山田太郎"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">クラス</label>
        <select
          name="class_id"
          defaultValue=""
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">未設定</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <DateField key={resetKey} name="interview_date" label="面談日" required />
      <div>
        <label className="mb-1 block text-xs text-gray-500">種別</label>
        <select
          name="interview_type"
          defaultValue="other"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="sanja">三者面談</option>
          <option value="hogosha">保護者面談</option>
          <option value="other">その他</option>
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-xs text-gray-500">メモ</label>
        <input
          name="notes"
          placeholder="面談内容など"
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
