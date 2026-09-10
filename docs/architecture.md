# 개발 블로그 아키텍처 & 스택 설계

## Context
Python/FastAPI 백엔드 개발자가 TypeScript를 학습하면서 직접 개발 블로그를 만들어 배포하려 함. Markdown 파일 기반 콘텐츠 관리, Vercel 단독 배포, Next.js 풀스택 구성(API Routes + Supabase).

---

## 아키텍처

```
┌───────────────────────────────────────────────────┐
│                    Vercel                          │
│  ┌─────────────────────────────────────────────┐  │
│  │  Next.js 16 (App Router)                    │  │
│  │  - SSG로 Markdown 블로그 글 렌더링           │  │
│  │  - React + TailwindCSS v4 + shadcn/ui UI    │  │
│  │  - 정적 페이지 (/, /posts, /about 등)        │  │
│  │  - API Routes (조회수/좋아요/댓글)           │  │
│  └──────────────────┬──────────────────────────┘  │
└─────────────────────┼──────────────────────────── ┘
                      │ Supabase JS SDK
                      ▼
┌───────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + REST API)                  │
│  - post_views, post_likes, comments 테이블         │
│  - RPC 함수 (increment_view, increment_like)       │
│  - RLS 정책 (공개 읽기, service_role 쓰기)         │
└───────────────────────────────────────────────────┘
```

> 별도 백엔드 서버 없이 Vercel 단독 배포. Next.js API Routes가 동적 기능 전부를 담당.

---

## 기술 스택 상세

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | **TypeScript** | 프론트/백 전체를 하나의 언어로 통일 |
| 프레임워크 | **Next.js 16 (App Router)** | React 최신 패턴(RSC, Server Actions) + API Routes 활용 |
| 스타일링 | **TailwindCSS v4 + shadcn/ui** | 빠른 UI 구성, 커스터마이징 용이 |
| 콘텐츠 | **Markdown** (next-mdx-remote + rehype-pretty-code) | .md 파일 → 정적 페이지 변환 |
| 코드 하이라이팅 | **rehype-pretty-code** (shiki 기반) | 개발 블로그 필수, 다양한 언어 지원 |
| DB / 백엔드 | **Supabase** (PostgreSQL + REST API) | 별도 서버 불필요, 무료 플랜으로 충분 |
| 비밀번호 해싱 | **bcryptjs** | 댓글 삭제용, 순수 JS라 Edge 환경 호환 |
| 배포 | **Vercel** | Next.js 최적 호스팅, 자동 CI/CD, 무료 플랜 충분 |
| SEO | **Next.js Metadata API** | sitemap, OG 이미지, 메타태그 기본 지원 |
| RSS 피드 | **feed** 라이브러리 (Route Handler) | 개발 블로그 구독 지원 |
| 다크/라이트 모드 | **next-themes** + CSS Variables | 시스템 설정 연동, 사용자 토글 지원 |
| Monorepo | **Turborepo + pnpm workspaces** | 확장 시 패키지 분리 용이 |

---

## 프로젝트 구조

```
blog/
├── apps/
│   └── web/                      # Next.js (유일한 앱)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── about/page.tsx
│       │   │   ├── posts/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── category/[category]/page.tsx  # 카테고리별 글 목록
│       │   │   │   └── [slug]/
│       │   │   │       ├── page.tsx
│       │   │   │       └── opengraph-image.tsx
│       │   │   ├── api/
│       │   │   │   ├── views/[slug]/route.ts
│       │   │   │   ├── likes/[slug]/route.ts
│       │   │   │   ├── comments/[slug]/route.ts
│       │   │   │   └── comments/[id]/route.ts
│       │   │   ├── feed.xml/route.ts
│       │   │   ├── sitemap.ts
│       │   │   └── robots.ts
│       │   ├── components/
│       │   └── lib/
│       │       ├── supabase.ts   # 서버 전용 Supabase 클라이언트
│       │       ├── posts.ts
│       │       ├── mdx.ts
│       │       ├── toc.ts
│       │       ├── constants.ts
│       │       └── api.ts        # apiFetch 래퍼
│       ├── content/posts/        # .md 블로그 글
│       └── .env.local
├── package.json                  # 루트 (turbo)
└── turbo.json
```

---

## Supabase 테이블 구조

```sql
-- 조회수
create table post_views (slug text primary key, count integer not null default 0, updated_at timestamptz not null default now());

-- 좋아요
create table post_likes (slug text primary key, count integer not null default 0, updated_at timestamptz not null default now());

-- 댓글 (1-depth 대댓글 지원)
create table comments (
  id serial primary key,
  slug text not null,
  author text not null,
  password_hash text not null,  -- bcryptjs 해싱
  content text not null,
  parent_id integer references comments(id) on delete cascade,
  created_at timestamptz not null default now()
);
```

- **RPC 함수**: `increment_view`, `increment_like` — 원자적 upsert (race condition 없음)
- **RLS 정책**: 공개 읽기 가능, 쓰기/삭제는 `service_role`만

### 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NEXT_PUBLIC_ 접두사 금지 — 서버 전용
```

---

## 단계별 구현 순서

### Phase 1: Next.js 블로그 코어
- Next.js 프로젝트 셋업 (App Router + TypeScript)
- TailwindCSS v4 + shadcn/ui 설정
- Markdown 글 렌더링 파이프라인 구축 (next-mdx-remote + rehype-pretty-code)
- 메인 페이지, 글 목록, 글 상세 페이지
- 다크모드 (next-themes)
- Vercel 배포

### Phase 2: 조회수 / 좋아요
- Supabase 테이블 + RPC 함수 + RLS 설정
- `src/lib/supabase.ts` (서버 전용 클라이언트)
- `src/app/api/views/[slug]/route.ts`, `src/app/api/likes/[slug]/route.ts`
- `ViewCounter`, `LikeButton` 컴포넌트

### Phase 3: 댓글 시스템
- `src/app/api/comments/[slug]/route.ts` — GET(트리 조립), POST(bcryptjs 해싱)
- `src/app/api/comments/[id]/route.ts` — DELETE(비밀번호 검증)
- `Comments` 컴포넌트 (익명 작성 + 1-depth 대댓글)

### Phase 4: 검색 / SEO / RSS / 애니메이션
- 클라이언트 사이드 검색 + 하이라이팅 (`PostList`)
- SEO: sitemap, robots, OG metadata, JSON-LD
- RSS 피드 (`feed.xml/route.ts`, `feed` 라이브러리)
- 애니메이션: `PageTransition`, `AnimateIn` (IntersectionObserver)

### Phase 5: TOC / OG 이미지
- `src/lib/toc.ts` — Markdown 헤딩 추출 (rehype-slug 호환 slugify)
- `TableOfContents` 컴포넌트 (IntersectionObserver 기반 active 하이라이팅)
- `src/app/posts/[slug]/opengraph-image.tsx` — `next/og` ImageResponse

---

## 검증 방법

- `pnpm --filter web dev`로 Next.js 로컬 실행 → Markdown 글 렌더링 확인
- Supabase 대시보드 SQL Editor에서 테이블/RPC 설정 확인
- `http://localhost:3000/api/views/<slug>` 직접 호출로 API 테스트
- Vercel 배포 후 Environment Variables 확인 → E2E 기능 동작 확인
