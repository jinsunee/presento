---
created: 2026-03-23
---

# Presento — Design Document

## 한 줄 요약

Claude Code 답변을 슬라이드+TTS 프레젠테이션으로 변환하고, 피드백을 수집해서 돌려주는 오픈소스 플러그인.

## 아키텍처

Plannotator 패턴을 따른다.

```
Claude Code
    │
    ├── /presentation  (slash command)
    │     → 마지막 답변을 발표용 슬라이드 JSON으로 재구성 (Claude가 변환)
    │     → JSON을 stdin으로 Presento 서버에 전달
    │     → Bun HTTP 서버 시작 (랜덤 포트)
    │     → 브라우저 자동 오픈
    │
    ├── /speak  (slash command)
    │     → 마지막 답변을 미니 브라우저 창에서 TTS 재생
    │
    └── stdout JSON으로 피드백 수신
          → Claude Code 세션에 코멘트 전달
```

## 기술 스택

- **서버:** Bun
- **프론트엔드:** React + Tailwind, vite-plugin-singlefile
- **TTS 기본:** Web Speech API (브라우저 내장, 무료)
- **TTS 옵션:** OpenAI TTS API (OPENAI_API_KEY 환경변수)
- **빌드:** Vite, 모노레포 (apps/ + packages/)

## 슬라이드 변환

### 플로우

```
원본 답변 (마크다운)
    │
    ▼
Claude Code 세션 내에서 발표용 슬라이드 JSON으로 재구성
(사용자의 기존 Claude 구독으로 처리, 추가 비용 없음)
    │
    ▼
구조화된 슬라이드 JSON → Presento 서버에 전달
    │
    ▼
브라우저에서 렌더링 + TTS
```

### 슬라이드 JSON 포맷

```json
{
  "title": "프레젠테이션 제목",
  "slides": [
    {
      "id": 1,
      "title": "슬라이드 제목",
      "content": "마크다운 콘텐츠 (화면 표시용)",
      "notes": "TTS용 발표 스크립트 (음성 재생용)"
    }
  ]
}
```

핵심: `content`는 화면에 보이는 요약, `notes`는 TTS가 읽는 상세 스크립트. 발표자처럼 "화면에는 요약, 말로는 상세 설명" 가능.

## 브라우저 UI

```
┌─────────────────────────────────────────────┐
│  Presento          ◀ 3/12 ▶    ▶️ ⏸️ 🔊    │  ← 상단바: 네비게이션 + TTS 컨트롤
├─────────────────────────────────────────────┤
│                                             │
│         [  슬라이드 콘텐츠  ]                 │  ← 메인: 현재 슬라이드
│                                             │
│         코드, 테이블, 불릿 등                 │
│                                             │
├─────────────────────────────────────────────┤
│  💬 이 슬라이드에 코멘트 남기기...            │  ← 하단: 슬라이드별 코멘트 입력
├─────────────────────────────────────────────┤
│  ◀ Prev    [슬라이드 미니맵]    Next ▶       │  ← 썸네일 네비게이션
│  ┌──┐ ┌──┐ ┌▓▓┐ ┌──┐ ┌──┐                  │
│  └──┘ └──┘ └▓▓┘ └──┘ └──┘                  │
└─────────────────────────────────────────────┘
```

### TTS 동작

- ▶️ 현재 슬라이드부터 자동 재생 (TTS + 슬라이드 자동 넘김)
- ⏸️ 일시정지 → 코멘트 작성 → ▶️ 재개
- 🔊 음성 설정 (속도, 음성 선택, OpenAI TTS 전환)
- 키보드: `Space` 재생/정지, `←→` 슬라이드 이동

## 피드백 & 제출

### 피드백 구조

- **슬라이드별 코멘트:** 각 슬라이드에 개별 피드백
- **전체 피드백:** 프레젠테이션 전체에 대한 종합 의견

### 제출 API

```
POST /api/feedback
{
  slides_comments: [
    { slide: 3, comment: "코드 예시 추가해줘" },
    { slide: 7, comment: "너무 길어, 요약해줘" }
  ],
  overall: "테스트 전략 부분 더 구체적으로",
  action: "revise"
}
```

### 액션 3가지

| 액션 | 설명 |
|------|------|
| **Revise** | 피드백 반영해서 다시 해줘 |
| **Approve** | 좋아, 이대로 진행 |
| **Dismiss** | 닫기 (피드백 없이 종료) |

## 슬래시 커맨드

### /presentation

1. Claude Code가 마지막 답변을 슬라이드 JSON으로 재구성
2. JSON을 stdin으로 Presento 서버에 전달
3. Bun 서버 시작 → 브라우저 오픈
4. 사용자가 보고, 피드백하고, 제출
5. stdout으로 피드백 수신 → Claude가 이어서 대화

### /speak

1. 마지막 답변 텍스트 추출
2. 미니 브라우저 창 오픈 → Web Speech API로 TTS 재생
3. 크로스플랫폼 호환 (브라우저 기반)

## API 라우트

| Endpoint | Method | 용도 |
|----------|--------|------|
| `/api/slides` | GET | 슬라이드 데이터 반환 |
| `/api/feedback` | POST | 피드백 제출, 서버 종료 |
| `/*` | GET | SPA HTML 서빙 |

## 프로젝트 구조

```
presento/
├── apps/
│   └── hook/                  # Claude Code 플러그인
│       ├── server/
│       │   └── index.ts       # Bun HTTP 서버 (메인 엔트리)
│       ├── commands/
│       │   ├── presentation.md  # /presentation 슬래시 커맨드
│       │   └── speak.md        # /speak 슬래시 커맨드
│       ├── hooks/
│       │   └── hooks.json     # 훅 설정
│       ├── index.tsx          # React 엔트리
│       └── vite.config.ts
├── packages/
│   ├── server/                # 서버 로직
│   │   ├── index.ts           # HTTP 서버, 라우트
│   │   └── browser.ts         # 크로스플랫폼 브라우저 오픈
│   └── ui/                    # React UI 컴포넌트
│       ├── components/
│       │   ├── SlideViewer.tsx
│       │   ├── SlideNav.tsx
│       │   ├── CommentInput.tsx
│       │   ├── TTSControls.tsx
│       │   └── FeedbackPanel.tsx
│       ├── utils/
│       │   ├── tts.ts         # TTS 엔진 (Web Speech + OpenAI)
│       │   └── markdown.ts    # 마크다운 렌더링
│       └── types.ts
├── package.json
└── README.md
```

## 설치 방법

### 1단계: 바이너리 설치 (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/blueberryworks/presento/main/scripts/install.sh | sh
```

- Bun으로 컴파일된 단일 바이너리 → `~/.local/bin/presento`
- 사용자가 Bun 설치 안 해도 됨
- GitHub Releases에서 플랫폼별 바이너리 자동 다운로드 (macOS/Linux/Windows, x64/arm64)
- SHA256 체크섬 검증

### 2단계: Claude Code 플러그인 등록

```bash
/plugin marketplace add blueberryworks/presento
/plugin install presento@presento
```

- `/presentation`, `/speak` 슬래시 커맨드 등록
- hooks.json 자동 설정

### 플러그인 구조

```
.claude-plugin/
├── plugin.json          # 플러그인 메타데이터 (name, version, description)
└── marketplace.json     # 마켓플레이스 등록 정보
apps/hook/
├── hooks/hooks.json     # 훅 설정
└── commands/
    ├── presentation.md  # /presentation 슬래시 커맨드
    └── speak.md         # /speak 슬래시 커맨드
```

### 빌드 & 릴리즈 (CI/CD)

```
GitHub Actions:
1. Vite로 React UI 빌드 → single-file HTML
2. Bun으로 크로스 컴파일:
   bun build apps/hook/server/index.ts --compile --target=bun-{os}-{arch}
3. GitHub Releases에 바이너리 + 체크섬 업로드
```

## 배포 모델

- **오픈소스 (무료):** 셀프호스팅, Claude Code 플러그인으로 로컬 사용
- **클라우드 (유료, 추후):** Discord 등 외부 플랫폼 연동 시 호스팅 버전
