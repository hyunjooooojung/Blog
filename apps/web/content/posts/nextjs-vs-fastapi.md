---
title: "FastAPI 개발자가 보는 Next.js"
description: "FastAPI와 Next.js의 구조적 유사점과 차이점을 비교합니다"
date: "2026-04-10"
tags: ["Next.js", "FastAPI", "TypeScript", "Python"]
---

## FastAPI와 Next.js의 공통점

Python으로 FastAPI를 써온 입장에서 Next.js를 처음 배울 때 놀랐던 건,
생각보다 **개념이 비슷한 부분이 많다**는 것이다.

### 라우팅 구조

FastAPI는 파일에 `@app.get("/posts/{slug}")` 같은 데코레이터로 라우트를 정의한다.
Next.js App Router는 **파일 시스템 라우팅**으로, `app/posts/[slug]/page.tsx` 파일 위치 자체가 URL이 된다.

```python
# FastAPI
@app.get("/posts/{slug}")
async def get_post(slug: str):
    return {"slug": slug}
```

```typescript
// Next.js App Router
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <div>{slug}</div>;
}
```

### 비동기 처리

FastAPI는 `async def`로 비동기를 처리한다.
Next.js Server Components도 `async function`으로 서버에서 데이터를 가져올 수 있다.
**둘 다 async/await이 자연스럽게 통합된 프레임워크**다.

## 차이점

| FastAPI | Next.js |
|---------|---------|
| 순수 API 서버 | 프론트 + API 통합 |
| Pydantic 타입 검증 | TypeScript 타입 시스템 |
| `Depends()` DI | Server Components 직접 호출 |
| Uvicorn 서버 | Vercel 서버리스 |

## 결론

언어가 다르더라도 **좋은 설계 패턴은 비슷하다**.
FastAPI 경험이 있다면 Next.js도 충분히 빠르게 익힐 수 있다.
