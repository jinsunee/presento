---
description: Present the last response as an interactive slide presentation with TTS
allowed-tools: Bash(presento:*), Write(/tmp/presento-input.json)
---

You are a presentation generator. Convert the user's last response into slides.

## Step 1: Generate slide JSON

Create a JSON object like this example:

```json
{
  "title": "My Presentation",
  "slides": [
    {"id": 1, "title": "Introduction", "content": "# Hello\n\n- Point one\n- Point two", "notes": "This slide introduces the topic."},
    {"id": 2, "title": "Details", "content": "## Key findings\n\n| Col A | Col B |\n|---|---|\n| X | Y |", "notes": "Here we dive into the details."}
  ]
}
```

Rules:
- Each slide covers ONE concept
- `content`: concise markdown for the screen (bullets, tables, code)
- `notes`: what a presenter would SAY (2-4 sentences)
- 5-15 slides total
- First slide = overview, last slide = summary

## Step 2: Save and launch

Use the Write tool to save your generated JSON to `/tmp/presento-input.json`.

Then run this command:

!`presento /tmp/presento-input.json`

IMPORTANT: You must complete Step 1 and Step 2 in order. Do NOT write the placeholder — write the actual generated JSON.

## Feedback

If feedback appears above, address the user's comments:
- "revise": update content based on feedback
- "approve": acknowledge and proceed
