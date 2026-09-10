---
title: "첫 번째 글"
description: "Next.js + Supabase 블로그를 직접 만들면서 배운 것들"
date: "2026-04-14"
category: "ETC"
tags: ["Next.js", "TypeScript", "블로그"]
---

## 블로그를 직접 만드는 이유

개발자라면 한 번쯤 블로그를 직접 만들어보고 싶다는 생각을 한다.
이 블로그는 TypeScript를 학습하면서 **Next.js + Supabase** 조합으로 처음부터 구현했다.

## 기술 스택 선택 이유

Python/FastAPI 백엔드를 주로 다뤘기 때문에 프론트엔드는 낯설었다.
하지만 Next.js의 **App Router**와 **Server Components** 개념이 FastAPI의 라우터와 유사한 구조를 가지고 있어 적응이 빠르다는 걸 알았다.

### Supabase를 선택한 이유

- 별도 백엔드 서버 없이 Vercel 단독 배포 가능
- PostgreSQL 기반으로 기존 SQL 지식 활용
- 무료 플랜으로 개인 블로그 충분히 운용 가능

## 코드 예제

```typescript
// Next.js 16에서 params는 Promise
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // 반드시 await 필요
  const post = getPostBySlug(slug);
  if (!post) notFound();
  return <article>{post.title}</article>;
}
```

## 다음 단계

- Phase 2: Supabase 연동 + 조회수/좋아요 API
- Phase 3: 댓글 시스템
- Phase 4: 검색, SEO, RSS

긴 여정이지만 하나씩 만들어가는 재미가 있다.
