import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";

export const dynamic = "force-dynamic";

const PRIORITY_STYLE: Record<number, string> = {
  1: "bg-red-50 text-red-600",
  2: "bg-amber-50 text-amber-600",
  3: "bg-gray-100 text-gray-500",
};
const PRIORITY_LABEL: Record<number, string> = { 1: "高", 2: "中", 3: "低" };

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = 月曜
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    { data: todayEvents, error: todayEventsError },
    { data: openTasks, error: openTasksError },
    { data: weekEvents, error: weekEventsError },
    { data: googleToken, error: googleTokenError },
    { data: allTasksThisWeek, error: allTasksThisWeekError },
    { data: pdfTasks, error: pdfTasksError },
    { data: lessonProgress, error: lessonProgressError },
  ] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .order("start_time", { ascending: true }),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("due_date", { ascending: true })
      .limit(6),
    supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", weekStart.toISOString())
      .lt("start_time", weekEnd.toISOString())
      .order("start_time", { ascending: true }),
    supabase
      .from("google_oauth_tokens")
      .select("updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("tasks").select("status").eq("user_id", userId),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("source", "pdf")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("lesson_progress")
      .select("planned_hours, completed_hours")
      .eq("user_id", userId),
  ]);

  logSupabaseError("dashboard.todayEvents", todayEventsError);
  logSupabaseError("dashboard.openTasks", openTasksError);
  logSupabaseError("dashboard.weekEvents", weekEventsError);
  logSupabaseError("dashboard.googleToken", googleTokenError);
  logSupabaseError("dashboard.allTasksThisWeek", allTasksThisWeekError);
  logSupabaseError("dashboard.pdfTasks", pdfTasksError);
  logSupabaseError("dashboard.lessonProgress", lessonProgressError);

  const nextEvent = (todayEvents ?? []).find(
    (e: any) => new Date(e.start_time) >= now
  );

  const totalTasks = allTasksThisWeek?.length ?? 0;
  const doneTasks =
    allTasksThisWeek?.filter((t: any) => t.status === "done").length ?? 0;
  const taskProgress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalPlannedHours = (lessonProgress ?? []).reduce(
    (sum: number, p: any) => sum + Number(p.planned_hours ?? 0),
    0
  );
  const totalCompletedHours = (lessonProgress ?? []).reduce(
    (sum: number, p: any) => sum + Number(p.completed_hours ?? 0),
    0
  );
  const lessonPrepProgress =
    totalPlannedHours > 0
      ? Math.round((totalCompletedHours / totalPlannedHours) * 100)
      : 0;

  const eventsByDay: Record<string, any[]> = {};
  (weekEvents ?? []).forEach((e: any) => {
    const key = new Date(e.start_time).toDateString();
    eventsByDay[key] = eventsByDay[key] ?? [];
    eventsByDay[key].push(e);
  });

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            今日のスケジュール
          </h2>
          {todayEvents && todayEvents.length > 0 ? (
            <ul className="space-y-3">
              {todayEvents.map((event: any) => (
                <li key={event.id} className="flex items-start gap-3 text-sm">
                  <span className="w-12 shrink-0 pt-0.5 font-mono text-xs text-gray-400">
                    {new Date(event.start_time).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">
                    {event.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              今日の予定はまだありません。Googleカレンダーと連携すると自動表示されます。
            </p>
          )}
          <Link
            href="/timetable"
            className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            時間割を見る →
          </Link>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">今日のToDo</h2>
            <Link
              href="/tasks"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + 追加
            </Link>
          </div>
          {openTasks && openTasks.length > 0 ? (
            <ul className="space-y-3">
              {openTasks.map((task: any) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{task.title}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE[2]
                    }`}
                  >
                    {PRIORITY_LABEL[task.priority] ?? "中"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              タスクはまだありません。「タスク」画面から追加できます。
            </p>
          )}
          <Link
            href="/tasks"
            className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            すべてのタスクを見る →
          </Link>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              カレンダー（今週）
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
            {weekDates.map((d, i) => (
              <div key={i}>
                <p>{WEEKDAY_LABELS[i]}</p>
                <p className="font-mono text-gray-600">{d.getDate()}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {weekDates.map((d, i) => {
              const events = eventsByDay[d.toDateString()] ?? [];
              return (
                <div key={i} className="min-h-[64px] space-y-1">
                  {events.slice(0, 3).map((e: any) => (
                    <div
                      key={e.id}
                      className="truncate rounded bg-brand-50 px-1 py-0.5 text-[9px] text-brand-700"
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            {googleToken
              ? "🟢 Googleカレンダーと同期中"
              : "⚪ Googleカレンダー未連携（設定から連携できます）"}
          </p>
        </section>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            AIからの提案
          </h2>
          <p className="mb-4 text-[11px] text-gray-400">
            ※ AIアシスタントはPhase3で実装予定。以下はイメージ表示です
          </p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>💡 空きコマに採点や成績入力を進めるのがおすすめです</li>
            <li>💡 期限が近いタスクから優先して着手しましょう</li>
            <li>💡 会議資料をアップロードすると、タスクを自動抽出できます</li>
          </ul>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded-md bg-gray-100 px-4 py-2 text-xs font-medium text-gray-400"
          >
            AIに相談する（準備中）
          </button>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">
              会議資料から追加されたタスク
            </h2>
          </div>
          <p className="mb-4 text-[11px] text-gray-400">
            ※ PDF→ToDoの自動抽出機能は準備中です。ここには source が
            &quot;pdf&quot; のタスクが表示されます
          </p>
          {pdfTasks && pdfTasks.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">
              {pdfTasks.map((task: any) => (
                <li key={task.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled
                    checked={task.status === "done"}
                    className="h-3.5 w-3.5"
                    readOnly
                  />
                  {task.title}
                  {task.due_date && (
                    <span className="text-xs text-gray-400">
                      （
                      {new Date(task.due_date).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                      ）
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              まだありません。自動抽出機能の実装後、ここに表示されます。
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            今週の進捗
          </h2>
          <div className="space-y-4">
            <ProgressBar label="タスクの進捗" value={taskProgress} color="bg-green-500" />
            <ProgressBar
              label="授業準備の進捗"
              value={lessonPrepProgress}
              color="bg-blue-500"
              note={totalPlannedHours === 0 ? "データなし" : undefined}
            />
            <ProgressBar label="採点・成績の進捗" value={0} color="bg-orange-500" note />
            <ProgressBar label="面談記録の進捗" value={0} color="bg-purple-500" note />
          </div>
        </section>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">次の授業</h2>
          {nextEvent ? (
            <div>
              <p className="text-sm font-medium">{nextEvent.title}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(nextEvent.start_time).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                開始
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">本日の予定はありません。</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["授業ノートを開く", "教材・プリント", "板書計画"].map((label) => (
              <span
                key={label}
                className="cursor-not-allowed rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-gray-300"
                title="Phase4で実装予定"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            面談・連絡予定
          </h2>
          <p className="mb-4 text-[11px] text-gray-400">
            ※ 面談記録機能は準備中です
          </p>
          <p className="text-sm text-gray-400">
            面談・連絡予定はまだありません。
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            最近使用した資料
          </h2>
          <p className="mb-4 text-[11px] text-gray-400">
            ※ 資料・ファイル管理機能は準備中です
          </p>
          <p className="text-sm text-gray-400">
            資料はまだアップロードされていません。
          </p>
        </section>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
  note,
}: {
  label: string;
  value: number;
  color: string;
  note?: boolean | string;
}) {
  const noteText = typeof note === "string" ? note : note ? "準備中" : null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>
          {label}
          {noteText && (
            <span className="ml-1 text-[10px] text-gray-300">({noteText})</span>
          )}
        </span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
