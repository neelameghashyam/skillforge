#!/usr/bin/env node
// Creates a demo user (demo@skillforge.app / SkillForge123!) via the Supabase
// Admin API with the fixed UUID expected by supabase/seed.sql, then runs the
// seed SQL through the Supabase CLI. Requires SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY (local defaults are provided by `supabase start`).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

if (!SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Run `supabase start` and copy the printed service_role key.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Creating demo user...");

  const { data: existing } = await supabase.auth.admin.getUserById(DEMO_USER_ID).catch(() => ({ data: null }));

  if (!existing?.user) {
    const { error } = await supabase.auth.admin.createUser({
      email: "demo@skillforge.app",
      password: "SkillForge123!",
      email_confirm: true,
      user_id: DEMO_USER_ID,
      user_metadata: { full_name: "Demo User" },
    });
    if (error) {
      console.error("Failed to create demo user:", error.message);
      console.error("If your Supabase version doesn't support specifying user_id, create the user via the dashboard and update supabase/seed.sql with the real UUID.");
      process.exit(1);
    }
    console.log("Demo user created: demo@skillforge.app / SkillForge123!");
  } else {
    console.log("Demo user already exists.");
  }

  console.log("\nNow run the seed SQL against your database:");
  console.log("  supabase db execute -f supabase/seed.sql   (or paste it into the Supabase SQL editor)");
}

main();
