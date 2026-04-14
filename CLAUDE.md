@AGENTS.md

# Blog Project

## 기술 스택
- Monorepo: Turborepo + pnpm workspaces
- Frontend + API (`apps/web`): Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + shadcn/ui
- DB / 백엔드: Supabase (PostgreSQL + REST API) — 별도 서버 없음
- Content: Markdown (next-mdx-remote + rehype-pretty-code)
- Package manager: pnpm

## 프로젝트 구조
```
blog/
├── apps/
│   └── web/          # Next.js (프론트엔드 + API Routes)
├── package.json      # 루트 (turbo)
└── turbo.json
```

## 구조 규칙 — web
- 블로그 글은 `apps/web/content/posts/*.md`에 작성
- 컴포넌트는 `apps/web/src/components/`에 작성
- 유틸리티는 `apps/web/src/lib/`에 작성
- 페이지는 `apps/web/src/app/` (App Router)
- API는 `apps/web/src/app/api/` (Route Handlers)
- 서버 컴포넌트가 기본값 — `useState`, `useEffect` 사용 시에만 `"use client"` 추가
- import alias `@/*`는 `src/` 기준
- TypeScript strict 모드 — `any` 사용 금지
- `src/lib/supabase.ts`는 서버 전용 — 클라이언트 컴포넌트에서 직접 import 금지

## 설계 문서
자세한 아키텍처는 `docs/architecture.md` 참고

## 커맨드
```bash
# 루트에서 전체 실행
pnpm dev              # 개발 서버 실행
pnpm build            # 빌드

# 개별 앱 실행
pnpm --filter web dev       # Next.js (http://localhost:3000)
```

## 글 frontmatter 스펙
```yaml
---
title: "글 제목"         # 필수
description: "글 요약"   # 필수
date: "YYYY-MM-DD"       # 필수
tags: ["tag1", "tag2"]   # 필수 (빈 배열 가능)
---
```

## 개발 현황
- **Phase 1 완료**: Next.js 블로그 코어 (페이지, Markdown 렌더링, 다크모드)
- **Phase 2 완료**: 조회수/좋아요 (Supabase + API Routes)
- **Phase 3 완료**: 댓글 시스템 (Supabase + bcryptjs, 익명 + 1-depth 대댓글)
- **Phase 4 완료**: 검색 (클라이언트 사이드), SEO (sitemap/robots/OG/JSON-LD), RSS 피드, 애니메이션/인터랙션
- **Phase 5 완료**: TOC (IntersectionObserver), OG 이미지 (next/og)
