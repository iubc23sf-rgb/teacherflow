import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import ChatWindow from "@/components/assistant/ChatWindow";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const { data: session, error: sessionError } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  logSupabaseError("assistant.page.session", sessionError);

  let messages: any[] = [];
  if (session) {
    const { data, error: messagesError } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    logSupabaseError("assistant.page.messages", messagesError);
    messages = data ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">AIアシスタント</h1>
      <ChatWindow initialMessages={messages} />
    </div>
  );
}
