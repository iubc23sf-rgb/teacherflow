export default function Topbar({ displayName }: { displayName: string }) {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const initial = displayName?.[0] ?? "先";

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <div>
        <h1 className="text-lg font-bold">
          おはようございます、{displayName}先生！
        </h1>
        <p className="text-xs text-gray-400">今日は{today}です</p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="検索（タスク・資料など）"
          className="hidden w-64 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm placeholder:text-gray-400 sm:block"
        />
        <button
          className="relative rounded-full p-2 text-gray-400 hover:bg-gray-50"
          title="通知（Phase2で実装予定）"
        >
          🔔
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initial}
          </div>
          <span className="hidden text-sm font-medium sm:inline">
            {displayName}先生
          </span>
        </div>
      </div>
    </header>
  );
}
