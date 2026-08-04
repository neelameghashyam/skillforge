import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 font-bold text-2xl">
          <Sparkles className="h-7 w-7 text-primary" />
          SkillForge
        </Link>
        <div className="rounded-xl border bg-card shadow-sm p-8">{children}</div>
      </div>
    </div>
  );
}
