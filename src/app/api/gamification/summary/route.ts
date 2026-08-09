import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { getLevelInfo } from "@/lib/gamification/levels";
import { resolveGamificationScope } from "@/lib/api/response-shaping";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient();
  const scope = resolveGamificationScope(new URL(req.url).searchParams.get("scope"));

  const [{ data: profile }, { data: userBadges }, { data: allBadges }, { data: recentXp }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, xp, current_streak").eq("id", authUser.id).single(),
    supabase.from("user_badges").select("id, earned_at, badges(code, name, description, icon, rarity)").eq("user_id", authUser.id).order("earned_at", { ascending: false }).limit(12),
    supabase.from("badges").select("id, code, name, description, icon, rarity").order("rarity", { ascending: true }),
    supabase.from("xp_events").select("id, created_at, reason, amount").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(scope === "dashboard" ? 6 : 20),
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