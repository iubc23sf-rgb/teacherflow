"use client";

import { useRef, useState } from "react";
import { createLessonProgress } from "@/app/(app)/lesson-progress/actions";
import DateField from "@/components/DateField";

type SubjectOption = { id: string; name: string };
type ClassOption = { id: string; name: string };

export default function LessonProgressForm({
  subjects,
  classes,
}: {
  subjects: SubjectOption[];
  classes: ClassOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetKey, setResetKey] = useState(0);

  if (subjects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        先に「時間割」ページで科目を登録してください。
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createLessonProgress(formData);
        formRef.current?.reset();
        setResetKey((k) => k + 1);
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex-1 min-w-[160px]">
        <label className="mb-1 block text-xs text-gray-500">単元名</label>
        <input
          name="unit_name"
          required
          placeholder="例：二次関数"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">科目</label>
        <select
          name="subject_id"
          required
          defaultValue=""
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            選択してください
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
      <div className="w-24">
        <label className="mb-1 block text-xs text-gray-500">予定コマ数</label>
        <input
          name="planned_hours"
          type="number"
          min={0}
          step={1}
          placeholder="0"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <DateField key={resetKey} name="target_test_date" label="テスト予定日" />
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-xs text-gray-500">メモ</label>
        <input
          name="notes"
          placeholder="進め方など"
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
