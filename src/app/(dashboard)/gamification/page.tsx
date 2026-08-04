"use client";

import { useGamification } from "@/hooks/queries/use-gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, Star, Zap } from "lucide-react";
import { RARITY_COLORS } from "@/lib/gamification/levels";
import { cn, formatDate } from "@/lib/utils";
import * as Icons from "lucide-react";

export default function GamificationPage() {
  const { data, isLoading } = useGamification();

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading your achievements...</p>;
  }

  const { profile, levelInfo, earnedBadges, lockedBadges, recentXp } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements & Gamification</h1>
        <p className="text-muted-foreground">Level up, earn badges, and track your XP.</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                {levelInfo.level}
              </div>
              <div>
                <p className="font-semibold text-lg">Level {levelInfo.level}</p>
                <p className="text-sm text-muted-foreground">{profile.xp} total XP</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> {levelInfo.xpForNext - levelInfo.xpIntoLevel} XP to next level
            </Badge>
          </div>
          <Progress value={levelInfo.progressPct} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Badges</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {earnedBadges.map((ub) => (
                <BadgeTile key={ub.id} badge={ub.badges} earned earnedAt={ub.earned_at} />
              ))}
              {lockedBadges.map((b) => (
                <BadgeTile key={b.id} badge={b} earned={false} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent XP</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentXp.length === 0 && <p className="text-sm text-muted-foreground">No XP events yet — complete tasks or log skill practice to start earning XP!</p>}
            {recentXp.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground line-clamp-1">{event.reason}</span>
                <span className="font-medium text-primary shrink-0 ml-2">+{event.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BadgeTile({ badge, earned, earnedAt }: { badge: any; earned: boolean; earnedAt?: string }) {
  const Icon = (Icons as any)[toPascalCase(badge.icon)] || Star;
  const color = RARITY_COLORS[badge.rarity] ?? "#94a3b8";

  return (
    <div className={cn("rounded-xl border p-4 text-center space-y-2 relative", !earned && "opacity-50 grayscale")}>
      {!earned && <Lock className="h-3.5 w-3.5 absolute top-2 right-2 text-muted-foreground" />}
      <div className="h-12 w-12 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <p className="text-sm font-medium">{badge.name}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
      <Badge variant="outline" className="text-[10px] capitalize" style={{ borderColor: color, color }}>{badge.rarity}</Badge>
      {earned && earnedAt && <p className="text-[10px] text-muted-foreground">{formatDate(earnedAt)}</p>}
    </div>
  );
}

function toPascalCase(str: string) {
  return str.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}
