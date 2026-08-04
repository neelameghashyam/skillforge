import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAuthUser } from "@/lib/supabase/get-auth-user";

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const toEmail = authUser.email;
  if (!toEmail) {
    return NextResponse.json({ ok: false, error: "Email address not found" }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    return NextResponse.json({ ok: false, error: "SMTP settings are not configured" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif; max-width:560px; margin:0 auto; color:#1f2937;">
      <h1 style="color:#6366f1;">SkillForge test email</h1>
      <p>This is a test email from SkillForge to verify your email settings.</p>
      <p>If you received this, email sending is working.</p>
    </div>
  `;

  try {
    await transporter.sendMail({ from, to: toEmail, subject: "SkillForge test email", html });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}