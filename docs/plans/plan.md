---
created: 2026-03-23
---

# Presento Implementation Plan

> **For Claude:** Use `/executing-plans` to implement this plan.

**Goal:** Claude Code 답변을 슬라이드+TTS 프레젠테이션으로 변환하고, 피드백을 수집해서 돌려주는 오픈소스 플러그인.

**Architecture:** Plannotator 패턴. Bun HTTP 서버 + React SPA (single-file) + Web Speech API TTS. 슬래시 커맨드(`/presentation`, `/speak`)로 트리거, stdin으로 슬라이드 JSON 수신, stdout으로 피드백 반환.

**Tech Stack:** Bun, React 19, Tailwind CSS 4, Vite + vite-plugin-singlefile, Web Speech API / OpenAI TTS

---

## Task Groups

| Group | Tasks | Parallel? |
|-------|-------|-----------|
| A | Task 1 → 2 → 3: 프로젝트 셋업 + 타입 + 서버 | Yes (with B after Task 1) |
| B | Task 4 → 5 → 6: React UI 컴포넌트 | Yes (with A after Task 1) |
| C | Task 7 → 8: Hook 앱 + 슬래시 커맨드 | After A, B |
| D | Task 9: 플러그인 설정 + 빌드 | After C |

## Dependency Graph

```
Group A: Task 1 (scaffolding) → Task 2 (types) → Task 3 (server)
Group B: Task 4 (slide viewer) → Task 5 (TTS) → Task 6 (feedback UI)

         ↓ A, B complete ↓

Group C: Task 7 (CLI entry) → Task 8 (slash commands)

         ↓ C complete ↓

Group D: Task 9 (plugin config + build)
```

A and B can run in parallel (both depend only on Task 1 scaffolding).

## Task Files

- `tasks/group-a.md` - 프로젝트 셋업, 타입 정의, Bun HTTP 서버
- `tasks/group-b.md` - SlideViewer, TTS 엔진, 피드백 UI
- `tasks/group-c.md` - CLI 엔트리 포인트, 슬래시 커맨드
- `tasks/group-d.md` - 플러그인 설정, Vite 빌드, install 스크립트
