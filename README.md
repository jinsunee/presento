# Presento

Turn Claude Code responses into interactive slide presentations with TTS narration.

## Features

- **Slide View** — Long responses become digestible slides
- **TTS Narration** — Listen like a real presentation (Web Speech API or OpenAI TTS)
- **Interactive Feedback** — Pause, comment on slides, submit feedback
- **Voice Feedback** — Hold M or click mic to leave voice comments (Whisper)
- **Feedback Loop** — Comments go back to Claude for revision

## Install

### 1. Install binary

```bash
curl -fsSL https://raw.githubusercontent.com/jinsunee/presento/main/scripts/install.sh | sh
```

### 2. Add to Claude Code

```
/plugin marketplace add jinsunee/presento
/plugin install presento@presento
```

## Usage

### /presentation

Converts the last Claude response into a slide presentation with TTS.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Stop |
| `Arrow Left/Right` | Navigate slides (without stopping TTS) |
| `M` (hold) | Voice feedback (push-to-talk) |

## TTS Options

| Engine | Setup | Quality |
|--------|-------|---------|
| Web Speech API (default) | None | Basic, free |
| OpenAI TTS | Set `OPENAI_API_KEY` env var | Natural, paid |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRESENTO_BROWSER` | System default | Custom browser to open |
| `OPENAI_API_KEY` | - | Enable OpenAI TTS + Whisper voice feedback |

## Development

```bash
bun install
bun run dev        # Vite dev server
bun run build      # Build single-file HTML
bun run serve      # Run Bun server locally
```

## License

MIT
