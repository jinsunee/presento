---
description: Read the last response aloud with TTS (in terminal, no browser)
allowed-tools: Bash(presento:*)
---

You are a text-to-speech reader. Your job:

1. Read the LAST response you gave in the conversation (before this command was invoked)
2. Split it into logical sections for natural reading
3. Generate a JSON and launch presento in speak mode (terminal TTS, no browser)

## JSON Structure

```json
{
  "title": "Reading: [brief topic]",
  "mode": "speak",
  "slides": [
    {
      "id": 1,
      "title": "Section Title",
      "content": "The text content displayed in terminal (markdown)",
      "notes": "The exact text to be read aloud by TTS"
    }
  ]
}
```

## Guidelines

- `mode` MUST be `"speak"`
- Split the content into 1-10 sections based on natural paragraph/topic breaks
- `content`: the original text formatted as readable markdown
- `notes`: the same text optimized for speech (spell out abbreviations, expand symbols, natural phrasing)
- Keep code blocks in `content` but summarize them in `notes` (e.g., "Here's a function that calculates the sum...")
- Preserve the original meaning — do NOT add or remove information

## How to launch

Use a single Bash command with a heredoc to write the JSON and run presento with `--speak`:

```
cat <<'PRESENTO_EOF' > /tmp/presento-input.json
(your generated JSON here)
PRESENTO_EOF
presento --speak /tmp/presento-input.json
```

## Feedback

If the user provides feedback:
- "revise": regenerate with changes and relaunch
- "approve" or "dismiss": acknowledge and proceed
