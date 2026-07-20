import { logSupabaseError } from "@/lib/supabase/logError";

function formatDateParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function buildUserContext(supabase: any, userId: string) {
  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 14);

  const [
    { data: openTasks, error: tasksError },
    { data: interviews, error: interviewsError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, due_date, priority")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("due_date", { ascending: true })
      .limit(20),
    supabase
      .from("interview_records")
      .select("student_name, interview_date, interview_type")
      .eq("user_id", userId)
      .gte("interview_date", formatDateParam(now))
      .lte("interview_date", formatDateParam(weekAhead))
      .order("interview_date", { ascending: true }),
    supabase
      .from("school_events")
      .select("title, event_date, category")
      .eq("user_id", userId)
      .gte("event_date", formatDateParam(now))
      .lte("event_date", formatDateParam(weekAhead))
      .order("event_date", { ascending: true }),
  ]);

  logSupabaseError("assistant.context.tasks", tasksError);
  logSupabaseError("assistant.context.interviews", interviewsError);
  logSupabaseError("assistant.context.events", eventsError);

  const priorityLabel: Record<number, string> = { 1: "高", 2: "中", 3: "低" };

  const taskLines = (openTasks ?? []).map(
    (t: any) =>
      `- ${t.title}（期限: ${t.due_date ?? "なし"}, 重要度: ${
        priorityLabel[t.priority] ?? "中"
      }）`
  );
  const interviewLines = (interviews ?? []).map(
    (i: any) => `- ${i.interview_date} ${i.student_name}さん（${i.interview_type}）`
  );
  const eventLines = (events ?? []).map(
    (e: any) => `- ${e.event_date} ${e.title}（${e.category}）`
  );

  return `今日の日付: ${formatDateParam(now)}

# 未完了タスク一覧
${taskLines.length > 0 ? taskLines.join("\n") : "（登録されているタスクはありません）"}

# 今後2週間の面談予定
${interviewLines.length > 0 ? interviewLines.join("\n") : "（予定なし）"}

# 今後2週間の行事・部活・校務分掌の予定
${eventLines.length > 0 ? eventLines.join("\n") : "（予定なし）"}`;
}
