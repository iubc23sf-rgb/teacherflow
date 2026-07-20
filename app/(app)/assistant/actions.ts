"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import { getGeminiClient, CHAT_MODEL } from "@/lib/gemini/client";
import { buildUserContext } from "@/lib/gemini/context";

const SYSTEM_PREAMBLE = `あなたは教員向け業務管理アプリ「TeacherFlow」のAIアシスタントです。
以下はこの先生の現在のタスク・面談予定・行事予定です。この情報をもとに、
質問に日本語で簡潔に答えてください。分からないことは推測せず「分かりません」と答えてください。`;

async function getOrCreateChatSession(supabase: any, userId: string) {
  const { data: existing, error: selectError } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  logSupabaseError("assistant.selectSession", selectError);
  if (existing) return existing.id as string;

  const { data: created, error: insertError } = await supabase
    .from("ai_chat_sessions")
    .insert({ user_id: userId, title: "チャット" })
    .select("id")
    .single();
  logSupabaseError("assistant.createSession", insertError);
  return created?.id as string;
}

export async function sendMessage(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const sessionId = await getOrCreateChatSession(supabase, user.id);

  const { error: userInsertError } = await supabase
    .from("ai_chat_messages")
    .insert({ session_id: sessionId, role: "user", content });
  logSupabaseError("assistant.insertUserMessage", userInsertError);

  const { data: history, error: historyError } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  logSupabaseError("assistant.history", historyError);

  const userContext = await buildUserContext(supabase, user.id);

  let replyText =
    "すみません、うまく応答を生成できませんでした。もう一度お試しください。";
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: `${SYSTEM_PREAMBLE}\n\n${userContext}`,
    });

    const geminiHistory = (history ?? [])
      .slice(0, -1) // exclude the message we just sent; passed as the new prompt
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(content);
    replyText = result.response.text();
  } catch (err) {
    console.error("[gemini] sendMessage failed:", err);
  }

  const { error: assistantInsertError } = await supabase
    .from("ai_chat_messages")
    .insert({ session_id: sessionId, role: "assistant", content: replyText });
  logSupabaseError("assistant.insertAssistantMessage", assistantInsertError);

  revalidatePath("/assistant");
}
