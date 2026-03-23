---
description: Present the last response as an interactive slide presentation with TTS
allowed-tools: Bash(presento:*), Write(/tmp/presento-input.json)
---

## Instructions

Convert my last response into a presentation. Generate a JSON object with this exact structure:

{
  "title": "Presentation title",
  "slides": [
    {
      "id": 1,
      "title": "Slide title",
      "content": "Concise markdown for display (bullet points, code, tables)",
      "notes": "Detailed narration script for TTS - explain as if presenting to an audience"
    }
  ]
}

Guidelines for slide creation:
- Each slide should cover ONE concept or section
- `content`: concise, visual - what appears on screen (bullets, code snippets, diagrams)
- `notes`: detailed narration - what a presenter would SAY (2-4 sentences per slide)
- Keep slides to 5-15 per presentation
- Use markdown formatting in content (headers, lists, code blocks, tables)
- First slide = title/overview, last slide = summary/next steps

Then:
1. Write the JSON to `/tmp/presento-input.json` using the Write tool
2. Run: !`presento /tmp/presento-input.json`

## Feedback

The user's feedback from the presentation will appear above. Address their comments:
- For "revise" actions: update the content based on slide-specific and overall feedback
- For "approve" actions: proceed with the current direction, noting any additional comments
