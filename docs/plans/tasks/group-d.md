---
created: 2026-03-23
---

# Presento - Group D: 플러그인 설정 + 빌드

**Execution:** Sequential (Task 9)
**Depends on:** Group C

---

## Task 9: 플러그인 설정 + Vite 빌드 + install 스크립트

**Files:**
- Create: `projects/presento/.claude-plugin/marketplace.json`
- Create: `projects/presento/apps/hook/.claude-plugin/plugin.json`
- Create: `projects/presento/apps/hook/vite.config.ts`
- Create: `projects/presento/apps/hook/index.html`
- Create: `projects/presento/scripts/install.sh`
- Create: `projects/presento/README.md`

**Step 1: Claude Code 플러그인 메타데이터**

`.claude-plugin/marketplace.json`:
```json
{
  "name": "presento",
  "owner": {
    "name": "blueberryworks"
  },
  "plugins": [
    {
      "name": "presento",
      "source": "./apps/hook",
      "description": "Turn Claude Code responses into interactive slide presentations with TTS narration and feedback collection."
    }
  ]
}
```

`apps/hook/.claude-plugin/plugin.json`:
```json
{
  "name": "presento",
  "description": "Turn Claude Code responses into interactive slide presentations with TTS narration and feedback collection.",
  "version": "0.1.0",
  "author": {
    "name": "blueberryworks"
  },
  "repository": "https://github.com/blueberryworks/presento",
  "keywords": ["presentation", "tts", "slides", "voice", "feedback"]
}
```

**Step 2: Vite 설정**

`apps/hook/vite.config.ts`:
```typescript
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import tailwindcss from "@tailwindcss/vite";
import pkg from "../../package.json";

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@presento/ui": path.resolve(__dirname, "../../packages/ui"),
      "@presento/server": path.resolve(__dirname, "../../packages/server"),
    },
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```

`apps/hook/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presento</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
```

**Step 3: install.sh 스크립트**

`scripts/install.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="blueberryworks/presento"
BINARY_NAME="presento"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local}/bin"

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac
PLATFORM="${OS}-${ARCH}"

echo "Installing Presento for ${PLATFORM}..."

# Get latest release
LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "$LATEST" ]; then
  echo "Failed to fetch latest release"
  exit 1
fi

# Download binary
URL="https://github.com/${REPO}/releases/download/${LATEST}/${BINARY_NAME}-${PLATFORM}"
echo "Downloading ${URL}..."
curl -fsSL -o "/tmp/${BINARY_NAME}" "$URL"

# Download and verify checksum
CHECKSUM_URL="${URL}.sha256"
curl -fsSL -o "/tmp/${BINARY_NAME}.sha256" "$CHECKSUM_URL"
cd /tmp && shasum -a 256 -c "${BINARY_NAME}.sha256"

# Install
mkdir -p "$INSTALL_DIR"
mv "/tmp/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo "Installed to ${INSTALL_DIR}/${BINARY_NAME}"

# Check PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo ""
  echo "⚠️  ${INSTALL_DIR} is not in your PATH. Add it:"
  echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
fi

echo ""
echo "✅ Presento installed! Next steps:"
echo "  1. In Claude Code: /plugin marketplace add ${REPO}"
echo "  2. In Claude Code: /plugin install presento@presento"
echo "  3. Use /presentation or /speak in any conversation"
```

**Step 4: README.md 작성**

`README.md`:
```markdown
# Presento

Turn Claude Code responses into interactive slide presentations with TTS narration.

## Features

- 📊 **Slide View** — Long responses become digestible slides
- 🔊 **TTS Narration** — Listen like a real presentation (Web Speech API or OpenAI TTS)
- 💬 **Interactive Feedback** — Pause, comment on slides, submit feedback
- 🔄 **Feedback Loop** — Comments go back to Claude for revision

## Install

### 1. Install binary

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/blueberryworks/presento/main/scripts/install.sh | sh
\`\`\`

### 2. Add to Claude Code

\`\`\`
/plugin marketplace add blueberryworks/presento
/plugin install presento@presento
\`\`\`

## Usage

### /presentation

Converts the last Claude response into a slide presentation with TTS.

### /speak

Reads the last response aloud using text-to-speech.

## TTS Options

| Engine | Setup | Quality |
|--------|-------|---------|
| Web Speech API (default) | None | Basic, free |
| OpenAI TTS | Set `OPENAI_API_KEY` env var | Natural, paid |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRESENTO_BROWSER` | System default | Custom browser to open |
| `OPENAI_API_KEY` | - | Enable OpenAI TTS |

## Development

\`\`\`bash
bun install
bun run dev        # Vite dev server
bun run build      # Build single-file HTML
bun run serve      # Run Bun server locally
\`\`\`

## License

MIT
\`\`\`

**Step 5: Commit**

```bash
git add projects/presento/.claude-plugin/ projects/presento/apps/hook/.claude-plugin/ projects/presento/apps/hook/vite.config.ts projects/presento/apps/hook/index.html projects/presento/scripts/ projects/presento/README.md
git commit -m "feat(presento): add plugin config, Vite build, install script, and README"
```
