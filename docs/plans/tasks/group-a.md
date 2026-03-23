---
created: 2026-03-23
---

# Presento - Group A: 프로젝트 셋업 + 타입 + 서버

**Execution:** Sequential (Task 1 → 2 → 3)

---

## Task 1: 모노레포 스캐폴딩

**Files:**
- Create: `projects/presento/package.json`
- Create: `projects/presento/tsconfig.json`
- Create: `projects/presento/apps/hook/package.json`
- Create: `projects/presento/packages/server/package.json`
- Create: `projects/presento/packages/ui/package.json`
- Create: `projects/presento/bunfig.toml`

**Step 1: 루트 package.json 생성**

```json
{
  "name": "presento",
  "version": "0.1.0",
  "private": true,
  "description": "Turn Claude Code responses into slide presentations with TTS and interactive feedback",
  "author": "blueberryworks",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/blueberryworks/presento.git"
  },
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --cwd apps/hook dev",
    "build": "bun run --cwd apps/hook build",
    "serve": "bun run --cwd apps/hook serve"
  }
}
```

**Step 2: 각 워크스페이스 package.json 생성**

`apps/hook/package.json`:
```json
{
  "name": "@presento/hook",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "bun run server/index.ts"
  },
  "dependencies": {
    "@presento/server": "workspace:*",
    "@presento/ui": "workspace:*",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "tailwindcss": "^4.1.18",
    "@tailwindcss/vite": "^4.1.18"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "vite-plugin-singlefile": "^2.0.3",
    "@types/node": "^22.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

`packages/server/package.json`:
```json
{
  "name": "@presento/server",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./browser": "./browser.ts"
  }
}
```

`packages/ui/package.json`:
```json
{
  "name": "@presento/ui",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./components/*": "./components/*",
    "./utils/*": "./utils/*",
    "./types": "./types.ts"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  }
}
```

**Step 3: tsconfig.json + bunfig.toml 생성**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@presento/server": ["./packages/server"],
      "@presento/server/*": ["./packages/server/*"],
      "@presento/ui": ["./packages/ui"],
      "@presento/ui/*": ["./packages/ui/*"]
    }
  },
  "include": ["apps/**/*.ts", "apps/**/*.tsx", "packages/**/*.ts", "packages/**/*.tsx"]
}
```

`bunfig.toml`:
```toml
[install]
linker = "isolated"
```

**Step 4: bun install**

```bash
cd projects/presento && bun install
```

Expected: 의존성 설치 완료, node_modules 생성

**Step 5: Commit**

```bash
git add projects/presento/package.json projects/presento/tsconfig.json projects/presento/bunfig.toml projects/presento/apps/ projects/presento/packages/
git commit -m "feat(presento): scaffold monorepo with hook app and server/ui packages"
```

---

## Task 2: 공유 타입 정의

**Files:**
- Create: `projects/presento/packages/ui/types.ts`

**Step 1: 타입 파일 작성**

```typescript
// Slide data structure
export interface Slide {
  id: number;
  title: string;
  /** Markdown content for display */
  content: string;
  /** TTS narration script (separate from display content) */
  notes: string;
}

// Full presentation data
export interface Presentation {
  title: string;
  slides: Slide[];
}

// Per-slide comment
export interface SlideComment {
  slide: number;
  comment: string;
}

// Feedback submitted by user
export interface Feedback {
  slides_comments: SlideComment[];
  overall: string;
  action: "revise" | "approve" | "dismiss";
}

// TTS engine type
export type TTSEngine = "web-speech" | "openai";

// TTS settings
export interface TTSSettings {
  engine: TTSEngine;
  rate: number; // 0.5 - 2.0
  voice?: string;
  openaiApiKey?: string;
}

// Server response types
export interface SlidesResponse {
  presentation: Presentation;
  origin: string;
}

export interface FeedbackResponse {
  ok: boolean;
}
```

**Step 2: packages/ui/index.ts 엔트리 생성**

```typescript
export * from "./types";
```

**Step 3: Commit**

```bash
git add projects/presento/packages/ui/types.ts projects/presento/packages/ui/index.ts
git commit -m "feat(presento): add shared types for slides, feedback, and TTS"
```

---

## Task 3: Bun HTTP 서버

**Files:**
- Create: `projects/presento/packages/server/index.ts`
- Create: `projects/presento/packages/server/browser.ts`

**Step 1: browser.ts 작성**

Plannotator의 브라우저 유틸을 Presento용으로 작성:

```typescript
import { $ } from "bun";
import os from "node:os";

async function isWSL(): Promise<boolean> {
  if (process.platform !== "linux") return false;
  if (os.release().toLowerCase().includes("microsoft")) return true;
  try {
    const file = Bun.file("/proc/version");
    if (await file.exists()) {
      const content = await file.text();
      return content.toLowerCase().includes("wsl") || content.toLowerCase().includes("microsoft");
    }
  } catch {}
  return false;
}

export async function openBrowser(url: string): Promise<boolean> {
  try {
    const browser = process.env.PRESENTO_BROWSER;
    const platform = process.platform;
    const wsl = await isWSL();

    if (browser) {
      if (platform === "darwin") {
        await $`open -a ${browser} ${url}`.quiet();
      } else if (platform === "win32" || wsl) {
        await $`cmd.exe /c start "" ${browser} ${url}`.quiet();
      } else {
        await $`${browser} ${url}`.quiet();
      }
    } else {
      if (platform === "win32" || wsl) {
        await $`cmd.exe /c start ${url}`.quiet();
      } else if (platform === "darwin") {
        await $`open ${url}`.quiet();
      } else {
        await $`xdg-open ${url}`.quiet();
      }
    }
    return true;
  } catch {
    return false;
  }
}
```

**Step 2: index.ts 서버 작성**

```typescript
import { openBrowser } from "./browser";
import type { Presentation, Feedback } from "@presento/ui/types";

export { openBrowser } from "./browser";

export interface ServerOptions {
  presentation: Presentation;
  origin: string;
  htmlContent: string;
  onReady?: (url: string, port: number) => void;
}

export interface ServerResult {
  port: number;
  url: string;
  waitForFeedback: () => Promise<Feedback>;
  stop: () => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;

export async function startPresentoServer(options: ServerOptions): Promise<ServerResult> {
  const { presentation, origin, htmlContent, onReady } = options;

  let resolveFeedback: (result: Feedback) => void;
  const feedbackPromise = new Promise<Feedback>((resolve) => {
    resolveFeedback = resolve;
  });

  let server: ReturnType<typeof Bun.serve> | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      server = Bun.serve({
        port: 0, // random port

        async fetch(req) {
          const url = new URL(req.url);

          // GET /api/slides - return presentation data
          if (url.pathname === "/api/slides") {
            return Response.json({ presentation, origin });
          }

          // POST /api/feedback - receive user feedback
          if (url.pathname === "/api/feedback" && req.method === "POST") {
            const feedback = (await req.json()) as Feedback;
            resolveFeedback(feedback);
            return Response.json({ ok: true });
          }

          // Serve SPA for all other routes
          return new Response(htmlContent, {
            headers: { "Content-Type": "text/html" },
          });
        },
      });

      break;
    } catch (err: unknown) {
      const isAddressInUse = err instanceof Error && err.message.includes("EADDRINUSE");
      if (isAddressInUse && attempt < MAX_RETRIES) {
        await Bun.sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }

  if (!server) throw new Error("Failed to start server");

  const serverUrl = `http://localhost:${server.port}`;
  if (onReady) onReady(serverUrl, server.port);

  return {
    port: server.port,
    url: serverUrl,
    waitForFeedback: () => feedbackPromise,
    stop: () => server.stop(),
  };
}

export async function handleServerReady(url: string): Promise<void> {
  await openBrowser(url);
}
```

**Step 3: Commit**

```bash
git add projects/presento/packages/server/
git commit -m "feat(presento): add Bun HTTP server with slides API and feedback endpoint"
```
