import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import LessonProgressForm from "@/components/lessonProgress/LessonProgressForm";
import LessonProgressList from "@/components/lessonProgress/LessonProgressList";

export const dynamic = "force-dynamic";

export default async function LessonProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [
    { data: progress, error: progressError },
    { data: subjects, error: subjectsError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("*, subjects(name, color), classes(name)")
      .eq("user_id", userId)
      .order("target_test_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("classes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);
  logSupabaseError("lessonProgress.progress", progressError);
  logSupabaseError("lessonProgress.subjects", subjectsError);
  logSupabaseError("lessonProgress.classes", classesError);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">授業進度管理</h1>

      <LessonProgressForm subjects={subjects ?? []} classes={classes ?? []} />
      <LessonProgressList progress={(progress ?? []) as any} />
    </div>
  );
}
