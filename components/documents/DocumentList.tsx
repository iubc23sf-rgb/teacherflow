"use client";

import { useTransition } from "react";
import { deleteDocument, getDocumentUrl } from "@/app/(app)/documents/actions";

type DocumentRow = {
  id: string;
  file_name: string;
  storage_path: string;
  size_bytes: number | null;
  created_at: string;
};

export default function DocumentList({
  documents,
}: {
  documents: DocumentRow[];
}) {
  const [isPending, startTransition] = useTransition();

  if (documents.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        資料がありません。上のフォームからアップロードしてください。
      </p>
    );
  }

  const handleOpen = (path: string) => {
    startTransition(async () => {
      const url = await getDocumentUrl(path);
      if (url) window.open(url, "_blank");
    });
  };

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span className="truncate font-medium">📄 {doc.file_name}</span>
            {doc.size_bytes != null && (
              <span className="shrink-0 text-xs text-gray-400">
                {Math.round(doc.size_bytes / 1024)} KB
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs">
            <button
              disabled={isPending}
              onClick={() => handleOpen(doc.storage_path)}
              className="font-medium text-brand-600 hover:underline"
            >
              開く
            </button>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => deleteDocument(doc.id, doc.storage_path))
              }
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
