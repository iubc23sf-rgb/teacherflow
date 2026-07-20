"use client";

import { useRef, useState, useTransition } from "react";
import { sendMessage } from "@/app/(app)/assistant/actions";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
};

export default function ChatWindow({
  initialMessages,
}: {
  initialMessages: ChatMessage[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingText, setPendingText] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-[300px] space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        {initialMessages.length === 0 && !pendingText ? (
          <p className="text-sm text-gray-400">
            タスクや予定について質問してみましょう。例:「来週までに終わらない仕事は?」
          </p>
        ) : (
          <>
            {initialMessages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pendingText && (
              <div className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-lg bg-brand-600 px-3 py-2 text-sm text-white">
                  {pendingText}
                </div>
              </div>
            )}
            {isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-400">
                  考え中...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          const text = String(formData.get("content") ?? "");
          setPendingText(text);
          startTransition(async () => {
            await sendMessage(formData);
            setPendingText(null);
            formRef.current?.reset();
          });
        }}
        className="flex gap-2"
      >
        <input
          name="content"
          required
          placeholder="質問を入力..."
          disabled={isPending}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
