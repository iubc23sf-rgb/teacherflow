import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/logError";
import EventForm from "@/components/events/EventForm";
import EventList from "@/components/events/EventList";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const { data: events, error: eventsError } = await supabase
    .from("school_events")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: false });
  logSupabaseError("events.events", eventsError);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">行事・部活・校務分掌</h1>

      <EventForm />
      <EventList events={(events ?? []) as any} />
    </div>
  );
}
