---
title: "해시 테이블 정리"
description: "Python dict가 왜 O(1)인지 — 해시 함수, 충돌 처리(체이닝·개방 주소법), 적재율과 리사이징까지 정리합니다"
date: "2026-09-10"
category: "자료구조"
tags: ["자료구조", "해시 테이블", "Python"]
---

Python에서 `dict`를 안 써본 사람은 없다.
`user["name"]`이 리스트를 처음부터 뒤지지 않고 **한 번에** 값을 찾아오는 이유가 바로 **해시 테이블(hash table)** 이다.
FastAPI에서 요청 헤더를 꺼내는 `request.headers["authorization"]`도, 라우터가 경로를 찾는 것도, 심지어 파이썬 객체의 속성 접근(`obj.__dict__`)도 전부 해시 테이블 위에서 돌아간다.

이 글은 "왜 `dict`는 빠른가"를 자료구조 관점에서 정리한 것이다.

## 핵심 아이디어: 키를 인덱스로 바꾼다

배열은 인덱스만 알면 O(1)에 접근할 수 있다. 문제는 우리가 가진 게 인덱스가 아니라 `"John Smith"` 같은 **키**라는 점이다.
해시 테이블은 이 간극을 **해시 함수(hash function)** 로 메운다.

![해시 함수가 키를 배열 인덱스로 바꾸는 과정](/images/posts/hash-table/basic.svg)

1. 키를 해시 함수에 넣어 정수(해시값)를 얻는다.
2. 해시값을 배열 크기로 나눈 나머지를 인덱스로 쓴다. (`index = hash(key) % capacity`)
3. 그 인덱스 자리(**버킷**)에 값을 넣거나 읽는다.

세 단계 모두 키의 개수와 무관하게 일정한 시간이 걸린다. 그래서 평균 **O(1)** 이다.

```python
capacity = 16
index = hash("John Smith") % capacity   # 예: 3
buckets[index] = "521-1234"
```

## 좋은 해시 함수의 조건

해시 테이블의 성능은 결국 해시 함수가 결정한다. 조건은 세 가지다.

- **결정적(deterministic)**: 같은 키는 항상 같은 해시값을 내야 한다. 그렇지 않으면 넣은 자리와 찾는 자리가 달라진다.
- **균등 분포(uniform)**: 키들이 버킷 전체에 고르게 퍼져야 한다. 한 버킷에 몰리면 배열이 아니라 리스트 탐색이 된다.
- **빠름**: 해시 계산 자체가 느리면 O(1)의 의미가 없다.

Python에서는 `hash()` 내장 함수가 이 역할을 한다. 커스텀 클래스에서는 `__hash__`와 `__eq__`를 **함께** 정의해야 한다.
"같다고 판단되는 두 객체는 해시값도 같아야 한다"는 규칙 때문이다. 한쪽만 정의하면 `dict`에서 키를 넣고도 못 찾는 버그가 생긴다.

```python
from dataclasses import dataclass

@dataclass(frozen=True)   # frozen=True 이면 __hash__와 __eq__가 자동 생성된다
class Point:
    x: int
    y: int

visited = {Point(0, 0), Point(1, 2)}
Point(0, 0) in visited    # True
```

`list`나 `dict`를 키로 못 쓰는 이유도 여기 있다. 내용이 바뀔 수 있는(mutable) 객체는 해시값이 달라질 수 있으니 애초에 `__hash__`가 `None`이다.
`tuple`, `frozenset`, `str` 같은 불변 객체만 키가 될 수 있다.

## 충돌은 반드시 일어난다

키의 종류는 무한한데 버킷은 유한하다. 비둘기집 원리에 따라 **서로 다른 키가 같은 인덱스**를 받는 일이 반드시 생긴다.
이것을 **충돌(collision)** 이라 하고, 해시 테이블 설계의 절반은 충돌을 어떻게 다루느냐다.

대표적인 방법이 두 가지다.

### 1. 체이닝 (separate chaining)

각 버킷을 연결 리스트(또는 작은 배열)로 만들고, 충돌한 항목을 그 리스트에 **이어 붙인다**.

![체이닝: 충돌한 키들을 버킷마다 연결 리스트로 이어 붙인다](/images/posts/hash-table/chaining.svg)

위 그림에서 `John Smith`와 `Sandra Dee`는 같은 버킷(152)을 받았지만 리스트로 연결되어 둘 다 저장된다.
찾을 때는 해당 버킷의 리스트를 순회하며 키를 비교한다.

- **장점**: 구현이 단순하고, 버킷이 꽉 차도 계속 넣을 수 있다. 삭제도 리스트에서 노드 하나 빼면 끝이다.
- **단점**: 노드마다 포인터가 붙어 메모리를 더 쓰고, 캐시 지역성이 나쁘다.

Java의 `HashMap`이 이 방식이다. (리스트가 길어지면 트리로 바꾸는 최적화까지 들어가 있다.)

### 2. 개방 주소법 (open addressing)

별도 리스트 없이 **배열 안의 다른 빈칸**을 찾아 넣는다. 가장 단순한 규칙은 "한 칸씩 옆으로" 가는 **선형 탐사(linear probing)** 다.

![개방 주소법: 충돌하면 다음 빈 버킷을 찾아 넣는다](/images/posts/hash-table/open-addressing.svg)

`Sandra Dee`가 152번에서 충돌하자 바로 다음 칸인 153번에 들어갔다. `Ted Baker`는 원래 자리 153번이 이미 찼으므로 다시 154번으로 밀렸다.
찾을 때도 같은 순서로 탐사하다가 키를 만나면 성공, 빈칸을 만나면 "없음"이다.

- **장점**: 포인터가 없어 메모리가 촘촘하고 캐시 친화적이다.
- **단점**: 채워질수록 탐사가 길어지고, 선형 탐사는 값이 뭉치는 **클러스터링**이 생긴다. 삭제가 까다롭다.

삭제가 까다로운 이유는 이렇다. 위 그림에서 153번 `Sandra Dee`를 그냥 지워 빈칸으로 만들면, `Ted Baker`를 찾을 때 153번에서 "빈칸이니 없음"이라고 잘못 판단한다.
그래서 실제 구현은 빈칸 대신 **삭제됨 표시(tombstone)** 를 남겨 탐사가 계속 이어지게 한다.

## 적재율과 리사이징

버킷 수 대비 저장된 항목 수를 **적재율(load factor)** 이라 한다.

```
load factor = 저장된 항목 수 / 버킷 수
```

적재율이 높아질수록 충돌이 늘고 O(1)에서 멀어진다. 그래서 해시 테이블은 임계치를 넘으면 **배열을 키우고 모든 항목을 다시 해시해서 옮긴다(rehash)**.
이 순간만큼은 O(n)이지만, 매번이 아니라 크기가 두 배 될 때마다 한 번이므로 평균을 내면 여전히 O(1)이다. 이를 **상각(amortized) O(1)** 이라 부른다.

| 방식 | 보통 임계 적재율 |
|---|---|
| 체이닝 | 0.75 ~ 1.0 이상도 가능 |
| 개방 주소법 | 0.5 ~ 0.7 (넘기면 급격히 느려짐) |

## 시간 복잡도 정리

| 연산 | 평균 | 최악 |
|---|---|---|
| 탐색 | O(1) | O(n) |
| 삽입 | O(1) | O(n) |
| 삭제 | O(1) | O(n) |

최악 O(n)은 모든 키가 한 버킷에 몰렸을 때다. 해시 함수가 나쁘거나, 공격자가 충돌하는 키를 일부러 보낼 때 일어난다.
후자를 **HashDoS** 공격이라 하는데, 웹 서버가 요청 파라미터를 `dict`에 담는 순간 취약해질 수 있다.
그래서 Python은 3.3부터 프로세스마다 문자열 해시에 랜덤 시드를 섞는다. (`PYTHONHASHSEED` 환경변수로 고정할 수 있다.)
같은 문자열의 `hash()` 결과가 실행할 때마다 다른 이유가 이것이다.

## Python dict는 어떻게 구현되어 있나

CPython의 `dict`는 **개방 주소법**이다. 다만 선형 탐사가 아니라 해시값의 상위 비트까지 섞어 다음 자리를 정하는 **의사 난수 탐사**를 써서 클러스터링을 줄인다.
임계 적재율은 2/3이고, 넘으면 크기를 키우며 리해시한다.

Python 3.6부터는 **compact dict** 구조로 바뀌었다.
해시 인덱스 배열(작은 정수만 저장)과 실제 항목 배열(삽입 순서대로)을 분리해서 메모리를 20~25% 줄였고, 그 부수 효과로 **삽입 순서가 보존**된다.
3.7부터는 이 순서 보존이 언어 스펙이 됐다.

```python
d = {}
d["b"] = 1
d["a"] = 2
list(d)   # ['b', 'a'] — 정렬이 아니라 삽입 순서
```

`set`도 같은 원리다. 값 없이 키만 저장하는 해시 테이블이라고 보면 된다. `x in some_list`가 O(n)인데 `x in some_set`이 O(1)인 이유다.

## 직접 만들어 보기

원리를 확인하는 용도로 체이닝 방식의 최소 구현을 적어 본다. 리사이징까지 넣었다.

```python
class HashTable:
    def __init__(self, capacity: int = 8):
        self._buckets: list[list[tuple[str, object]]] = [[] for _ in range(capacity)]
        self._size = 0

    def _index(self, key: str) -> int:
        return hash(key) % len(self._buckets)

    def set(self, key: str, value: object) -> None:
        bucket = self._buckets[self._index(key)]
        for i, (k, _) in enumerate(bucket):
            if k == key:                     # 이미 있으면 덮어쓰기
                bucket[i] = (key, value)
                return
        bucket.append((key, value))
        self._size += 1
        if self._size / len(self._buckets) > 0.75:
            self._resize()

    def get(self, key: str) -> object:
        for k, v in self._buckets[self._index(key)]:
            if k == key:
                return v
        raise KeyError(key)

    def delete(self, key: str) -> None:
        bucket = self._buckets[self._index(key)]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                del bucket[i]
                self._size -= 1
                return
        raise KeyError(key)

    def _resize(self) -> None:
        old = self._buckets
        self._buckets = [[] for _ in range(len(old) * 2)]
        self._size = 0
        for bucket in old:                   # 모든 항목을 다시 해시해서 옮긴다
            for k, v in bucket:
                self.set(k, v)
```

`_index()`가 "키 → 인덱스", `set()`의 순회가 "같은 버킷 안에서 키 비교", `_resize()`가 "리해시"다.
이 세 부분이 앞에서 본 개념 그대로다.

## 언제 쓰고, 언제 안 쓰나

**쓰면 좋은 경우**

- 키로 값을 찾는 조회가 대부분일 때 (캐시, 세션 저장소, 카운팅)
- 중복 제거, 존재 여부 확인 (`set`)
- 두 컬렉션의 교집합·차집합

**다른 자료구조가 나은 경우**

- **정렬된 순서**로 순회하거나 범위 검색(`10 < key < 20`)이 필요할 때 → 균형 이진 트리, B-tree. 해시 테이블은 순서 개념이 없다.
- 키가 문자열이고 **접두사 검색**이 필요할 때 → 트라이(trie)
- 메모리가 매우 빠듯할 때 → 해시 테이블은 적재율 때문에 항상 빈 공간을 남겨둔다.

데이터베이스 인덱스가 기본적으로 B-tree인 이유도 여기 있다. 등호 조회만 있다면 해시 인덱스가 빠르지만, `ORDER BY`와 범위 조건이 섞이는 순간 트리가 이긴다.

## 정리

- 해시 테이블은 **해시 함수로 키를 배열 인덱스로 바꿔** 평균 O(1) 조회를 얻는 자료구조다.
- 충돌은 피할 수 없고, **체이닝** 또는 **개방 주소법**으로 처리한다.
- **적재율**이 임계치를 넘으면 배열을 키우고 리해시한다. 이 비용을 상각하면 여전히 O(1)이다.
- Python `dict`/`set`은 개방 주소법 + 의사 난수 탐사 + compact 구조이며, 삽입 순서를 보존한다.
- 커스텀 클래스를 키로 쓰려면 `__hash__`와 `__eq__`를 함께 정의하고, 불변으로 만들어라.

---

이미지 출처: [Jorge Stolfi, Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Hash_tables), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
