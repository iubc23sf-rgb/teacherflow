import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import { getOrCreateTimetableId } from "@/lib/supabase/timetables";
import MonthCalendar from "@/components/dashboard/MonthCalendar";
import WeekCalendar from "@/components/dashboard/WeekCalendar";

export const dynamic = "force-dynamic";

const PRIORITY_STYLE: Record<number, string> = {
  1: "bg-red-50 text-red-600",
  2: "bg-amber-50 text-amber-600",
  3: "bg-gray-100 text-gray-500",
};
const PRIORITY_LABEL: Record<number, string> = { 1: "高", 2: "中", 3: "低" };

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = 月曜
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function parseWeekParam(param?: string) {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [y, m, d] = param.split("-").map(Number);
    return startOfWeek(new Date(y, m - 1, d));
  }
  return startOfWeek(new Date());
}

function formatDateParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function parseMonthParam(param?: string) {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatMonthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthGrid(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0=月
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const gridStart = new Date(year, month, 1 - firstWeekday);

  const days = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function groupSlotsByDay(slots: any[], timetableId: string) {
  const byDay: Record<number, { id: string; name: string }[]> = {};
  slots
    .filter((s) => s.timetable_id === timetableId)
    .sort((a, b) => a.period - b.period)
    .forEach((s) => {
      byDay[s.day_of_week] = byDay[s.day_of_week] ?? [];
      byDay[s.day_of_week].push({ id: s.id, name: s.subjects?.name ?? "-" });
    });
  return byDay;
}

type DateBadge = { id: string; title: string; colorClass: string };

function addDateBadge(
  map: Record<string, DateBadge[]>,
  dateKey: string,
  badge: DateBadge
) {
  map[dateKey] = map[dateKey] ?? [];
  map[dateKey].push(badge);
}

const EVENT_CATEGORY_STYLE: Record<string, string> = {
  club: "bg-orange-100 text-orange-700",
  duty: "bg-slate-200 text-slate-700",
  event: "bg-green-100 text-green-700",
  other: "bg-gray-200 text-gray-600",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; week?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const monthDate = parseMonthParam(searchParams.month);
  const monthWeeks = buildMonthGrid(monthDate);
  const prevMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
  const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const monthGridStart = monthWeeks[0][0];
  const monthGridEnd = monthWeeks[monthWeeks.length - 1][6];

  const weekStart = parseWeekParam(searchParams.week);
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const [personalTimetableId, homeroomTimetableId] = await Promise.all([
    getOrCreateTimetableId(supabase, userId, "personal"),
    getOrCreateTimetableId(supabase, userId, "homeroom"),
  ]);

  const [
    { data: openTasks, error: openTasksError },
    { data: allTasksThisWeek, error: allTasksThisWeekError },
    { data: pdfTasks, error: pdfTasksError },
    { data: lessonProgress, error: lessonProgressError },
    { data: upcomingInterviews, error: upcomingInterviewsError },
    { data: allSlots, error: allSlotsError },
    { data: monthTasks, error: monthTasksError },
    { data: monthInterviews, error: monthInterviewsError },
    { data: monthEvents, error: monthEventsError },
    { data: recentDocuments, error: recentDocumentsError },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("due_date", { ascending: true })
      .limit(6),
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
    supabase
      .from("interview_records")
      .select("*, classes(name)")
      .eq("user_id", userId)
      .gte("interview_date", todayStart.toISOString().slice(0, 10))
      .order("interview_date", { ascending: true })
      .limit(5),
    supabase
      .from("timetable_slots")
      .select("*, subjects(name, color), classes(name)")
      .in("timetable_id", [personalTimetableId, homeroomTimetableId]),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("user_id", userId)
      .not("due_date", "is", null)
      .gte("due_date", formatDateParam(monthGridStart))
      .lte("due_date", formatDateParam(monthGridEnd)),
    supabase
      .from("interview_records")
      .select("id, student_name, interview_date")
      .eq("user_id", userId)
      .gte("interview_date", formatDateParam(monthGridStart))
      .lte("interview_date", formatDateParam(monthGridEnd)),
    supabase
      .from("school_events")
      .select("id, title, event_date, category")
      .eq("user_id", userId)
      .gte("event_date", formatDateParam(monthGridStart))
      .lte("event_date", formatDateParam(monthGridEnd)),
    supabase
      .from("documents")
      .select("id, file_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  logSupabaseError("dashboard.openTasks", openTasksError);
  logSupabaseError("dashboard.allTasksThisWeek", allTasksThisWeekError);
  logSupabaseError("dashboard.pdfTasks", pdfTasksError);
  logSupabaseError("dashboard.lessonProgress", lessonProgressError);
  logSupabaseError("dashboard.upcomingInterviews", upcomingInterviewsError);
  logSupabaseError("dashboard.allSlots", allSlotsError);
  logSupabaseError("dashboard.monthTasks", monthTasksError);
  logSupabaseError("dashboard.monthInterviews", monthInterviewsError);
  logSupabaseError("dashboard.monthEvents", monthEventsError);
  logSupabaseError("dashboard.recentDocuments", recentDocumentsError);

  const personalSlotsByDay = groupSlotsByDay(allSlots ?? [], personalTimetableId);
  const homeroomSlotsByDay = groupSlotsByDay(allSlots ?? [], homeroomTimetableId);

  const eventsByDate: Record<string, DateBadge[]> = {};
  (monthTasks ?? []).forEach((t: any) => {
    const key = new Date(`${t.due_date}T00:00:00`).toDateString();
    addDateBadge(eventsByDate, key, {
      id: `task-${t.id}`,
      title: t.title,
      colorClass: "bg-amber-100 text-amber-700",
    });
  });
  (monthInterviews ?? []).forEach((i: any) => {
    const key = new Date(`${i.interview_date}T00:00:00`).toDateString();
    addDateBadge(eventsByDate, key, {
      id: `interview-${i.id}`,
      title: `面談：${i.student_name}`,
      colorClass: "bg-purple-100 text-purple-700",
    });
  });
  (monthEvents ?? []).forEach((e: any) => {
    const key = new Date(`${e.event_date}T00:00:00`).toDateString();
    addDateBadge(eventsByDate, key, {
      id: `event-${e.id}`,
      title: e.title,
      colorClass: EVENT_CATEGORY_STYLE[e.category] ?? EVENT_CATEGORY_STYLE.other,
    });
  });

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

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <WeekCalendar
            weekDates={weekDates}
            personalSlotsByDay={personalSlotsByDay}
            homeroomSlotsByDay={homeroomSlotsByDay}
            todayKey={now.toDateString()}
            prevHref={`/dashboard?week=${formatDateParam(prevWeekStart)}`}
            nextHref={`/dashboard?week=${formatDateParam(nextWeekStart)}`}
          />
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">タスクリスト</h2>
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
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{task.title}</span>
                    {task.due_date && (
                      <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                        {new Date(task.due_date).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                        })}
                        まで
                      </span>
                    )}
                  </span>
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
      </div>

      <MonthCalendar
        weeks={monthWeeks}
        monthDate={monthDate}
        monthLabel={`${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`}
        prevHref={`/dashboard?month=${formatMonthParam(prevMonth)}`}
        nextHref={`/dashboard?month=${formatMonthParam(nextMonth)}`}
        todayKey={now.toDateString()}
        eventsByDate={eventsByDate}
      />

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
            <ProgressBar label="面談記録の進捗" value={0} color="bg-purple-500" note />
          </div>
        </section>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">次の授業</h2>
          <p className="text-sm text-gray-400">
            「今週の授業」から本日のコマを確認できます。
          </p>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              面談・連絡予定
            </h2>
            <Link
              href="/interviews"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + 追加
            </Link>
          </div>
          {upcomingInterviews && upcomingInterviews.length > 0 ? (
            <ul className="space-y-3 text-sm text-gray-600">
              {upcomingInterviews.map((interview: any) => (
                <li key={interview.id} className="flex items-center justify-between">
                  <span>
                    {new Date(interview.interview_date).toLocaleDateString(
                      "ja-JP",
                      { month: "numeric", day: "numeric" }
                    )}
                    　{interview.student_name}さん
                    {interview.classes?.name && `（${interview.classes.name}）`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              面談・連絡予定はまだありません。
            </p>
          )}
          <Link
            href="/interviews"
            className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            面談記録を見る →
          </Link>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              最近使用した資料
            </h2>
            <Link
              href="/documents"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + 追加
            </Link>
          </div>
          {recentDocuments && recentDocuments.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-600">
              {recentDocuments.map((doc: any) => (
                <li key={doc.id} className="truncate">
                  📄 {doc.file_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              資料はまだアップロードされていません。
            </p>
          )}
          <Link
            href="/documents"
            className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            すべての資料を見る →
          </Link>
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
