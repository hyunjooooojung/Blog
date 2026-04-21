-- Phase 2: 조회수/좋아요 카운터 + dedup 이벤트 테이블
-- IMPORTANT: RPC 파라미터 이름(post_slug)은 현재 라우트 코드와 일치.
--            Supabase에 이미 p_slug로 배포된 함수가 있다면 아래 함수 재생성 시
--            이름을 맞추거나 라우트의 { post_slug } → { p_slug }로 변경할 것.

-- ── 카운터 테이블 ──────────────────────────────────────────────────────────────

create table if not exists post_views (
  slug        text        primary key,
  count       integer     not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists post_likes (
  slug        text        primary key,
  count       integer     not null default 0,
  updated_at  timestamptz not null default now()
);

-- ── dedup 이벤트 테이블 ────────────────────────────────────────────────────────
-- visitor_hash = SHA-256(SALT:ip:ua) — 단방향 해시, IP 직접 저장 안 함

create table if not exists view_events (
  slug          text  not null,
  visitor_hash  text  not null,
  day           date  not null default current_date,
  primary key (slug, visitor_hash, day)
);

create table if not exists like_events (
  slug          text  not null,
  visitor_hash  text  not null,
  primary key (slug, visitor_hash)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- service_role은 RLS를 우회하므로 write 정책 불필요.

alter table post_views  enable row level security;
alter table post_likes  enable row level security;
alter table view_events enable row level security;
alter table like_events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'post_views' and policyname = 'post_views_public_read'
  ) then
    create policy post_views_public_read on post_views for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'post_likes' and policyname = 'post_likes_public_read'
  ) then
    create policy post_likes_public_read on post_likes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'view_events' and policyname = 'view_events_public_read'
  ) then
    create policy view_events_public_read on view_events for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'like_events' and policyname = 'like_events_public_read'
  ) then
    create policy like_events_public_read on like_events for select using (true);
  end if;
end $$;

-- ── RPC 함수 ──────────────────────────────────────────────────────────────────

create or replace function increment_view(post_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into post_views (slug, count, updated_at)
  values (post_slug, 1, now())
  on conflict (slug) do update
    set count      = post_views.count + 1,
        updated_at = now();
end;
$$;

create or replace function increment_like(post_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into post_likes (slug, count, updated_at)
  values (post_slug, 1, now())
  on conflict (slug) do update
    set count      = post_likes.count + 1,
        updated_at = now();
end;
$$;
