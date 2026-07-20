"use client";

import { useRef, useState } from "react";
import { uploadDocument } from "@/app/(app)/documents/actions";

export default function DocumentUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setIsUploading(true);
        await uploadDocument(formData);
        setIsUploading(false);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex-1 min-w-[220px]">
        <label className="mb-1 block text-xs text-gray-500">ファイル</label>
        <input
          type="file"
          name="file"
          required
          className="w-full text-sm text-gray-600"
        />
      </div>
      <button
        type="submit"
        disabled={isUploading}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isUploading ? "アップロード中..." : "アップロード"}
      </button>
    </form>
  );
}
