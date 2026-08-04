import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Sparkles, Target, Trophy } from "lucide-react";

export default async function LandingPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  const features = [
    { icon: Calendar, title: "Weekly Planner & Calendar", desc: "Plan your week and see everything on a unified calendar." },
    { icon: Target, title: "Skill Progress Tracking", desc: "Log hours, track levels, and watch your skills grow." },
    { icon: Trophy, title: "Gamification", desc: "Earn XP, level up, and unlock badges as you make progress." },
    { icon: Sparkles, title: "Smart Notifications", desc: "Daily digests via push and email keep you on track." },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Sparkles className="h-6 w-6 text-primary" />
          SkillForge
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="container flex flex-col items-center text-center py-20 gap-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
          Your personal <span className="text-primary">learning & productivity</span> operating system
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Plan your weeks, track skills, and achieve your goals — all in one place.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
            <f.icon className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="container py-8 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} SkillForge. All rights reserved.
      </footer>
    </main>
  );
}
