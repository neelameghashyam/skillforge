import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-auth-user";
import type { Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];

interface CrudOptions<T extends z.ZodTypeAny> {
  table: TableName;
  insertSchema: T;
  updateSchema?: z.ZodTypeAny;
  defaultOrder?: { column: string; ascending?: boolean };
  searchableFilters?: string[];
}

export function createCollectionHandlers<T extends z.ZodTypeAny>(opts: CrudOptions<T>) {
  async function GET(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClient();

    let query = supabase.from(opts.table).select("*").eq("user_id", authUser.id);

    const { searchParams } = new URL(req.url);
    for (const key of opts.searchableFilters ?? []) {
      const val = searchParams.get(key);
      if (val) query = query.eq(key, val);
    }
    const gte = searchParams.get("from");
    const lte = searchParams.get("to");
    const dateColumn = searchParams.get("dateColumn");
    if (gte && dateColumn) query = query.gte(dateColumn, gte);
    if (lte && dateColumn) query = query.lte(dateColumn, lte);

    if (opts.defaultOrder) {
      query = query.order(opts.defaultOrder.column, { ascending: opts.defaultOrder.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  async function POST(req: NextRequest) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClient();

    const body = await req.json().catch(() => null);
    const parsed = opts.insertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
    }

    const { data, error } = await supabase
      .from(opts.table)
      .insert({ ...parsed.data, user_id: authUser.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  }

  return { GET, POST };
}

export function createItemHandlers(opts: { table: TableName; updateSchema: z.ZodTypeAny }) {
  async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClient();

    const { data, error } = await supabase
      .from(opts.table)
      .select("*")
      .eq("id", params.id)
      .eq("user_id", authUser.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ data });
  }

  async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClient();

    const body = await req.json().catch(() => null);
    const parsed = opts.updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
    }

    const { data, error } = await supabase
      .from(opts.table)
      .update(parsed.data)
      .eq("id", params.id)
      .eq("user_id", authUser.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createClient();

    const { error } = await supabase
      .from(opts.table)
      .delete()
      .eq("id", params.id)
      .eq("user_id", authUser.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return { GET, PATCH, DELETE };
}