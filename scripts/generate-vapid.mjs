#!/usr/bin/env node
// Generates a VAPID key pair for Web Push and prints .env-ready output.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\nVAPID keys generated. Add these to your .env / .env.local:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("\nAlso set these as Supabase Edge Function secrets:");
console.log(`  supabase secrets set VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`  supabase secrets set VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("  supabase secrets set VAPID_SUBJECT=mailto:admin@yourdomain.com\n");
