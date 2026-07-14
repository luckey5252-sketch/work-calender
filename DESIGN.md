---
version: alpha
name: work-calendar-design-analysis
description: A restrained desk-planner interface for a work calendar. Cool grey-green "paper" canvas (#f1f2ed) printed with a faint graph-paper grid, white cells ruled by hairlines, and ink-blue (#2f4b7c) as the single signature accent. Date numerals are the protagonist — set in Space Grotesk and treated as tabular figures — while Pretendard carries all Korean/Latin UI text. Boldness is spent in exactly two scarce places: today's date renders as an inverted ink block, and an event with a 본부장 (division head) attendee stands out with a blue accent rule + bold title + label. The 24-hour "changed" marker and the 본부장 standout both encode meaning with color AND a non-color cue (label/weight) so nothing depends on color alone. Event chips are otherwise a single quiet neutral — there is no category color system. Voltage comes from the tactile planner vocabulary (graph paper, hard offset shadow on the brand mark, ruled cells), not from accent saturation.

colors:
  paper: "#f1f2ed"
  surface: "#ffffff"
  surface-outside: "#f9f9f7"  # = color-mix(surface 55% / paper 45%)
  ink: "#21252b"
  ink-soft: "#5d636d"
  line: "#dfe0da"
  accent: "#2f4b7c"
  accent-strong: "#213a61"
  head-blue: "#1f5fbf"
  warn: "#b4452f"
  on-ink: "#f1f2ed"
  on-accent: "#ffffff"

typography:
  display-title:
    fontFamily: "Space Grotesk, Pretendard, sans-serif"
    fontSize: 1.35rem
    fontWeight: 600
    letterSpacing: -0.01em
    role: "Event detail title"
  period:
    fontFamily: "Space Grotesk, Pretendard, sans-serif"
    fontSize: 1.15rem
    fontWeight: 600
    letterSpacing: -0.01em
    role: "Toolbar period heading (2026년 6월)"
  daynum-week:
    fontFamily: "Space Grotesk, Pretendard, sans-serif"
    fontSize: 1.2rem
    fontWeight: 600
    role: "Week-view date numeral"
  daynum-month:
    fontFamily: "Space Grotesk, Pretendard, sans-serif"
    fontSize: 1.05rem
    fontWeight: 600
    lineHeight: 1.5
    role: "Month-cell date numeral — the protagonist"
  heading:
    fontFamily: "Pretendard, system-ui, sans-serif"
    fontSize: 1.1rem
    fontWeight: 700
    role: "Dialog headings (h2), brand name"
  body:
    fontFamily: "Pretendard, system-ui, sans-serif"
    fontSize: 0.92rem
    fontWeight: 400
    role: "Form inputs, detail values"
  label:
    fontFamily: "Pretendard, system-ui, sans-serif"
    fontSize: 0.8rem
    fontWeight: 600
    color: "{colors.ink-soft}"
    role: "Field labels, weekday header"
  chip:
    fontFamily: "Pretendard, system-ui, sans-serif"
    fontSize: 0.78rem
    fontWeight: 400
    role: "Event chip title (month view)"
  chip-time:
    fontFamily: "Space Grotesk, Pretendard, sans-serif"
    fontSize: 0.72rem
    color: "{colors.ink-soft}"
    role: "Event chip time — tabular numerals"
  badge:
    fontFamily: "Pretendard, system-ui, sans-serif"
    fontSize: 0.62rem
    fontWeight: 700
    letterSpacing: 0.02em
    role: "신규/본부장 labels"

rounded:
  hair: 3px
  chip: 4px
  today: 6px
  input: 7px
  md: 8px
  sheet: 14px

spacing:
  xxs: 3px
  xs: 6px
  sm: 8px
  md: 13px
  lg: 18px
  xl: 22px
  cell-min: 112px
  grid-texture: 26px

shadow:
  accent: "0 1px 2px rgba(47,75,124,0.28), 0 6px 16px rgba(47,75,124,0.20)"
  accent-hover: "0 2px 4px rgba(47,75,124,0.32), 0 10px 22px rgba(47,75,124,0.26)"
  soft: "0 1px 2px rgba(33,37,43,0.05), 0 4px 14px rgba(33,37,43,0.07)"
  sheet: "0 24px 60px rgba(33,37,43,0.22)"
  brand-offset: "3px 3px 0 0 {colors.ink}"

components:
  app-bar:
    backgroundColor: "{colors.surface}"
    borderBottom: "1px solid {colors.line}"
    padding: "14px 22px"
  brand-mark:
    backgroundColor: "{colors.accent}"
    boxShadow: "{shadow.brand-offset}"
    rounded: "{rounded.hair}"
    size: 14px
  period:
    typography: "{typography.period}"
    textColor: "{colors.ink}"
  view-toggle:
    border: "1px solid {colors.line}"
    rounded: "{rounded.md}"
  seg:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
  seg-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    boxShadow: "{shadow.accent}"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    boxShadow: "{shadow.accent-hover}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.md}"
    padding: "7px 13px"
  button-danger:
    backgroundColor: transparent
    textColor: "{colors.warn}"
    border: "1px solid (warn 35% / line)"
    rounded: "{rounded.md}"
  button-step:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.md}"
    size: 32px
  weekday:
    typography: "{typography.label}"
    textColor: "{colors.ink-soft}"
  month-grid:
    columns: "repeat(7, 1fr)"
    gap: "{spacing.xs}"
    rowHeight: "minmax({spacing.cell-min}, 1fr)"
  day:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.md}"
    padding: "6px 7px 8px"
  day-outside:
    backgroundColor: "{colors.surface-outside}"
    daynumOpacity: 0.45
  day-selected:
    borderColor: "{colors.accent}"
    boxShadow: "0 0 0 1px {colors.accent}"
  day-today-num:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.today}"
  chip:
    backgroundColor: "(ink-soft 8% / surface)"
    borderLeft: "3px solid {colors.ink-soft}"
    rounded: "{rounded.chip}"
    padding: "3px 6px"
    typography: "{typography.chip}"
  chip-head:
    backgroundColor: "(head-blue 12% / surface)"
    borderLeft: "4px solid {colors.head-blue}"
    titleFontWeight: 700
    label: "본부장"
  chip-changed:
    boxShadow: "inset 2px 0 0 0 {colors.accent}"
  chip-badge:
    typography: "{typography.badge}"
    textColor: "{colors.accent}"
    border: "1px solid (accent 45% / transparent)"
    rounded: "{rounded.hair}"
  chip-head-label:
    typography: "{typography.badge}"
    textColor: "{colors.head-blue}"
    border: "1px solid (head-blue 45% / transparent)"
    rounded: "{rounded.hair}"
  week-col:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.md}"
    minHeight: 380px
  empty-hint:
    backgroundColor: "{colors.surface}"
    border: "1px dashed {colors.line}"
    rounded: "{rounded.md}"
    padding: "22px"
  sheet:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.sheet}"
    boxShadow: "{shadow.sheet}"
    width: "min(520px, 94vw)"
    backdrop: "rgba(33,37,43,0.32)"
  text-input:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.input}"
    padding: "8px 10px"
    typography: "{typography.body}"
  attendee-head:
    textColor: "{colors.head-blue}"
    fontWeight: 700
  head-tag:
    typography: "{typography.badge}"
    textColor: "{colors.head-blue}"
    border: "1px solid (head-blue 45% / transparent)"
    rounded: "{rounded.hair}"
  focus-ring:
    outline: "2px solid {colors.accent}"
    outlineOffset: "2px"
  focus-ring-button:
    outline: "2px solid {colors.surface}"
    boxShadow: "0 0 0 2px {colors.accent}, 0 0 0 5px rgba(47,75,124,0.28)"
---

## Overview

이 디자인은 **업무용 데스크 플래너**다. 마케팅 페이지가 아니라 매일 쓰는 달력 앱 자체의 시각 언어를 정의한다. 출발점은 책상 위의 종이 플래너 — 옅은 모눈이 인쇄된 차분한 종이(`{colors.paper}` — #f1f2ed), 가는 괘선(`{colors.line}`)으로 칸을 나눈 흰 셀(`{colors.surface}`), 그리고 단 하나의 시그니처 색 잉크블루(`{colors.accent}` — #2f4b7c)다.

이 시스템의 규율은 세 가지다.

1. **날짜 숫자가 주인공이다.** 날짜·시간·기간 제목은 `Space Grotesk`(`{typography.daynum-month}` 등)로, 기계적이고 또렷한 숫자꼴로 세운다. 그 외 모든 한글/라틴 UI 텍스트는 `Pretendard`(`{typography.body}`)가 받는다. 경계는 엄격하다 — 본문을 Space Grotesk로 쓰지 않고, 날짜 숫자를 Pretendard로 쓰지 않는다.
2. **대담함은 '오늘'에만 쓴다.** 오늘 날짜는 잉크 블록으로 반전된다(`{component.day-today-num}` — 잉크 배경 + 종이색 숫자). 화면에서 유일하게 색을 가득 채운 곳이며, 이 하나가 기억에 남는다. 나머지는 조용하고 규율 있게 둔다.
3. **색만으로 의미를 전하지 않는다.** "변경" 표시와 본부장 표시 모두 색과 함께 라벨·굵기 같은 비-색 단서를 반드시 동반한다(색각 접근성).

브랜드 단서는 절제돼 있다 — 상단 브랜드 마크는 잉크블루 사각형에 **딱딱한 오프셋 그림자**(`{shadow.brand-offset}` — 3px 3px 0 잉크)를 달아, 책상에 붙인 작은 라벨 스티커처럼 보인다. 보디 배경에는 26px 간격의 옅은 모눈(`{spacing.grid-texture}`)이 깔려 종이 질감을 만든다. 그 외에는 흰 셀과 가는 괘선의 반복이다.

**핵심 특징**
- 차분한 회녹색 종이 캔버스(`{colors.paper}`) — 크림(#F4F1EA) 클리셰를 의도적으로 피했다. AI 생성물이 몰리는 기본값이므로 한 단계 차갑게 틀었다.
- 잉크블루 단일 시그니처(`{colors.accent}`) — 오늘 셀 테두리, 선택 상태, 포커스 링, 1차 버튼, "변경" 표시가 모두 이 한 색을 공유한다.
- 일정 칩에는 분류 색 체계가 없다 — 기본은 조용한 중립 칩(`{colors.ink-soft}` 8% 틴트 + 좌측 보더). 색 구분은 **본부장 참석 일정** 한 곳에만 준다.
- 본부장 참석 일정은 도드라진다(`{component.chip-head}`) — 파란 잉크 강조선(`{colors.head-blue}`, 4px) + 12% 틴트 + 굵은 제목 + "본부장" 라벨.
- 경고색(`{colors.warn}` — #b4452f)은 삭제 버튼과 일요일 표시에 쓴다.
- 본부장 참석자는 파란색(`{colors.head-blue}`) + 굵게 + "본부장" 라벨 — 색·굵기·라벨 세 단서를 함께 준다.
- radius는 위계적이다: 괘선/점 `{rounded.hair}`(3px), 일정 칩 `{rounded.chip}`(4px), 오늘 블록 `{rounded.today}`(6px), 입력 `{rounded.input}`(7px), 셀·버튼 `{rounded.md}`(8px), 다이얼로그 `{rounded.sheet}`(14px). 균일하게 바르지 않는다.

## Colors

명명된 hex를 6개 핵심 + 의미색으로 한정한다. 색이 의미를 인코딩하고, 장식으로 쓰지 않는다.

### Surface
- **Paper** (`{colors.paper}` — #f1f2ed): 앱 전체 바닥. 옅은 모눈이 인쇄된 종이. 크림이 아닌 차분한 회녹.
- **Surface** (`{colors.surface}` — #ffffff): 셀·카드·버튼·다이얼로그의 흰 면.
- **Surface Outside** (`{colors.surface-outside}` — surface 55% / paper): 이번 달이 아닌 셀(`{component.day-outside}`). 종이 쪽으로 살짝 가라앉혀 현재 달과 구분.
- **Line** (`{colors.line}` — #dfe0da): 모든 1px 괘선 — 셀 테두리, 그리드 구분선, 입력 외곽선.

### Text
- **Ink** (`{colors.ink}` — #21252b): 본문·제목·날짜 숫자. '오늘' 블록의 배경이기도 하다.
- **Ink Soft** (`{colors.ink-soft}` — #5d636d): 보조 텍스트 — 요일 머리글, 칩 시간, 필드 라벨, "+n 더보기".
- **On Ink** (`{colors.on-ink}` — #f1f2ed): 잉크 블록('오늘', 선택된 세그먼트) 위 텍스트.

### Signature & Semantic
- **Accent** (`{colors.accent}` — #2f4b7c): 단일 시그니처. 1차 버튼, 오늘/선택 테두리, 포커스 링, "변경" 표시. 누름 시 `{colors.accent-strong}`(#213a61).
- **Head Blue** (`{colors.head-blue}` — #1f5fbf): **본부장 전용.** accent와 구분되는 더 선명한 파랑. 직책 플래그(`isHead`)로만 켠다 — 이름 문자열로 판단하지 않는다.
- **Warn** (`{colors.warn}` — #b4452f): 삭제 버튼, 일요일 표시. 경고를 인코딩하는 단 하나의 붉은색.

### 일정 칩 색 (절제된 분류색 + 본부장 강조)
칩 좌측 보더·틴트로 **분류**를 인코딩한다. 채도를 낮춰 한 가족처럼 읽히게 하고, 항상 2글자 라벨을 병행한다(색 단독 의존 금지). 본부장 참석이면 분류색을 head-blue가 덮어써 "대담함은 한 곳에"를 지킨다.

| 분류/상태 | 색 | 비-색 단서 |
|---|---|---|
| 회의 (기본) | `{colors.ink-soft}` — 조용한 중립 | "회의" 라벨 |
| 마감 | `{colors.warn}` — 경고색 | "마감" 라벨 |
| 외근 | `#3f6b52` — 차분한 녹 | "외근" 라벨 |
| 개인 | `#6f6285` — 차분한 보라회색 | "개인" 라벨 |
| 본부장 참석 (분류색 위에 덮어씀) | `{colors.head-blue}` — 파란 잉크 (12% 틴트 + 4px 보더) | 굵은 제목 + "본부장" 라벨 |
| 우선 처리 | 색 추가 없음 | 채운 잉크 태그 "우선" |

분류색은 낮은 채도로 화면을 조용하게 두고, 본부장 일정만 또렷하게 떠오르게 한다.

> 요일 색 규칙: 일요일은 `{colors.warn}`, 토요일은 #3f6691(차분한 슬레이트블루). 달력 종이의 관습을 빌려온다.

## Typography

### 두 글꼴, 엄격한 역할 분담
- **Space Grotesk** (`{typography.daynum-month}`, `{typography.daynum-week}`, `{typography.period}`, `{typography.chip-time}`, `{typography.display-title}`): 숫자 전담. 날짜·시간·기간 제목. 기계적이고 또렷한 숫자꼴 — 달력의 주인공이므로 여기서 개성을 낸다. 표 숫자(tabular)처럼 정렬되어 플래너/장부 느낌을 만든다.
- **Pretendard** (`{typography.body}`, `{typography.label}`, `{typography.heading}`, `{typography.chip}`, `{typography.badge}`): 한글/라틴 UI 텍스트 전담. 제목, 본문, 라벨, 버튼, 입력.

경계는 흐리지 않는다. 본문을 숫자 글꼴로, 날짜를 본문 글꼴로 쓰면 어긋난다.

### 위계
| 토큰 | 크기 | 굵기 | 용도 |
|---|---|---|---|
| `{typography.display-title}` | 1.35rem | 600 | 일정 상세 제목 |
| `{typography.daynum-week}` | 1.2rem | 600 | 주 보기 날짜 숫자 |
| `{typography.period}` | 1.15rem | 600 | 상단 기간 제목 (2026년 6월) |
| `{typography.heading}` | 1.1rem | 700 | 다이얼로그 제목, 브랜드명 |
| `{typography.daynum-month}` | 1.05rem | 600 | 월 셀 날짜 숫자 — 주인공 |
| `{typography.body}` | 0.92rem | 400 | 입력값, 상세 내용 |
| `{typography.label}` | 0.8rem | 600 | 필드 라벨, 요일 머리글 |
| `{typography.chip}` | 0.78rem | 400 | 월 보기 일정 제목 |
| `{typography.chip-time}` | 0.72rem | 400 | 칩 시간 (Space Grotesk) |
| `{typography.badge}` | 0.62rem | 700 | 신규/본부장 라벨 |

### 원칙
- **굵기 사다리는 400 / 600 / 700 세 단계로 고정한다 — 500은 쓰지 않는다.** 본문·칩 제목은 400, 라벨·날짜·세그먼트는 600, 다이얼로그 제목·배지는 700. 중간 굵기(500)를 섞으면 위계가 흐려진다. (Apple의 절제된 굵기 사다리에서 차용 — 단 폰트는 우리 것 유지.)
- **숫자 글꼴(Space Grotesk)에는 음수 자간(-0.01em)을 준다** — 기간 제목·상세 제목. 날짜가 또렷하고 단단하게 읽힌다.
- 본문 글꼴(Pretendard)은 자간을 건드리지 않는다.

## Layout & Spacing

- **기본 단위:** 그리드 갭은 `{spacing.xs}`(6px), 칩 간격은 `{spacing.xxs}`(3px). 바·본문 외곽 패딩은 `{spacing.lg}`–`{spacing.xl}`(18–22px).
- **월 그리드:** `repeat(7, 1fr)`, 행 높이 `minmax({spacing.cell-min}, 1fr)`(최소 112px), 갭 6px. 셀은 흰 면 + 1px 괘선.
- **주 그리드:** 7열, 각 열 최소 380px. 모바일에선 가로 스크롤 + scroll-snap으로 전환(아래 반응형 참조).
- **종이 질감:** 보디 배경에 26px(`{spacing.grid-texture}`) 모눈을 3% 알파 잉크 선으로 깐다. 장식이지만 "플래너 종이"라는 주제를 직접 인코딩한다.
- **다이얼로그:** `min(520px, 94vw)`, 중앙. 백드롭은 잉크 32% 알파.

## Elevation & Depth

| 단계 | 처리 | 용도 |
|---|---|---|
| Flat | 그림자 없음 | 셀, 요일 머리글, 본문 |
| Hairline | 1px `{colors.line}` | 셀·입력·구분선 |
| Soft | `{shadow.soft}` | 보조 버튼 hover, 잔잔한 떠오름 |
| Accent | `{shadow.accent}` / `{shadow.accent-hover}` | 1차 버튼 — 시그니처색을 머금은 컬러 그림자 |
| Sheet | `{shadow.sheet}` | 다이얼로그 |
| Offset | `{shadow.brand-offset}` | 브랜드 마크 — 균일 그림자 클리셰를 피한 딱딱한 오프셋(스티커 느낌) |

그림자는 균일하게 바르지 않는다. 1차 버튼만 컬러 그림자로 떠 있고, 셀·칩은 평평하게 둔다.

## Shapes (Radius)

| 토큰 | 값 | 용도 |
|---|---|---|
| `{rounded.hair}` | 3px | 브랜드 마크, 작은 라벨(변경/본부장) |
| `{rounded.chip}` | 4px | 일정 칩, 포커스 라운딩 |
| `{rounded.today}` | 6px | '오늘' 잉크 블록 |
| `{rounded.input}` | 7px | 텍스트/날짜/시간 입력, select |
| `{rounded.md}` | 8px | 셀, 버튼, 세그먼트, 빈 화면 카드 |
| `{rounded.sheet}` | 14px | 다이얼로그 |

크기를 위계적으로 달리해 "모든 곳에 같은 둥근 모서리"를 피한다.

## Signature Elements

대담함은 한 곳 — **오늘**. 나머지는 이 시그니처를 보조한다.

1. **오늘 = 잉크 블록.** 날짜 숫자가 잉크 배경 + 종이색으로 반전(`{component.day-today-num}`). 월·주 보기 모두 동일.
2. **변경 표시 (24시간).** 새로 추가·수정된 일정은 `{component.chip-changed}` — 칩 왼쪽 안쪽에 2px accent 괘선 + `{component.chip-badge}` 라벨. `createdAt == updatedAt`이면 "신규", 아니면 "수정"으로 구분한다(CLAUDE.md MVP). 색만 쓰지 않고 라벨을 병행한다. 24시간 경과 시 자동 소멸 — 렌더 시점에 `now − updatedAt < 24h`로 매번 파생하며 데이터에 박지 않는다.
3. **본부장 일정 강조.** 본부장이 참석하는 일정 칩은 `{component.chip-head}` — 파란 잉크 강조선(4px) + 12% 틴트 + 굵은 제목 + "본부장" 라벨로 다른 일정과 뚜렷이 구분된다. 그 외 칩은 조용한 중립색으로 둔다. 참석자 데이터의 `isHead` 플래그로만 판단(이름 문자열 매칭 금지).
4. **본부장 참석자 표기.** 상세 화면 참석자 목록에서도 `{component.attendee-head}`(파랑 + 굵게) + `{component.head-tag}`("본부장" 라벨).
5. **브랜드 마크의 오프셋 그림자.** 책상 라벨 스티커 은유 — 시스템에서 유일한 하드 그림자.

## Components

### Toolbar
**`app-bar`** — 흰 상단 바, 하단 1px 괘선. 좌측 브랜드, 가운데 기간 네비(오늘/‹/제목/›), 우측 보기 전환(월·주) + "일정 더하기" 1차 버튼. 모바일에서 wrap.

**`brand-mark`** — 14px 잉크블루 사각형 + `{shadow.brand-offset}`. **`period`** — `{typography.period}`, `aria-live="polite"`로 기간 변경을 읽어줌.

### Buttons
**`button-primary`**("저장", "일정 더하기") — `{colors.accent}` 배경, 흰 글자, `{shadow.accent}`. hover 시 `{colors.accent-strong}` + `{shadow.accent-hover}`.
**`button-ghost`**("취소") — 흰 배경 + 괘선. hover 시 테두리·글자가 accent로.
**`button-danger`**("삭제") — 투명 배경 + 경고색 글자/테두리. hover 시 경고색 채움.
**`button-step`** — 32px 정사각 아이콘 버튼(‹ › × 닫기).
**`seg` / `seg-selected`** — 월/주 세그먼트. 선택 시 `{colors.ink}` 배경 + 종이색(잉크 반전).

### Month View
**`month-grid`** — 7열. **`day`** — 흰 셀 + 괘선. `{component.day-outside}`(타 월, 가라앉음), `{component.day-selected}`(accent 테두리 + 1px 링), `.today`(잉크 블록 날짜). **`chip`**(일정), **`more`**("+n 더보기").

### Week View
**`week-col`** — 요일별 세로 열(최소 380px). 머리글에 요일 + 날짜 숫자, 오늘이면 잉크 블록. 빈 열은 `col-empty`("일정 없음" 톤다운).

### Dialogs (입력 / 상세)
**`sheet`** — `<dialog>`. head/body/foot 3단. **입력 폼** 필드 순서는 데이터 모델을 따른다 — 내용(필수) → 시간(종일 체크 + 날짜/시작–종료) → 장소·담당부서 → 참석자(이름 + 본부장 체크). **상세**는 (본부장 참석 시 "본부장 참석" 라벨 +) 변경 배지 + 제목 + 정의 목록 + 참석자(본부장 강조).

### Inputs & Tags
**`text-input`** — 흰 배경 + 괘선, `{rounded.input}`. **`chip-head-label` / `head-tag`** — "본부장" 파란 외곽 라벨(칩 / 상세). **`chip-badge`** — "신규" accent 외곽 라벨(신규 일정만).

### Focus
**`focus-ring`** — 모든 포커스 요소에 2px accent 아웃라인 + 2px offset. **`focus-ring-button`** — 버튼은 흰 안쪽 링 + 바깥 accent 링 두 겹으로, 잉크/컬러 배경 위에서도 또렷하게.

## Do's and Don'ts

### Do
- `{colors.accent}` 하나를 시그니처로 일관되게 — 오늘/선택/포커스/1차 버튼/변경 표시가 같은 색을 공유한다.
- 날짜·시간은 Space Grotesk, UI 텍스트는 Pretendard. 경계를 지킨다.
- 변경·본부장은 **색 + 비-색 단서(라벨/굵기)**를 함께 준다.
- '오늘'에만 색을 가득 채운다(잉크 블록). 나머지는 평평하고 조용하게.
- 본부장은 `isHead` 플래그로 판단한다 — 이름 문자열 매칭 금지.
- "변경됨"은 `updatedAt`에서 렌더 시점에 파생한다 — 저장 데이터에 상태로 박지 않는다.

### Don't
- 크림(#F4F1EA) + 세리프 + 테라코타로 회귀하지 않는다. paper는 의도적으로 회녹이다.
- 분류색은 낮은 채도로 유지하고 항상 라벨을 병행한다 — 채도를 올려 무지개로 만들지 않는다. 본부장(head-blue)과 우선(잉크 태그)은 분류와 다른 축이니 섞지 않는다.
- accent(시그니처)와 head-blue(본부장)를 섞지 않는다 — 역할이 다르다.
- 모든 요소에 그림자·둥근 모서리를 균일하게 바르지 않는다. radius·그림자는 위계적이다.
- 형광색 점이나 무지개 배지로 "변경"을 표시하지 않는다 — 가는 accent 괘선 + 라벨로 통일.
- 곳곳에 모션을 흩뿌리지 않는다. hover/active의 미세 transform과 다이얼로그 진입 한 순간만.

## Accessibility

- **키보드:** 모든 인터랙션에 `:focus-visible` 링. 셀은 화살표 키로 이동(앱 로직). 다이얼로그는 `<dialog>`로 포커스 트랩.
- **색각:** 색 단독 의미 전달 금지 — 변경(괘선+라벨), 본부장(파랑+굵게+라벨), 요일(색+위치) 모두 비-색 단서 병행.
- **명암:** 잉크(#21252b)/종이(#f1f2ed) 본문, 흰 셀 위 텍스트 모두 충분한 대비. accent 위 흰 글자 대비 확보.
- **라이브 영역:** 기간 제목 `aria-live="polite"`.

## Motion

`prefers-reduced-motion: no-preference`에서만 동작. transition은 명시 속성만(`transition: all` 금지).
- 버튼 hover 미세 확대/상승, active 축소(scale 0.96).
- 칩 hover 시 2px 우측 이동.
- 다이얼로그 진입 0.16s 페이드+상승 한 번.
환경 설정이 reduced면 모든 transform/animation 비활성.

## Responsive

| 폭 | 변화 |
|---|---|
| ≤ 760px | app-bar 압축, bar-end 전폭 분산. 월 셀 높이 78px로. 칩 시간 숨김(제목 우선). **주 보기는 가로 스크롤 + scroll-snap 카드(78% 폭)로 전환.** 폼의 2열·시간 그리드는 1열로 스택. |
| > 760px | 월 7열 그리드, 주 7열 병렬, 폼 2열. |

## Apple 참고에서 차용 / 비차용

[design-ref/apple.DESIGN.md](design-ref/apple.DESIGN.md)를 참고했다. Apple은 *사진 우선·미술관 갤러리* 컨셉의 **마케팅 사이트**라 외형을 그대로 가져오면 우리의 데스크 플래너 주제와 `CLAUDE.md`의 "AI 템플릿 회피" 원칙에 어긋난다. 그래서 **외형이 아니라 규율만** 골라 녹였다.

### 차용한 원칙
- **"일정이 말하게, 크롬은 물러난다."** Apple은 제품 사진이 말하도록 UI를 지운다. 우리에게 콘텐츠는 *일정*이다 — 셀·괘선·버튼은 조용히 두고, 일정 칩과 날짜 숫자가 화면의 목소리를 가진다. 강조가 필요하면 크롬(테두리·그림자)을 더하기 전에 **톤 전환**(오늘 = 잉크 블록, 타 월 셀 = 가라앉힌 면)을 먼저 쓴다.
- **단일 액센트 불가침.** 모든 "click me" 신호는 `{colors.accent}` 하나로 — 오늘/선택/포커스/1차 버튼/변경 표시가 같은 색을 공유한다. 두 번째 액센트 색을 만들지 않는다. (`{colors.head-blue}`는 액센트가 아니라 본부장 데이터를 인코딩하는 의미색이라 예외다.)
- **그림자는 목적이 있을 때만.** Apple은 시스템 전체에 그림자가 사실상 하나다. 우리도 균일하게 바르지 않는다 — 1차 버튼의 컬러 그림자, 다이얼로그, 브랜드 마크의 오프셋만 의도적으로 쓰고 셀·칩은 평평하게 둔다(위 Elevation 표).
- **시스템 단일 프레스 모션.** 모든 버튼의 누름 상태는 `transform: scale(0.96)` 하나로 통일한다(Apple의 `scale(0.95)` 차용). 곳곳에 다른 모션을 만들지 않는다.
- **의도적 굵기 사다리.** 400 / 600 / 700, 500 금지 (위 Typography 원칙 참조).

### 의도적으로 버린 것 (이유)
- **풀블리드 명/암 교차 타일, 미술관 갤러리 레이아웃** — 마케팅 사이트 패턴이고 업무 달력의 조밀한 그리드와 충돌한다. 우리는 흰 셀 + 괘선의 반복으로 간다.
- **pill(`rounded.pill`) CTA를 "액션 신호"로 쓰는 문법** — 우리는 정갈한 직각계 radius(플래너/장부 질감)를 시그니처로 삼는다. pill을 들이면 주제가 흐려진다. 액션 신호는 색(accent)으로 준다.
- **SF Pro / Action Blue(#0066cc) / 17px 본문** — 우리는 한글 가독성(Pretendard)과 날짜 숫자 개성(Space Grotesk), 자체 잉크블루 액센트를 쓴다. 폰트·색은 갈아끼우지 않는다.
- **다크 모드 기본** — 현재 단일 라이트 테마(아래 Known Gaps 참조).

## Known Gaps / Scope

- 이 스펙은 **앱 UI**를 다룬다 — 마케팅 페이지·랜딩은 범위 밖.
- 다크 모드는 정의하지 않았다(현재 단일 라이트 테마). 도입 시 paper/surface/ink 반전 + accent 명도 재조정 필요.
- 반복 일정의 복잡한 표시(RRULE), 알림 배지, 다중 사용자 색 구분은 MVP 밖이라 토큰을 두지 않았다.
- 일정 분류(카테고리/색상)와 우선순위는 **CLAUDE.md MVP대로 포함한다**(과거엔 단순화로 뺐으나 2026-06-25 재도입). 본부장 강조와 충돌하지 않게 절제했다 — 카테고리는 낮은 채도 색 + 항상 2글자 라벨(회의=중립, 마감=경고색, 외근 `#3f6b52`, 개인 `#6f6285`), 본부장(head-blue)이 카테고리 색을 덮어쓴다. 우선순위는 색이 아니라 채운 잉크 태그("우선")로 표시해 아웃라인 태그와 모양으로 구분한다. 굵은 제목은 여전히 본부장 전용.
- 토큰 값의 원본은 [css/styles.css](css/styles.css)의 `:root`다. 색/간격을 바꿀 때 이 문서와 CSS를 함께 갱신한다.
