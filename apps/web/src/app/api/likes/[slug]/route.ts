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
    return NextResponse.json({ count: 0, liked: false });
  }

  const hash = visitorHash(req);

  const [countResult, likedResult] = await Promise.all([
    supabase.from("post_likes").select("count").eq("slug", slug).maybeSingle(),
    supabase
      .from("like_events")
      .select("slug")
      .eq("slug", slug)
      .eq("visitor_hash", hash)
      .maybeSingle(),
  ]);

  if (countResult.error) {
    return NextResponse.json({ error: countResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: (countResult.data as PostCount | null)?.count ?? 0,
    // likedResult 에러(like_events 미존재 등)는 false로 폴백
    liked: likedResult.data !== null,
  });
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

  const { error: dedupError } = await supabase
    .from("like_events")
    .insert({ slug, visitor_hash: hash });

  // 23505 = PostgreSQL unique_violation — 이미 좋아요한 방문자
  if (dedupError?.code === "23505") {
    return NextResponse.json({ success: true, alreadyLiked: true });
  }

  const { error } = await supabase.rpc("increment_like", { post_slug: slug });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
