import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// env 없이도 로컬 dev 가능 — API Routes에서 null 체크 필수
// Next.js의 fetch 확장이 Supabase 내부 요청을 캐시하지 않도록 no-store 강제
export const supabase =
  url && key
    ? createClient(url, key, {
        global: {
          fetch: (input, init) =>
            fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;

// 쿼리 결과 타입 — route handlers에서 캐스팅에 사용
export interface PostCount {
  count: number;
}
