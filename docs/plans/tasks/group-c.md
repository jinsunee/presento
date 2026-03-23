---
created: 2026-03-23
---

# Presento - Group C: Hook 앱 + 슬래시 커맨드

**Execution:** Sequential (Task 7 → 8)
**Depends on:** Group A (server), Group B (UI)

---

## Task 7: CLI 엔트리 포인트

**Files:**
- Create: `projects/presento/apps/hook/server/index.ts`
- Create: `projects/presento/apps/hook/index.tsx`
- Create: `projects/presento/apps/hook/App.tsx`

**Step 1: React 엔트리 (index.tsx) 작성**

`apps/hook/index.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

**Step 2: App.tsx 작성 — 메인 프레젠테이션 앱**

`apps/hook/App.tsx`:

```tsx
import { useState, useEffect, useCallback } from "react";
import { SlideViewer } from "@presento/ui/components/SlideViewer";
import { SlideNav } from "@presento/ui/components/SlideNav";
import { TTSControls } from "@presento/ui/components/TTSControls";
import { CommentInput } from "@presento/ui/components/CommentInput";
import { FeedbackPanel } from "@presento/ui/components/FeedbackPanel";
import { TTSPlayer } from "@presento/ui/utils/tts";
import type { Presentation, SlideComment, Feedback, TTSSettings } from "@presento/ui/types";

export default function App() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [comments, setComments] = useState<SlideComment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings>({
    engine: "web-speech",
    rate: 1.0,
  });

  // Fetch slides from server on mount
  useEffect(() => {
    fetch("/api/slides")
      .then(r => r.json())
      .then(data => setPresentation(data.presentation));
  }, []);

  // TTS player instance
  const [tts] = useState(() => new TTSPlayer(ttsSettings));

  // Auto-play: read slide notes, advance on end
  const playSlide = useCallback((index: number) => {
    if (!presentation) return;
    const slide = presentation.slides[index];
    setIsPlaying(true);
    setIsPaused(false);
    tts.speak(slide.notes, () => {
      // Auto-advance to next slide
      if (index < presentation.slides.length - 1) {
        setCurrentSlide(index + 1);
        playSlide(index + 1);
      } else {
        setIsPlaying(false);
        setShowFeedback(true); // Show feedback at end
      }
    });
  }, [presentation, tts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying && !isPaused) { tts.pause(); setIsPaused(true); }
        else if (isPaused) { tts.resume(); setIsPaused(false); }
        else playSlide(currentSlide);
      }
      if (e.code === "ArrowRight") setCurrentSlide(i => Math.min(i + 1, (presentation?.slides.length ?? 1) - 1));
      if (e.code === "ArrowLeft") setCurrentSlide(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPlaying, isPaused, currentSlide, presentation, tts, playSlide]);

  // Submit feedback
  const handleSubmit = async (feedback: Feedback) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    // Show success, close tab
  };

  if (!presentation) return <div>Loading...</div>;

  const slide = presentation.slides[currentSlide];

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <h1 className="text-lg font-semibold">Presento</h1>
        <TTSControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          settings={ttsSettings}
          onPlay={() => playSlide(currentSlide)}
          onPause={() => { tts.pause(); setIsPaused(true); }}
          onStop={() => { tts.stop(); setIsPlaying(false); setIsPaused(false); }}
          onSettingsChange={(s) => { setTTSSettings(prev => ({ ...prev, ...s })); tts.updateSettings(s); }}
        />
      </header>

      {/* Slide content */}
      <main className="flex-1 overflow-auto">
        <SlideViewer
          slide={slide}
          currentIndex={currentSlide}
          totalSlides={presentation.slides.length}
        />
      </main>

      {/* Comment input */}
      <CommentInput
        slideIndex={currentSlide}
        existingComment={comments.find(c => c.slide === currentSlide)?.comment}
        onComment={(idx, text) => {
          setComments(prev => {
            const filtered = prev.filter(c => c.slide !== idx);
            return text ? [...filtered, { slide: idx, comment: text }] : filtered;
          });
        }}
      />

      {/* Navigation */}
      <SlideNav
        currentIndex={currentSlide}
        totalSlides={presentation.slides.length}
        onPrev={() => setCurrentSlide(i => Math.max(i - 1, 0))}
        onNext={() => setCurrentSlide(i => Math.min(i + 1, presentation.slides.length - 1))}
        onGoTo={setCurrentSlide}
      />

      {/* Feedback panel (modal) */}
      {showFeedback && (
        <FeedbackPanel comments={comments} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
```

**Step 3: CLI 서버 엔트리 (server/index.ts) 작성**

`apps/hook/server/index.ts`:

```typescript
/**
 * Presento CLI for Claude Code
 *
 * Modes:
 * 1. Presentation (default): reads slide JSON from stdin, opens presentation UI
 * 2. Speak: reads text from stdin, opens minimal TTS player
 */

import { startPresentoServer, handleServerReady } from "@presento/server";

// @ts-ignore - Bun import attribute for text
import html from "../dist/index.html" with { type: "text" };
const htmlContent = html as unknown as string;

const args = process.argv.slice(2);

if (args[0] === "speak") {
  // SPEAK MODE: minimal TTS
  const text = await Bun.stdin.text();
  if (!text.trim()) {
    console.error("No text provided");
    process.exit(1);
  }

  // Start minimal server with just TTS
  const server = await startPresentoServer({
    presentation: {
      title: "Speak",
      slides: [{ id: 1, title: "", content: "", notes: text.trim() }],
    },
    origin: "claude-code",
    htmlContent,
    onReady: (url) => handleServerReady(url),
  });

  const feedback = await server.waitForFeedback();
  await Bun.sleep(1000);
  server.stop();
  process.exit(0);

} else {
  // PRESENTATION MODE: full slides
  const inputJson = await Bun.stdin.text();

  let presentation;
  try {
    presentation = JSON.parse(inputJson);
  } catch {
    console.error("Failed to parse presentation JSON from stdin");
    process.exit(1);
  }

  const server = await startPresentoServer({
    presentation,
    origin: "claude-code",
    htmlContent,
    onReady: (url) => handleServerReady(url),
  });

  const feedback = await server.waitForFeedback();
  await Bun.sleep(1500);
  server.stop();

  // Output feedback as structured text for Claude Code
  if (feedback.action === "dismiss") {
    console.log("Presentation dismissed. No feedback.");
  } else if (feedback.action === "approve") {
    let output = "✅ Presentation approved.";
    if (feedback.slides_comments.length > 0 || feedback.overall) {
      output += "\n\nNotes:\n";
      for (const c of feedback.slides_comments) {
        output += `- Slide ${c.slide}: ${c.comment}\n`;
      }
      if (feedback.overall) output += `\nOverall: ${feedback.overall}`;
    }
    console.log(output);
  } else {
    // revise
    let output = "🔄 Revision requested:\n";
    for (const c of feedback.slides_comments) {
      output += `- Slide ${c.slide}: ${c.comment}\n`;
    }
    if (feedback.overall) output += `\nOverall feedback: ${feedback.overall}`;
    console.log(output);
  }

  process.exit(0);
}
```

**Step 4: Commit**

```bash
git add projects/presento/apps/hook/
git commit -m "feat(presento): add CLI entry point and main React app"
```

---

## Task 8: 슬래시 커맨드 정의

**Files:**
- Create: `projects/presento/apps/hook/commands/presentation.md`
- Create: `projects/presento/apps/hook/commands/speak.md`

**Step 1: /presentation 커맨드 작성**

`apps/hook/commands/presentation.md`:

```markdown
---
description: Present the last response as an interactive slide presentation with TTS
allowed-tools: Bash(presento:*)
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

Then run the presento command with the JSON:

!`echo '<the JSON>' | presento`

## Feedback

The user's feedback from the presentation will appear above. Address their comments:
- For "revise" actions: update the content based on slide-specific and overall feedback
- For "approve" actions: proceed with the current direction, noting any additional comments
```

**Step 2: /speak 커맨드 작성**

`apps/hook/commands/speak.md`:

```markdown
---
description: Read the last response aloud using text-to-speech
allowed-tools: Bash(presento:*)
---

## Instructions

Take my last response and prepare it for spoken narration. Clean up the text:
- Remove markdown formatting symbols
- Expand abbreviations
- Make code references speakable (e.g., "the function called handleSubmit")
- Keep it natural and conversational

Then run:

!`echo '<the cleaned text>' | presento speak`
```

**Step 3: Commit**

```bash
git add projects/presento/apps/hook/commands/
git commit -m "feat(presento): add /presentation and /speak slash commands"
```
