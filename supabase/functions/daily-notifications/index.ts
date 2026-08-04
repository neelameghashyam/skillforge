// Supabase Edge Function: daily-notifications
// Triggered hourly by pg_cron. For each user whose local time matches their
// configured daily_digest_time (within the current UTC hour window), builds
// and dispatches a digest across their enabled channels (push / email / in_app),
// plus per-item reminders for tasks due today and project deadlines approaching.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse, getEnv } from "../_shared/utils.ts";
import { sendWebPush } from "../_shared/web-push.ts";
import { sendEmail, digestEmailTemplate } from "../_shared/email.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY")
    );
    const appUrl = Deno.env.get("APP_URL") ?? "https://skillforge.app";

    const nowUtc = new Date();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, timezone, daily_digest_time, notification_prefs")
      .not("notification_prefs", "is", null);

    if (error) throw error;

    let dispatched = 0;
    const results: Record<string, unknown>[] = [];

    for (const profile of profiles ?? []) {
      const shouldSend = isDigestHour(nowUtc, profile.timezone, profile.daily_digest_time);
      if (!shouldSend) continue;

      const email = await getUserEmail(supabase, profile.id);
      const prefs = profile.notification_prefs as { push?: boolean; email?: boolean; in_app?: boolean };

      const today = new Date().toISOString().slice(0, 10);

      const [{ count: tasksToday }, { data: projects }] =
        await Promise.all([
          supabase.from("tasks").select("id", { count: "exact", head: true })
            .eq("user_id", profile.id).eq("scheduled_date", today).neq("status", "done"),
          supabase.from("projects").select("id, title, deadline").eq("user_id", profile.id)
            .not("deadline", "is", null).lte("deadline", addDays(today, 7)).neq("status", "completed"),
        ]);

      const title = "Your daily SkillForge digest";
      const body = `${tasksToday ?? 0} tasks due today.`;

      await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "daily_digest",
        channel: "in_app",
        title,
        body,
        link: "/dashboard",
        sent_at: new Date().toISOString(),
      });

      if (prefs?.push !== false) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", profile.id);
        for (const sub of subs ?? []) {
          const result = await sendWebPush(sub, { title, body, url: `${appUrl}/dashboard` });
          if (!result.ok && (result.statusCode === 404 || result.statusCode === 410)) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }

      if (prefs?.email !== false && email) {
        await sendEmail({
          to: email,
          subject: title,
          html: digestEmailTemplate({
            name: profile.full_name ?? "there",
            tasksToday: tasksToday ?? 0,
            projectsDueSoon: projects?.length ?? 0,
            appUrl,
          }),
        });
      }

      for (const project of projects ?? []) {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "project_deadline",
          channel: "in_app",
          title: `Deadline approaching: ${project.title}`,
          body: `Due ${project.deadline}`,
          link: "/projects",
          sent_at: new Date().toISOString(),
        });
      }

      dispatched++;
      results.push({ user_id: profile.id, tasksToday });
    }

    return jsonResponse({ ok: true, dispatched, results });
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});

function isDigestHour(nowUtc: Date, timezone: string, digestTime: string): boolean {
  try {
    const localHourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      hour12: false,
    }).format(nowUtc);
    const localHour = parseInt(localHourStr, 10) % 24;
    const digestHour = parseInt((digestTime || "08:00:00").split(":")[0], 10);
    return localHour === digestHour;
  } catch {
    return nowUtc.getUTCHours() === 8;
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getUserEmail(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}
