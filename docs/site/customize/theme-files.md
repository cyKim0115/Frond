---
description: 테마 JSON 파일의 형식과 키, 값 규칙을 설명합니다.
icon: file-code
---

# 테마 파일 만들기

테마는 색 값만 담는 JSON 파일입니다. 빠진 색은 `base` 쪽 기본 색(GitHub 라이트·다크)으로 채워지므로 바꾸고 싶은 색만 적으면 됩니다.

```json
{
  "id": "sepia",
  "name": "세피아",
  "base": "light",
  "shell": { "bg": "#f4ecd8", "fg": "#3b3228", "accent": "#9a5b13" },
  "doc": { "bgColor-default": "#f4ecd8", "fgColor-default": "#3b3228" }
}
```

완성된 예제는 [sepia.json](https://github.com/cyKim0115/MdEditor/blob/main/docs/themes/sepia.json)입니다. 가장 쉬운 시작은 설정의 테마 목록에서 **복제**한 파일을 고치는 것입니다.

## 키

| 키 | 설명 |
|---|---|
| `id` | 파일 이름이 되는 값. 영문·숫자로 시작하고 영문·숫자·`-`·`_`만(64자까지). `light`·`dark`는 쓸 수 없습니다. 없으면 파일 이름 |
| `name` | 목록에 보이는 이름 (1–60자) |
| `base` | `"light"` 또는 `"dark"` — 빠진 색을 채울 기본 색, 스크롤바 색 |
| `shell` | 앱 틀의 색: `fg` `bg` `muted` `line` `accent` `on-accent` `danger` `sidebar-bg` |
| `doc` | 본문·편집기 색: GitHub Markdown 팔레트 변수 이름(`fgColor-default`, `bgColor-default`, `bgColor-muted`, `borderColor-default`, `fgColor-accent`, `color-prettylights-syntax-keyword` 등 48개)과 `selection-bg`·`selection-bg-inactive`. 전체 목록은 **복제**한 파일에서 보입니다 |

## 값 규칙

값은 CSS 색(`#rrggbb`, `rgb()`, `hsl()`, 색 이름 등)만 받습니다. `url()`·`@import`처럼 색이 아닌 값은 거부합니다. 모르는 키는 경고만 하고 무시합니다.
