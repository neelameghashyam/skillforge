import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TooltipProvider } from "@/components/ui/tooltip";

const Sidebar = dynamic(() => import("@/components/layout/sidebar").then((mod) => mod.Sidebar), { ssr: false });
const Topbar = dynamic(() => import("@/components/layout/topbar").then((mod) => mod.Topbar), { ssr: false });

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
