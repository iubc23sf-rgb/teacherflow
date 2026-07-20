"use client";

import { useRef, useState } from "react";

function toISODate(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatDisplay(value: string) {
  if (!value) return "未設定";
  const [y, m, d] = value.split("-");
  return `${y}/${m}/${d}`;
}

export default function DateField({
  name,
  label,
  required,
  defaultValue = "",
}: {
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    if (typeof (input as any).showPicker === "function") {
      (input as any).showPicker();
    } else {
      input.focus();
    }
  };

  const setToday = () => {
    setValue(toISODate(new Date()));
  };

  return (
    <div>
      {label && <label className="mb-1 block text-xs text-gray-500">{label}</label>}
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="date"
          name={name}
          required={required}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={setToday}
          className="h-9 shrink-0 rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          今日
        </button>
        <button
          type="button"
          onClick={openPicker}
          title="カレンダーから選択"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-sm hover:bg-gray-50"
        >
          📅
        </button>
        <span className="text-sm text-gray-600">{formatDisplay(value)}</span>
      </div>
    </div>
  );
}
