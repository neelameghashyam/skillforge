import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Intentionally using the system font stack (defined in tailwind's default
// `font-sans`) instead of `next/font/google` so production builds never
// depend on network access to fonts.googleapis.com (useful for Docker/CI
// environments without outbound internet). Swap in `next/font/google` if
// you'd like a custom webfont and have network access at build time.

export const metadata: Metadata = {
  title: "SkillForge — Personal Learning & Productivity OS",
  description: "Plan your week, track skills, and achieve your goals.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
