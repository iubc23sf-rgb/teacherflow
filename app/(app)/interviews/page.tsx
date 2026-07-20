import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import InterviewForm from "@/components/interviews/InterviewForm";
import InterviewList from "@/components/interviews/InterviewList";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [
    { data: interviews, error: interviewsError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    supabase
      .from("interview_records")
      .select("*, classes(name)")
      .eq("user_id", userId)
      .order("interview_date", { ascending: false }),
    supabase
      .from("classes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);
  logSupabaseError("interviews.interviews", interviewsError);
  logSupabaseError("interviews.classes", classesError);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">面談記録</h1>

      <InterviewForm classes={classes ?? []} />
      <InterviewList interviews={(interviews ?? []) as any} />
    </div>
  );
}
