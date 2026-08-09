import { NextRequest, NextResponse } from "next/server";
import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import { skillSchema } from "@/lib/validations/schemas";
import { resolveSkillSelect } from "@/lib/api/response-shaping";

const baseHandlers = createCollectionHandlers({
  table: "skills",
  insertSchema: skillSchema,
  defaultOrder: { column: "created_at", ascending: false },
  searchableFilters: ["category","level"],
});

async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const compact = searchParams.get("compact") === "true";
  const supabase = createClient();

  const select = resolveSkillSelect(compact);
  let query = supabase
    .from("skills")
    .select(select)
    .eq("user_id", authUser.id);

  for (const key of ["category", "level"]) {
    const value = searchParams.get(key);
    if (value) query = query.eq(key, value);
  }

  const gte = searchParams.get("from");
  const lte = searchParams.get("to");
  const dateColumn = searchParams.get("dateColumn");
  if (gte && dateColumn) query = query.gte(dateColumn, gte);
  if (lte && dateColumn) query = query.lte(dateColumn, lte);

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

export const { POST } = baseHandlers;
export { GET };
