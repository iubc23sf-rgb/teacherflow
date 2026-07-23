"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  implemented: boolean;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: "🏠", implemented: true },
  { href: "/dashboard", label: "カレンダー", icon: "📅", implemented: false, badge: "Phase2" },
  { href: "/timetable", label: "時間割", icon: "🗓️", implemented: true },
  { href: "/tasks", label: "ToDo / タスク", icon: "✅", implemented: true },
  { href: "/lesson-progress", label: "授業進度管理", icon: "📖", implemented: true },
  { href: "/interviews", label: "面談記録", icon: "💬", implemented: true },
  { href: "/documents", label: "資料・ファイル", icon: "📁", implemented: true },
  { href: "/events", label: "行事・部活・校務", icon: "🗂️", implemented: true },
  { href: "/dashboard", label: "AIアシスタント", icon: "✨", implemented: false, badge: "準備中" },
  { href: "/settings", label: "設定", icon: "⚙️", implemented: true },
];

const QUICK_ACTIONS = [
  { label: "タスクを追加", href: "/tasks", implemented: true },
  { label: "会議資料をアップロード", href: "/documents", implemented: true },
  { label: "生徒メモを追加", href: "/dashboard", implemented: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (collapsed) {
    return (
      <aside className="flex h-screen w-14 shrink-0 flex-col items-center border-r border-gray-200 bg-white py-4">
        <button
          onClick={() => setCollapsed(false)}
          title="サイドバーを表示"
          className="mb-4 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50"
        >
          »
        </button>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.filter((item) => item.implemented).map((item, i) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={`${item.label}-${i}`}
                href={item.href}
                title={item.label}
                className={`flex h-9 w-9 items-center justify-center rounded-md text-lg ${
                  active ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          title="ログアウト"
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50"
        >
          🚪
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">📘</span>
          <span className="text-lg font-bold text-brand-700">TeacherFlow</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          title="サイドバーを隠す"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50"
        >
          «
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item, i) => {
          const active = item.implemented && pathname?.startsWith(item.href);

          if (!item.implemented) {
            return (
              <div
                key={`${item.label}-${i}`}
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-gray-300"
                title={`${item.label} は今後のPhaseで実装予定です`}
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={`${item.label}-${i}`}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-gray-100 px-3 py-4">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
          クイックアクション
        </p>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`block rounded-md border px-3 py-2 text-xs font-medium ${
              action.implemented
                ? "border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100"
                : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
            }`}
          >
            + {action.label}
          </Link>
        ))}
      </div>

      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}
