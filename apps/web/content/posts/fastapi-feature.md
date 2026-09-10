---
title: "FastAPI의 주요 특징 정리"
description: "FastAPI 공식 문서의 Features 페이지를 바탕으로 FastAPI, Starlette, Pydantic의 특징을 정리합니다"
date: "2026-08-05"
category: "Backend"
tags: ["FastAPI", "Python", "Backend"]
---

FastAPI 공식 문서의 [Features 페이지](https://fastapi.tiangolo.com/features/)를 바탕으로,
FastAPI가 제공하는 특징을 세 부분으로 나누어 정리한다.
FastAPI는 단독으로 만들어진 프레임워크가 아니라 **Starlette**(웹 처리)과 **Pydantic**(데이터 검증) 위에
얹혀 있기 때문에, 공식 문서도 이 세 축으로 특징을 설명한다.

## FastAPI 고유 특징

### 개방형 표준 기반

FastAPI는 자체 규격이 아닌 **개방형 표준**을 그대로 따른다.

- **OpenAPI**: 경로(path operation), 매개변수, 요청 본문, 보안 스킴 등 API 전체를 선언
- **JSON Schema**: 데이터 모델을 자동으로 문서화

표준을 따르기 때문에 다양한 언어의 **클라이언트 코드 자동 생성** 도구와 바로 호환된다.

### 자동 API 문서

OpenAPI 스키마가 자동 생성되므로, 별도 작업 없이 대화형 API 문서를 얻는다.

- **Swagger UI** (`/docs`): 브라우저에서 직접 API를 호출하며 테스트 가능
- **ReDoc** (`/redoc`): 읽기 좋은 대안 문서

### 그냥 최신 Python

새로운 문법이나 DSL을 배울 필요 없이, **표준 Python 타입 선언**만 사용한다.

```python
from datetime import date
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    joined: date

my_user = User(id=3, name="John Doe", joined="2018-07-19")

# dict를 언패킹해서 생성할 수도 있다
second_user_data = {
    "id": 4,
    "name": "Mary",
    "joined": "2018-11-30",
}
my_second_user = User(**second_user_data)
```

### 편집기 지원

프레임워크 전체가 자동완성을 염두에 두고 설계되었다.
VS Code, PyCharm 등에서 중첩된 JSON 데이터의 키까지 자동완성되므로
문서를 뒤적이는 시간이 크게 줄어든다.

### 간결함

모든 것에 **합리적인 기본값**이 있다. 아무 설정 없이도 잘 동작하고,
필요할 때만 선택적으로 세부 조정하면 된다.

### 데이터 검증(Validation)

검증은 모두 Pydantic이 처리하며, 다음을 포함한다.

- 기본 타입: JSON 객체(`dict`), 배열(`list`)과 항목 타입, 문자열 길이, 숫자 범위
- 고급 타입: URL, Email, UUID 등

### 보안과 인증

데이터베이스나 데이터 모델 구조를 강요하지 않으면서 보안·인증을 지원한다.

- HTTP Basic 인증
- **OAuth2** (JWT 토큰 포함)
- API 키 — Header, Query parameter, Cookie
- 세션 쿠키 (Starlette에서 상속)

### 의존성 주입(Dependency Injection)

FastAPI에서 가장 강력한 기능 중 하나. 의존성이 또 다른 의존성을 가지는
**계층 구조**를 프레임워크가 자동으로 해결해 준다.
DB 연결, 사용자 인증 같은 공통 로직을 함수 하나로 선언하고 재사용할 수 있으며,
의존성이 요구하는 매개변수는 자동으로 OpenAPI 문서에 반영된다.

### 무제한 "플러그인"

별도의 플러그인 시스템이 없다. 필요한 코드를 import해서 쓰면 그게 곧 플러그인이다.
경로 작업(path operation)과 동일한 구조로, 단 몇 줄이면 원하는 통합을 만들 수 있다.

### 테스트

FastAPI 자체가 **100% 테스트 커버리지**, **100% 타입 주석** 코드베이스다.

## Starlette에서 상속받는 특징

FastAPI는 Starlette의 완전 호환 상위 집합이므로, Starlette의 기능을 모두 쓸 수 있다.

- **성능**: Python 프레임워크 중 최고 수준으로, NodeJS·Go와 동등한 벤치마크
- **WebSocket** 지원
- 프로세스 내 **백그라운드 작업**
- 시작/종료(lifespan) 이벤트
- HTTPX 기반 **테스트 클라이언트**
- CORS, GZip, 정적 파일, 스트리밍 응답, 세션/쿠키 지원

## Pydantic에서 상속받는 특징

데이터 정의와 검증은 전부 Pydantic 기반이다.

### 별도 스키마 언어가 없다

Python 타입을 안다면 Pydantic을 이미 아는 것이다.
검증된 데이터는 정의한 클래스의 인스턴스이므로 자동완성, linting, mypy와 그대로 호환된다.

### 복잡한 구조 검증

모델을 중첩하면 깊게 중첩된 JSON도 전부 검증·문서화된다.

```python
from pydantic import BaseModel

class Address(BaseModel):
    street: str
    city: str
    country: str

class User(BaseModel):
    name: str
    email: str
    addresses: list[Address]

user = User(
    name="John",
    email="john@example.com",
    addresses=[
        {"street": "123 Main St", "city": "New York", "country": "USA"},
        {"street": "456 Oak Ave", "city": "Boston", "country": "USA"},
    ],
)
```

### 확장성

커스텀 데이터 타입을 정의하거나, validator 데코레이터로 원하는 검증 로직을 추가할 수 있다.
Pydantic 역시 100% 테스트 커버리지를 유지한다.

## 정리

FastAPI의 특징을 한 줄로 요약하면 **"표준 Python 타입 힌트 하나로 검증·직렬화·문서화·편집기 지원을 전부 얻는다"**는 것이다.

- 웹 처리(성능, WebSocket, 미들웨어)는 **Starlette**이 담당
- 데이터 검증·직렬화는 **Pydantic**이 담당
- FastAPI는 그 위에서 OpenAPI 문서 자동화, 의존성 주입, 보안 유틸리티를 얹어준다

덕분에 코드 중복이 줄고, 문서와 구현이 어긋날 일이 없으며, 타입 기반이라 버그도 편집기 단계에서 잡힌다.
