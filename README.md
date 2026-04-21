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

`apps/web/.env.example`을 복사해 `apps/web/.env.local` 생성:

```bash
cp apps/web/.env.example apps/web/.env.local
```

필요한 환경변수:

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role 키 — 서버 전용, 절대 공개하지 말 것 |
| `VISITOR_HASH_SALT` | 조회수/좋아요 dedup용 해시 salt — 임의 문자열 |

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
