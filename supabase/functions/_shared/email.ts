import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const secure = Deno.env.get("SMTP_SECURE") === "true";
  const username = Deno.env.get("SMTP_USER");
  const password = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("SMTP_FROM") ?? "SkillForge <notifications@skillforge.app>";

  if (!host || !username || !password) {
    return { ok: false, error: "SMTP settings are not configured" };
  }

  
    const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: secure,
      auth: { username, password },
    },
  });

  try {
    await client.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  } finally {
    await client.close();
  }
}

export function digestEmailTemplate(opts: {
  name: string;
  tasksToday: number;
  projectsDueSoon: number;
  appUrl: string;
}) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color:#1f2937;">
    <h1 style="color:#6366f1;">Good morning, ${opts.name}! ☀️</h1>
    <p>Here's your SkillForge digest for today:</p>
    <ul style="line-height: 1.8;">
      <li><strong>${opts.tasksToday}</strong> tasks scheduled today</li>
      <li><strong>${opts.projectsDueSoon}</strong> project deadlines coming up</li>
    </ul>
    <a href="${opts.appUrl}/dashboard" style="display:inline-block; background:#6366f1; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; margin-top: 12px;">Open SkillForge</a>
    <p style="color:#6b7280; font-size: 12px; margin-top: 32px;">You're receiving this because daily digests are enabled in your SkillForge settings.</p>
  </div>`;
}
