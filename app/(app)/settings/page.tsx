import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: googleToken, error: googleTokenError } = await supabase
    .from("google_oauth_tokens")
    .select("updated_at")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  logSupabaseError("settings.googleToken", googleTokenError);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold">プロフィール</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <span className="text-gray-400">メールアドレス</span>
          <span className="col-span-2">{user?.email ?? "-"}</span>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold">Google カレンダー連携</h2>
        <div className="flex items-center justify-between text-sm">
          <span>連携ステータス</span>
          <span
            className={
              googleToken
                ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600"
                : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500"
            }
          >
            {googleToken ? "連携済み" : "未連携"}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          ログイン時に Google カレンダーの読み書き権限を許可すると、予定が自動でタスクに反映されます。
        </p>
      </section>
    </div>
  );
}
