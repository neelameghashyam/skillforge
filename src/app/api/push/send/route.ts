import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const sendSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
});

/**
 * Sends a test / manual push notification to the current user's devices.
 * Used by Settings → "Send test notification".
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "title and body are required" }, { status: 422 });

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured on server" }, { status: 500 });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@skillforge.app", vapidPublicKey, vapidPrivateKey);

  const admin = createAdminClient();
  const { data: subs, error } = await admin.from("push_subscriptions").select("*").eq("user_id", authUser.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: "No push subscriptions found for this user" });
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: parsed.data.title, body: parsed.data.body, url: parsed.data.url ?? "/dashboard" })
      )
    )
  );

  const failedEntries = results
    .map((result, index) => {
      if (result.status === "rejected") {
        const error = result.reason as { message?: string; statusCode?: number };
        return {
          endpoint: subs[index]?.endpoint,
          message: error?.message ?? String(result.reason),
          statusCode: error?.statusCode ?? null,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ endpoint: string; message: string; statusCode: number | null }>;

  await Promise.all(
    failedEntries
      .filter((entry) => entry.statusCode === 404 || entry.statusCode === 410)
      .map((entry) => admin.from("push_subscriptions").delete().eq("endpoint", entry.endpoint))
  );

  return NextResponse.json({
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: failedEntries.length,
    errors: failedEntries,
  });
}