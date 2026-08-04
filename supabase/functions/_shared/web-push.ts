// Minimal Web Push (RFC 8030 / VAPID) sender for Deno edge runtime.
// Uses the `web-push` npm package via Deno's npm compatibility layer so we
// don't have to hand-roll ECDH/aes128gcm payload encryption.
import webpush from "npm:web-push@3.6.7";

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@skillforge.app";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendWebPush(
  sub: PushSubscriptionRecord,
  payload: { title: string; body: string; url?: string; icon?: string }
): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    return { ok: false, statusCode, error: String(err) };
  }
}
