import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const AUTH_USER_ID_HEADER = "x-sf-user-id";
export const AUTH_USER_EMAIL_HEADER = "x-sf-user-email";

export interface AuthUser {
  id: string;
  email: string | null;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const headerUserId = req.headers.get(AUTH_USER_ID_HEADER);

  if (headerUserId) {
    return {
      id: headerUserId,
      email: req.headers.get(AUTH_USER_EMAIL_HEADER),
    };
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}