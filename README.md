# 개발 블로그

Next.js 16 + Supabase로 만든 개인 개발 블로그.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | TailwindCSS v4 + shadcn/ui |
| 콘텐츠 | Markdown (next-mdx-remote + rehype-pretty-code) |
| DB / 백엔드 | Supabase (PostgreSQL + REST API) |
| 배포 | Vercel |
| Monorepo | Turborepo + pnpm workspaces |

## 시작하기

### 환경변수 설정

`apps/web/.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 개발 서버 실행

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`에서 확인.

## 구조

```
blog/
├── apps/
│   └── web/              # Next.js (프론트엔드 + API Routes)
│       ├── content/posts/ # .md 블로그 글
│       └── src/
│           ├── app/       # 페이지 + API Routes
│           ├── components/
│           └── lib/
├── package.json
└── turbo.json
```

## 글 작성

`apps/web/content/posts/` 에 `.md` 파일 추가:

```yaml
---
title: "글 제목"
description: "글 요약"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
---

본문 내용...
```
