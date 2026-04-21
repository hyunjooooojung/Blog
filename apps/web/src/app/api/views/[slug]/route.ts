import { type NextRequest, NextResponse } from "next/server";
import { supabase, type PostCount } from "@/lib/supabase";
import { isValidSlug } from "@/lib/slug";
import { visitorHash } from "@/lib/visitor";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  const { data, error } = await supabase
    .from("post_views")
    .select("count")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: (data as PostCount | null)?.count ?? 0 });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ success: true });
  }

  const hash = visitorHash(req);
  const today = new Date().toISOString().slice(0, 10);

  const { error: dedupError } = await supabase
    .from("view_events")
    .insert({ slug, visitor_hash: hash, day: today });

  // 23505 = PostgreSQL unique_violation — 오늘 이미 카운트된 방문자
  if (dedupError?.code === "23505") {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.rpc("increment_view", { post_slug: slug });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
