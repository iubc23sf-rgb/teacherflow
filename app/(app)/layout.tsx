import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const displayName =
    profile?.display_name || user?.email?.split("@")[0] || "先生";

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar displayName={displayName} />
        <main className="flex-1 overflow-y-auto bg-gray-50 px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
