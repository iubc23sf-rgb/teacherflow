"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // Google連携の設定なしでも試せる、メールのマジックリンクログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-700">TeacherFlow</h1>
        <p className="mt-2 text-sm text-gray-500">
          先生のためのオールインワン業務ワークスペース
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Googleでログイン
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span className="h-px flex-1 bg-gray-200" />
          または
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {sent ? (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-center text-sm text-brand-700">
            {email} 宛にログイン用リンクを送りました。メールを確認してリンクを開いてください。
          </p>
        ) : (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-2">
            <input
              type="email"
              required
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? "送信中..." : "メールでログイン（お試し用）"}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        )}
      </div>

      <p className="max-w-xs text-center text-xs text-gray-400">
        Google連携は本番用のログイン方法です。まずは使用感だけ試したい場合は「メールでログイン」が簡単です（Google Cloudの設定が不要）。
      </p>
    </div>
  );
}
