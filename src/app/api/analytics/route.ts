import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { subDays, formatISO } from "date-fns";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 30);
  const since = formatISO(subDays(new Date(), days), { representation: "date" });

  const [
    { data: dailyActivity },
    { data: skillDistribution },
    { data: tasksByStatus },
    { data: skills },
  ] = await Promise.all([
    supabase.from("v_daily_activity").select("*").eq("user_id", authUser.id).gte("day", since).order("day"),
    supabase.from("v_skill_distribution").select("*").eq("user_id", authUser.id),
    supabase.from("tasks").select("status").eq("user_id", authUser.id),
    supabase.from("skills").select("name, progress, logged_hours, target_hours, category").eq("user_id", authUser.id).eq("archived", false),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const t of tasksByStatus ?? []) {
    statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
  }

  return NextResponse.json({
    data: {
      dailyActivity: dailyActivity ?? [],
      skillDistribution: skillDistribution ?? [],
      tasksByStatus: statusCounts,
      skills: skills ?? [],
    },
  });
}