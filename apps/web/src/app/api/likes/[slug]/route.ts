import { type NextRequest, NextResponse } from "next/server";
import { supabase, type PostCount } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  const { data, error } = await supabase
    .from("post_likes")
    .select("count")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: (data as PostCount | null)?.count ?? 0 });
}

export async function POST(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  if (!supabase) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.rpc("increment_like", { post_slug: slug });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
