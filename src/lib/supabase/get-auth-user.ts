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

export async function getProfileUserId(req: NextRequest): Promise<string | null> {
  const authUser = await getAuthUser(req);
  if (!authUser) return null;

  const supabase = createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profile?.id) return profile.id;

  if (profileError) {
    console.error("Failed to resolve profile for user", profileError.message);
  }

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .insert({
      id: authUser.id,
      full_name: authUser.email?.split("@")[0] ?? null,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("Failed to create profile for user", createError.message);
    return authUser.id;
  }

  return createdProfile?.id ?? authUser.id;
}