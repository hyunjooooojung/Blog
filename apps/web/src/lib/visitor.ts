import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

const SALT = process.env.VISITOR_HASH_SALT ?? "dev-salt";

export function visitorHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${SALT}:${ip}:${ua}`)
    .digest("hex")
    .slice(0, 32);
}
