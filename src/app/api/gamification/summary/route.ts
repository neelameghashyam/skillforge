import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { getLevelInfo } from "@/lib/gamification/levels";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();

  const [{ data: profile }, { data: userBadges }, { data: allBadges }, { data: recentXp }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).single(),
    supabase.from("user_badges").select("*, badges(*)").eq("user_id", authUser.id).order("earned_at", { ascending: false }),
    supabase.from("badges").select("*").order("rarity", { ascending: true }),
    supabase.from("xp_events").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const levelInfo = getLevelInfo(profile.xp);
  const earnedCodes = new Set((userBadges ?? []).map((ub: any) => ub.badges?.code));
  const lockedBadges = (allBadges ?? []).filter((b) => !earnedCodes.has(b.code));

  return NextResponse.json({
    data: {
      profile,
      levelInfo,
      earnedBadges: userBadges ?? [],
      lockedBadges,
      recentXp: recentXp ?? [],
    },
  });
}