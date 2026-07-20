import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "due_date", label: "期限順" },
  { key: "priority", label: "重要度順" },
  { key: "subject_id", label: "科目別" },
] as const;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sortKey =
    SORTS.find((s) => s.key === searchParams.sort)?.key ?? "due_date";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order(sortKey, { ascending: true, nullsFirst: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">タスク</h1>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={`/tasks?sort=${s.key}`}
              className={`rounded-md px-3 py-1.5 ${
                sortKey === s.key
                  ? "bg-white font-medium shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <TaskForm />
      <TaskList tasks={tasks ?? []} />
    </div>
  );
}
