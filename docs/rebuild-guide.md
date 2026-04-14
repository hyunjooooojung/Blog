# Blog Rebuild Guide — Next.js + Supabase

현재 프로젝트(Nest.js + Prisma + PostgreSQL)와 동일한 기능을 **Next.js + Supabase** 조합으로 새 Monorepo에서 처음부터 구현하는 가이드입니다.

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [Monorepo 초기 설정](#2-monorepo-초기-설정)
3. [Next.js 앱 설정](#3-nextjs-앱-설정)
4. [Supabase 설정](#4-supabase-설정)
5. [Phase 1 — 블로그 코어](#5-phase-1--블로그-코어)
6. [Phase 2 — 조회수 / 좋아요](#6-phase-2--조회수--좋아요)
7. [Phase 3 — 댓글 시스템](#7-phase-3--댓글-시스템)
8. [Phase 4 — 검색 / SEO / RSS / 애니메이션](#8-phase-4--검색--seo--rss--애니메이션)
9. [Phase 5 — TOC / OG 이미지](#9-phase-5--toc--og-이미지)
10. [배포 (Vercel)](#10-배포-vercel)

---

## 1. 기술 스택

| 영역 | 기술 |
|------|------|
| Monorepo | Turborepo + pnpm workspaces |
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | TailwindCSS v4 + shadcn/ui |
| 콘텐츠 | Markdown (`next-mdx-remote` + `rehype-pretty-code`) |
| DB / 백엔드 | Supabase (PostgreSQL + REST API) |
| 비밀번호 해싱 | `bcryptjs` (댓글 삭제용, Next.js API Route에서 실행) |
| 배포 | Vercel |

> **기존 프로젝트와의 차이**: Nest.js + Prisma + Railway 대신 Supabase + Next.js API Routes 사용. 별도 서버 없이 Vercel 단일 배포.

---

## 2. Monorepo 초기 설정

```bash
mkdir blog && cd blog
pnpm init
```

**루트 `package.json`**:
```json
{
  "name": "blog",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@10.27.0"
}
```

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`turbo.json`**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

---

## 3. Next.js 앱 설정

```bash
mkdir -p apps/web
cd apps/web
pnpm create next-app . --typescript --tailwind --app --no-src-dir
# src 디렉토리 사용하도록 수동 설정하거나, --src-dir 플래그 사용
```

### 설치할 패키지

```bash
# 콘텐츠
pnpm add next-mdx-remote rehype-pretty-code shiki rehype-slug gray-matter reading-time

# 테마
pnpm add next-themes

# 스타일
pnpm add tw-animate-css @tailwindcss/typography
pnpm add -D @tailwindcss/postcss

# Supabase
pnpm add @supabase/supabase-js

# 댓글 비밀번호 해싱
pnpm add bcryptjs
pnpm add -D @types/bcryptjs

# RSS
pnpm add feed
```

### 프로젝트 구조

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃 (metadata, ThemeProvider)
│   │   ├── page.tsx              # 홈 (최근 글 5개)
│   │   ├── about/page.tsx        # 소개 페이지
│   │   ├── posts/
│   │   │   ├── page.tsx          # 글 목록 (PostList 컴포넌트)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx      # 글 상세
│   │   │       └── opengraph-image.tsx  # OG 이미지
│   │   ├── api/
│   │   │   ├── views/[slug]/route.ts
│   │   │   ├── likes/[slug]/route.ts
│   │   │   ├── comments/[slug]/route.ts
│   │   │   └── comments/[id]/route.ts
│   │   ├── feed.xml/route.ts     # RSS 피드
│   │   ├── sitemap.ts            # sitemap.xml
│   │   └── robots.ts             # robots.txt
│   ├── components/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── PageTransition.tsx
│   │   ├── AnimateIn.tsx
│   │   ├── PostList.tsx          # 검색 포함
│   │   ├── CodeBlock.tsx         # 코드 복사 버튼
│   │   ├── ViewCounter.tsx
│   │   ├── LikeButton.tsx
│   │   ├── Comments.tsx
│   │   └── TableOfContents.tsx
│   └── lib/
│       ├── posts.ts              # Markdown 파일 읽기 유틸
│       ├── mdx.ts                # MDX 렌더링
│       ├── toc.ts                # 목차 추출
│       ├── constants.ts          # 사이트 상수
│       └── api.ts                # apiFetch 래퍼
├── content/posts/                # .md 블로그 글
└── .env.local
```

### 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> `SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 서버(API Route)에서만 사용.

---

## 4. Supabase 설정

Supabase 대시보드 → **SQL Editor**에서 아래 SQL 실행.

### 테이블 생성

```sql
-- 조회수
create table post_views (
  slug text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 좋아요
create table post_likes (
  slug text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 댓글
create table comments (
  id serial primary key,
  slug text not null,
  author text not null,
  password_hash text not null,
  content text not null,
  parent_id integer references comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index on comments(slug, created_at);
create index on comments(parent_id);
```

### RPC 함수 (원자적 증가)

```sql
-- 조회수 upsert: 없으면 생성, 있으면 +1 (race condition 없음)
create or replace function increment_view(p_slug text)
returns json
language sql
as $$
  insert into post_views (slug, count, updated_at)
  values (p_slug, 1, now())
  on conflict (slug)
  do update set count = post_views.count + 1, updated_at = now()
  returning json_build_object('slug', slug, 'count', count);
$$;

-- 좋아요 upsert: 동일 패턴
create or replace function increment_like(p_slug text)
returns json
language sql
as $$
  insert into post_likes (slug, count, updated_at)
  values (p_slug, 1, now())
  on conflict (slug)
  do update set count = post_likes.count + 1, updated_at = now()
  returning json_build_object('slug', slug, 'count', count);
$$;
```

### RLS 정책

```sql
-- RLS 활성화
alter table post_views enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;

-- post_views: 누구나 읽기 가능, 쓰기는 service_role만
create policy "public read views" on post_views for select using (true);
create policy "service write views" on post_views for all using (auth.role() = 'service_role');

-- post_likes: 동일
create policy "public read likes" on post_likes for select using (true);
create policy "service write likes" on post_likes for all using (auth.role() = 'service_role');

-- comments: 누구나 읽기, 쓰기/삭제는 service_role만
create policy "public read comments" on comments for select using (true);
create policy "service write comments" on comments for all using (auth.role() = 'service_role');
```

---

## 5. Phase 1 — 블로그 코어

### `src/lib/constants.ts`

```ts
export const SITE_URL = "https://your-domain.com";
export const SITE_NAME = "your-blog";
export const SITE_DESCRIPTION = "블로그 설명";
export const AUTHOR_NAME = "작성자명";
```

### `src/lib/posts.ts`

```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const postsDirectory = path.join(process.cwd(), "content/posts");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: string;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const { data, content } = matter(fs.readFileSync(path.join(postsDirectory, file), "utf8"));
      return {
        slug,
        title: data.title,
        description: data.description,
        date: data.date,
        tags: data.tags ?? [],
        readingTime: readingTime(content).text,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags ?? [],
    readingTime: readingTime(content).text,
    content,
  };
}

export function getAllSlugs(): string[] {
  return fs.readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
```

### `src/lib/mdx.ts`

```ts
import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import type { Options } from "rehype-pretty-code";
import CodeBlock from "@/components/CodeBlock";

const prettyCodeOptions: Options = {
  theme: "github-dark-default",
  keepBackground: true,
};

export async function renderMDX(source: string) {
  const { content } = await compileMDX({
    source,
    components: { pre: CodeBlock },
    options: {
      mdxOptions: {
        // rehypeSlug을 먼저 실행해야 헤딩 ID가 생성됨
        rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
      },
    },
  });
  return content;
}
```

### 다크모드 — `src/components/theme-provider.tsx`

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

### 글 frontmatter 스펙

```yaml
---
title: "글 제목"
description: "글 요약"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
---
```

---

## 6. Phase 2 — 조회수 / 좋아요

### `src/lib/supabase.ts`

```ts
import { createClient } from "@supabase/supabase-js";

// 서버 전용 (API Route에서만 import)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### `src/lib/api.ts` (apiFetch 래퍼)

```ts
// 브라우저에서 Next.js API Route로 요청하는 래퍼
// base URL이 없으면 상대경로로 동작 (Vercel 배포 시 자동으로 현재 도메인)
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
```

### `src/app/api/views/[slug]/route.ts`

```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase
    .from("post_views")
    .select("slug, count")
    .eq("slug", slug)
    .single();
  return NextResponse.json({ slug, count: data?.count ?? 0 });
}

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await supabase.rpc("increment_view", { p_slug: slug });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### `src/app/api/likes/[slug]/route.ts`

```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabase
    .from("post_likes")
    .select("slug, count")
    .eq("slug", slug)
    .single();
  return NextResponse.json({ slug, count: data?.count ?? 0 });
}

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await supabase.rpc("increment_like", { p_slug: slug });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### `src/components/ViewCounter.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ViewCounter({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const posted = useRef(false);

  useEffect(() => {
    if (posted.current) return;
    posted.current = true;
    apiFetch<{ count: number }>(`/views/${slug}`, { method: "POST" })
      .then((d) => setCount(d.count))
      .catch(() => setCount(null));
  }, [slug]);

  if (count === null) return <span>—</span>;
  return <span>{count.toLocaleString()}회 읽음</span>;
}
```

### `src/components/LikeButton.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const storageKey = (slug: string) => `liked:${slug}`;

export default function LikeButton({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    setLiked(!!localStorage.getItem(storageKey(slug)));
    apiFetch<{ count: number }>(`/likes/${slug}`)
      .then((d) => setCount(d.count))
      .catch(() => setCount(null));
  }, [slug]);

  async function handleLike() {
    if (liked || count === null) return;
    const prev = count;
    setCount(count + 1);
    setLiked(true);
    setPopping(true);
    setTimeout(() => setPopping(false), 350);
    try {
      const d = await apiFetch<{ count: number }>(`/likes/${slug}`, { method: "POST" });
      setCount(d.count);
      localStorage.setItem(storageKey(slug), "1");
    } catch {
      setCount(prev);
      setLiked(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={liked || count === null}
      aria-label={liked ? "이미 좋아요를 눌렀습니다" : "좋아요"}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span aria-hidden className={popping ? "animate-heart-pop" : ""}>
        {liked ? "♥" : "♡"}
      </span>
      <span>{count ?? "—"}</span>
    </button>
  );
}
```

> `animate-heart-pop`은 `globals.css`에 `@keyframes` 정의 필요:
> ```css
> @keyframes heart-pop {
>   0%   { transform: scale(1); }
>   40%  { transform: scale(1.4); }
>   70%  { transform: scale(0.9); }
>   100% { transform: scale(1); }
> }
> .animate-heart-pop { animation: heart-pop 350ms ease-out; }
> ```

---

## 7. Phase 3 — 댓글 시스템

### `src/app/api/comments/[slug]/route.ts`

```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// GET: 댓글 목록 (부모 댓글 + replies 포함)
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("comments")
    .select("id, slug, author, content, parent_id, created_at")
    .eq("slug", slug)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 트리 구조 조립: parent_id가 null인 댓글에 replies 붙이기
  const roots = (data ?? []).filter((c) => c.parent_id === null);
  const replies = (data ?? []).filter((c) => c.parent_id !== null);

  const tree = roots.map((root) => ({
    ...root,
    replies: replies.filter((r) => r.parent_id === root.id),
  }));

  return NextResponse.json(tree);
}

// POST: 댓글 작성
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json();
  const { author, password, content, parentId } = body;

  // 입력 검증
  if (!author || author.length > 50) return NextResponse.json({ error: "Invalid author" }, { status: 400 });
  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });
  if (!content || content.length > 2000) return NextResponse.json({ error: "Invalid content" }, { status: 400 });

  // 1-depth 대댓글 제한
  if (parentId != null) {
    const { data: parent } = await supabase
      .from("comments")
      .select("parent_id")
      .eq("id", parentId)
      .single();
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    if (parent.parent_id !== null)
      return NextResponse.json({ error: "대댓글에는 답글을 달 수 없습니다" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("comments")
    .insert({ slug, author, password_hash: passwordHash, content, parent_id: parentId ?? null })
    .select("id, slug, author, content, parent_id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

### `src/app/api/comments/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// DELETE: 비밀번호 검증 후 삭제 (CASCADE로 대댓글도 삭제)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { password } = await req.json();

  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

  const { data: comment } = await supabase
    .from("comments")
    .select("id, password_hash")
    .eq("id", Number(id))
    .single();

  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const valid = await bcrypt.compare(password, comment.password_hash);
  if (!valid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("comments").delete().eq("id", Number(id));
  return NextResponse.json({ id: Number(id) });
}
```

### `src/components/Comments.tsx`

기존 코드를 그대로 사용. `apiFetch`가 `/api` prefix를 자동으로 붙이므로 변경 불필요.

> 삭제 에러 처리: `err.message.includes("403")` → "비밀번호가 올바르지 않습니다."

---

## 8. Phase 4 — 검색 / SEO / RSS / 애니메이션

### 검색 — `src/components/PostList.tsx`

클라이언트 사이드 제목 검색 + 하이라이팅. 검색어 매칭 부분을 `<mark>` 태그로 강조.

```tsx
"use client";
import { useState } from "react";
// ... highlight 함수 및 필터링 로직
function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}
```

### SEO

**`src/lib/constants.ts`**에 `SITE_URL`, `SITE_NAME`, `AUTHOR_NAME` 정의 후:

**`src/app/layout.tsx`** — 루트 metadata:
```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "블로그명", template: "%s | 블로그명" },
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "ko_KR" },
  twitter: { card: "summary" },
  alternates: {
    canonical: SITE_URL,
    types: { "application/rss+xml": "/feed.xml" },
  },
};
```

**`src/app/posts/[slug]/page.tsx`** — 글별 metadata:
```ts
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `${SITE_URL}/posts/${slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title, description: post.description,
      type: "article", publishedTime: post.date, tags: post.tags, url,
    },
    twitter: { title: post.title, description: post.description },
  };
}
```

**JSON-LD** (글 상세 페이지 컴포넌트 내):
```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  author: { "@type": "Person", name: AUTHOR_NAME },
  url: `${SITE_URL}/posts/${slug}`,
  keywords: post.tags,
};
// JSX에서:
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

**`src/app/sitemap.ts`**:
```ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/posts`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...posts.map((p) => ({
      url: `${SITE_URL}/posts/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
```

**`src/app/robots.ts`**:
```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

### RSS — `src/app/feed.xml/route.ts`

```ts
import { Feed } from "feed";
import { getAllPosts } from "@/lib/posts";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, AUTHOR_NAME } from "@/lib/constants";

export const dynamic = "force-static";

export async function GET() {
  const posts = getAllPosts();
  const feed = new Feed({
    title: SITE_NAME, description: SITE_DESCRIPTION,
    id: SITE_URL, link: SITE_URL, language: "ko",
    copyright: `All rights reserved ${new Date().getFullYear()}, ${AUTHOR_NAME}`,
    author: { name: AUTHOR_NAME, link: SITE_URL },
  });
  posts.forEach((p) => {
    feed.addItem({
      title: p.title, id: `${SITE_URL}/posts/${p.slug}`,
      link: `${SITE_URL}/posts/${p.slug}`, description: p.description,
      date: new Date(p.date), category: p.tags.map((t) => ({ name: t })),
    });
  });
  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

### 애니메이션

**`src/components/PageTransition.tsx`** — 페이지 전환 fade:
```tsx
"use client";
import { usePathname } from "next/navigation";
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  );
}
```

**`src/components/AnimateIn.tsx`** — 스크롤 진입 시 fade + slide:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";
export default function AnimateIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
    >
      {children}
    </div>
  );
}
```

> `PostList`에서 각 글 카드에 `<AnimateIn delay={i * 60}>` 적용 → 스태거 효과

---

## 9. Phase 5 — TOC / OG 이미지

### TOC 유틸리티 — `src/lib/toc.ts`

```ts
export interface Heading { id: string; text: string; level: 2 | 3; }

// rehype-slug(github-slugger)와 동일한 슬러그 알고리즘
function slugify(text: string): string {
  return text
    .toLowerCase().trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "")
    .replace(/\s/g, "-");
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (line.startsWith("```")) { inFence = !inFence; continue; }
    if (inFence) continue;
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      headings.push({ id: slugify(match[2].trim()), text: match[2].trim(), level: match[1].length as 2 | 3 });
    }
  }
  return headings;
}
```

### TOC 컴포넌트 — `src/components/TableOfContents.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import type { Heading } from "@/lib/toc";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) setActiveId(e.target.id); },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;
  return (
    <nav aria-label="목차">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">목차</p>
      <ul className="space-y-1.5 text-sm">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? "pl-3" : ""}>
            <a href={`#${id}`} className={`block leading-snug transition-colors hover:text-foreground ${
              activeId === id ? "font-medium text-foreground" : "text-muted-foreground"
            }`}>{text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### 글 상세 페이지 레이아웃 (TOC 포함)

```tsx
// page.tsx 내 PostPage 컴포넌트
const headings = extractHeadings(post.content);
const content = await renderMDX(post.content);

return (
  <div className="mx-auto max-w-3xl px-6 py-16 xl:max-w-6xl">
    <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-16">
      <article>
        {/* 헤더, 본문, LikeButton, Comments */}
      </article>
      {headings.length > 0 && (
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      )}
    </div>
  </div>
);
```

### OG 이미지 — `src/app/posts/[slug]/opengraph-image.tsx`

```tsx
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";
import { SITE_NAME } from "@/lib/constants";

export const runtime = "nodejs"; // fs 사용을 위해 필요
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "64px 80px",
        background: "linear-gradient(135deg, #0f0f11 0%, #18181b 100%)",
      }}>
        <div style={{ color: "#a78bfa", fontSize: 22, fontWeight: 600 }}>{SITE_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ color: "#fafafa", fontSize: 54, fontWeight: 700, lineHeight: 1.2, maxWidth: 900 }}>
            {post.title}
          </div>
          <div style={{ color: "#a1a1aa", fontSize: 26, maxWidth: 860 }}>
            {post.description}
          </div>
        </div>
        <div style={{ color: "#71717a", fontSize: 20 }}>
          {new Date(post.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          {post.tags.length > 0 && `  ·  ${post.tags.join(", ")}`}
        </div>
      </div>
    ),
    size
  );
}
```

---

## 10. 배포 (Vercel)

1. GitHub에 새 레포 생성 후 push
2. [vercel.com](https://vercel.com) → Import Project → `apps/web` 선택
3. Environment Variables 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL   = (Supabase 프로젝트 URL)
   SUPABASE_SERVICE_ROLE_KEY  = (Supabase service_role 키)
   ```
4. Deploy

> Supabase 무료 플랜(Free tier)으로 개인 블로그 충분히 커버 가능. 별도 서버(Railway 등) 불필요.

---

## 현재 프로젝트와의 주요 차이점

| | 현재 프로젝트 | 새 프로젝트 |
|---|---|---|
| 백엔드 서버 | Nest.js (Railway 배포) | 없음 |
| DB | Prisma + PostgreSQL | Supabase |
| API | `NEXT_PUBLIC_API_URL` 외부 호출 | Next.js API Route 내부 호출 |
| 비밀번호 | `bcrypt` (네이티브) | `bcryptjs` (순수 JS) |
| 공유 타입 | `@blog/shared` 패키지 | 각 앱에서 직접 타입 정의 |
| 배포 | Vercel + Railway | Vercel 단독 |
