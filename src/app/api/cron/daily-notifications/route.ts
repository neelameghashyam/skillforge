import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel Cron entry point (configured in vercel.json) that triggers the
 * `daily-notifications` Supabase Edge Function. Kept as a thin proxy so the
 * notification-dispatch logic lives in one place (the Edge Function), while
 * still being schedulable from Vercel if the team prefers Vercel Cron over
 * pg_cron.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/daily-notifications`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
