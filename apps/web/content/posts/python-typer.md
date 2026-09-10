---
title: "Typer로 Python CLI 만들기"
description: "FastAPI를 만든 저자가 만든 CLI 프레임워크 Typer를 타입 힌트 관점에서 정리합니다"
date: "2026-09-02"
category: "Backend"
tags: ["Python", "Typer", "CLI"]
---

[Typer](https://typer.tiangolo.com/)는 FastAPI를 만든 Sebastián Ramírez(tiangolo)가 만든
**CLI(Command Line Interface) 프레임워크**다.
FastAPI가 "타입 힌트만 쓰면 검증·문서화가 따라온다"는 철학으로 웹 API를 만든다면,
Typer는 같은 철학을 **터미널 명령어**에 적용한다.
함수 시그니처에 타입만 적어두면 인자 파싱, 검증, `--help` 문서, 셸 자동완성이 전부 생긴다.

내부적으로는 Python CLI의 표준처럼 쓰이는 **Click** 위에 얹혀 있다.
Click이 데코레이터 여러 개로 옵션을 하나씩 선언하게 했다면,
Typer는 그 선언을 **함수 매개변수의 타입 힌트**로 대체한 것이다.

## 설치

```bash
pip install typer
```

`typer` 패키지는 0.12부터 `typer-slim[standard]`에 의존한다.
즉 기본 설치만으로 **Rich**(예쁜 출력)와 **shellingham**(셸 감지), `typer` 커맨드까지 같이 딸려온다.
의존성을 최소화하고 싶으면 `typer-slim`만 설치하면 된다.

## 가장 작은 예제

```python
import typer


def main(name: str):
    print(f"Hello {name}")


if __name__ == "__main__":
    typer.run(main)
```

함수 하나와 `typer.run()`이 전부다.

```bash
$ python main.py Camila
Hello Camila

$ python main.py --help
 Usage: main.py [OPTIONS] NAME

 Arguments:
   name   TEXT  [required]
```

`name: str` 하나로 **필수 위치 인자**가 만들어지고, 빠뜨리면 에러 메시지와 함께 종료된다.
FastAPI에서 `def read_item(item_id: int)`만 적으면 경로 매개변수가 되는 것과 같은 방식이다.

## Argument와 Option

CLI 인자는 두 종류다.

- **Argument**: 위치 인자. `git clone <url>`의 `<url>`
- **Option**: 이름 붙은 인자. `--verbose`, `--count 3`

Typer는 **기본값 유무**로 이 둘을 구분한다.

```python
import typer


def main(name: str, lastname: str = "", formal: bool = False):
    if formal:
        print(f"Good day Ms. {name} {lastname}.")
    else:
        print(f"Hello {name} {lastname}")


if __name__ == "__main__":
    typer.run(main)
```

- `name: str` → 기본값 없음 → **Argument** (필수)
- `lastname: str = ""` → 기본값 있음 → **Option** `--lastname`
- `formal: bool = False` → **플래그** `--formal / --no-formal`

```bash
$ python main.py Camila --lastname Gutiérrez --formal
Good day Ms. Camila Gutiérrez.
```

### Annotated로 세부 설정

help 텍스트, 프롬프트, 짧은 옵션명 같은 추가 설정은 `typing.Annotated`에 `typer.Option()`을 넣어 선언한다.
이 방식이 **현재 공식 문서의 권장 방식**이다.
(`name: str = typer.Option(...)`처럼 기본값 자리에 넣는 예전 방식도 아직 동작하지만, 타입 검사기와 궁합이 나쁘다.)

```python
from typing import Annotated

import typer


def main(
    name: Annotated[str, typer.Argument(help="인사할 사람 이름")],
    count: Annotated[int, typer.Option("--count", "-c", help="반복 횟수")] = 1,
):
    for _ in range(count):
        print(f"Hello {name}")


if __name__ == "__main__":
    typer.run(main)
```

`Annotated[타입, 메타데이터]` 구조 덕분에 **타입은 타입대로, CLI 설정은 설정대로** 분리된다.
FastAPI에서 `Annotated[str, Query(max_length=50)]`를 쓰는 것과 완전히 같은 패턴이다.

## 타입이 곧 검증이다

타입 힌트에 따라 파싱과 검증이 자동으로 이루어진다.

```python
from enum import Enum
from pathlib import Path
from typing import Annotated

import typer


class Level(str, Enum):
    debug = "debug"
    info = "info"
    error = "error"


def main(
    config: Annotated[
        Path,
        typer.Option(exists=True, dir_okay=False, readable=True),
    ],
    level: Level = Level.info,
    retries: int = 3,
):
    print(f"config={config} level={level.value} retries={retries}")


if __name__ == "__main__":
    typer.run(main)
```

- `int`: 숫자가 아닌 값을 넣으면 `Invalid value for '--retries'` 에러
- `Enum`: 정의된 선택지만 허용. `--help`에 `[debug|info|error]`로 표시
- `Path`: `exists=True`면 파일이 없을 때 즉시 에러. `dir_okay=False`면 디렉터리 거부

검증 로직을 직접 짤 필요가 없고, 에러 메시지도 Typer가 사용자 친화적으로 만들어 준다.

## 여러 커맨드 묶기

`git add`, `git commit`처럼 커맨드가 여러 개인 CLI는 `typer.Typer()` 인스턴스를 만들고
`@app.command()` 데코레이터로 함수를 등록한다.
FastAPI의 `app = FastAPI()` + `@app.get()`과 똑같은 구조다.

```python
from typing import Annotated

import typer

app = typer.Typer(help="사용자 관리 CLI")


@app.command()
def create(username: str):
    """새 사용자를 생성한다."""
    print(f"Creating user: {username}")


@app.command()
def delete(
    username: str,
    force: Annotated[
        bool,
        typer.Option(prompt="정말 삭제하시겠습니까?", help="확인 없이 삭제"),
    ] = False,
):
    """사용자를 삭제한다."""
    if not force:
        print("취소됨")
        raise typer.Exit()
    print(f"Deleting user: {username}")


if __name__ == "__main__":
    app()
```

```bash
$ python main.py create alice
Creating user: alice

$ python main.py delete alice
정말 삭제하시겠습니까? [y/N]: y
Deleting user: alice
```

- 함수의 **docstring**이 그대로 `--help`의 커맨드 설명이 된다
- `prompt=`를 주면 옵션을 생략했을 때 대화형으로 물어본다
- `typer.Exit()`는 정상 종료, `typer.Exit(code=1)`은 에러 종료. `sys.exit()` 대신 쓴다

### 서브커맨드 그룹

커맨드가 많아지면 `add_typer()`로 **하위 앱**을 붙인다.
FastAPI의 `APIRouter`를 `include_router()`로 합치는 것과 같다.

```python
# users.py
import typer

app = typer.Typer()


@app.command()
def create(name: str):
    print(f"Creating user: {name}")
```

```python
# main.py
import typer

import items
import users

app = typer.Typer()
app.add_typer(users.app, name="users")
app.add_typer(items.app, name="items")

if __name__ == "__main__":
    app()
```

```bash
$ python main.py users create alice
Creating user: alice
```

## 자주 쓰는 편의 기능

### Rich와 통합된 출력

Rich가 설치되어 있으면 `--help` 출력이 색상과 패널로 정리되고,
처리되지 않은 예외도 **로컬 변수까지 보여주는 예쁜 트레이스백**으로 바뀐다.
운영 환경에서 변수 값이 노출되는 게 걱정된다면 `typer.Typer(pretty_exceptions_show_locals=False)`로 끈다.

### 진행률 표시

```python
import time

import typer


def main():
    total = 1000
    with typer.progressbar(length=total) as progress:
        for _ in range(4):
            time.sleep(1)
            progress.update(250)
    print(f"Processed {total} things.")


if __name__ == "__main__":
    typer.run(main)
```

### typer 커맨드로 바로 실행

`typer` 패키지에 포함된 `typer` 커맨드를 쓰면
`if __name__ == "__main__"` 블록 없이도 스크립트를 실행할 수 있다.

```bash
typer main.py run Camila
typer main.py run --help
```

`typer main.py utils docs`로 CLI 문서를 **Markdown으로 자동 생성**할 수도 있다.

### 셸 자동완성

`typer.Typer()`로 만든 앱은 기본으로 `--install-completion` 옵션이 붙는다.
사용자가 한 번 실행하면 bash, zsh, fish, PowerShell에서 커맨드와 옵션이 탭으로 완성된다.

## 패키지로 배포하기

실제 도구로 배포할 때는 `pyproject.toml`에 진입점을 등록한다.

```toml
[project.scripts]
usercli = "mypkg.main:app"
```

설치하면 `python main.py` 대신 `usercli create alice`처럼 바로 호출할 수 있다.

## FastAPI 개발자 관점에서 본 Typer

- `app = FastAPI()` ↔ `app = typer.Typer()`
- `@app.get("/users")` ↔ `@app.command()`
- `APIRouter` + `include_router()` ↔ `typer.Typer()` + `add_typer()`
- `Annotated[str, Query(...)]` ↔ `Annotated[str, typer.Option(...)]`
- Pydantic 검증 에러 → 422 응답 ↔ 타입 검증 에러 → 사용 안내 출력 후 종료
- OpenAPI 문서(`/docs`) ↔ `--help` + `typer utils docs`
- `HTTPException` ↔ `typer.Exit(code=1)`

개념이 일대일로 대응되기 때문에 FastAPI를 써봤다면 Typer는 배울 게 거의 없다.
반대로 Typer를 먼저 익히면 FastAPI의 의존성 주입, `Annotated` 패턴이 자연스럽게 이해된다.

## 정리

Typer를 한 줄로 요약하면 **"함수 시그니처가 곧 CLI 명세"**다.

- 기본값 없는 매개변수는 Argument, 있으면 Option
- 타입 힌트(`int`, `bool`, `Enum`, `Path`)가 파싱과 검증을 대신한다
- `Annotated`로 help, prompt, 짧은 옵션명 같은 세부 설정을 붙인다
- `@app.command()`와 `add_typer()`로 커맨드를 계층적으로 조직한다
- Rich 통합, 자동완성, 문서 생성이 기본 제공된다

배치 스크립트, DB 마이그레이션 도구, 배포 스크립트처럼 백엔드 개발자가 어차피 매일 쓰는 잡다한 스크립트를
`argparse`로 짜다 보면 인자 하나 추가할 때마다 코드가 늘어난다.
Typer는 그 코드를 타입 힌트 한 줄로 줄여 주고, 덤으로 `--help`까지 챙겨 준다.
