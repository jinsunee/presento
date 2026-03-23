---
created: 2026-03-23
---

# Presento - Group B: React UI 컴포넌트

**Execution:** Sequential (Task 4 → 5 → 6)
**Parallel with:** Group A (Task 2, 3) after shared scaffolding

---

## Task 4: SlideViewer + SlideNav 컴포넌트

**Files:**
- Create: `projects/presento/packages/ui/components/SlideViewer.tsx`
- Create: `projects/presento/packages/ui/components/SlideNav.tsx`
- Create: `projects/presento/packages/ui/utils/markdown.ts`

**Step 1: 마크다운 렌더링 유틸 작성**

`packages/ui/utils/markdown.ts`:
- 마크다운 → HTML 변환 (간단한 파서, 또는 marked 라이브러리)
- 코드 블록 syntax highlighting
- 테이블, 리스트, 헤딩 렌더링

```typescript
/**
 * Simple markdown to HTML converter for slide content.
 * Handles: headings, lists, code blocks, tables, bold, italic, links
 */
export function renderMarkdown(md: string): string {
  // Implementation: use marked or custom parser
}
```

**Step 2: SlideViewer 컴포넌트 작성**

`packages/ui/components/SlideViewer.tsx`:

```tsx
import type { Slide } from "../types";

interface SlideViewerProps {
  slide: Slide;
  currentIndex: number;
  totalSlides: number;
}

/**
 * Main slide display area.
 * - Renders slide title and markdown content
 * - Full-width centered layout
 * - Smooth transitions between slides
 */
export function SlideViewer({ slide, currentIndex, totalSlides }: SlideViewerProps) {
  // Render slide title
  // Render markdown content as HTML
  // Show slide number indicator
}
```

**Step 3: SlideNav 컴포넌트 작성**

`packages/ui/components/SlideNav.tsx`:

```tsx
interface SlideNavProps {
  currentIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

/**
 * Bottom navigation bar with:
 * - Prev/Next buttons
 * - Slide thumbnail minimap
 * - Current slide indicator
 * - Keyboard: ←→ for navigation
 */
export function SlideNav({ currentIndex, totalSlides, onPrev, onNext, onGoTo }: SlideNavProps) {
  // Thumbnail strip showing all slides
  // Highlight current slide
  // Prev/Next buttons
}
```

**Step 4: Commit**

```bash
git add projects/presento/packages/ui/components/ projects/presento/packages/ui/utils/
git commit -m "feat(presento): add SlideViewer, SlideNav components and markdown renderer"
```

---

## Task 5: TTS 엔진

**Files:**
- Create: `projects/presento/packages/ui/utils/tts.ts`
- Create: `projects/presento/packages/ui/components/TTSControls.tsx`

**Step 1: TTS 유틸 작성**

`packages/ui/utils/tts.ts`:

```typescript
import type { TTSSettings } from "../types";

/**
 * TTS engine abstraction.
 * - Web Speech API (default, free)
 * - OpenAI TTS API (optional, better quality)
 *
 * Interface:
 * - speak(text, settings) → starts speaking
 * - pause() → pauses
 * - resume() → resumes
 * - stop() → stops
 * - onEnd callback → when utterance finishes
 */

export class TTSPlayer {
  private settings: TTSSettings;
  private utterance: SpeechSynthesisUtterance | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor(settings: TTSSettings) {
    this.settings = settings;
  }

  async speak(text: string, onEnd?: () => void): Promise<void> {
    if (this.settings.engine === "openai" && this.settings.openaiApiKey) {
      return this.speakOpenAI(text, onEnd);
    }
    return this.speakWebSpeech(text, onEnd);
  }

  private speakWebSpeech(text: string, onEnd?: () => void): void {
    speechSynthesis.cancel();
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.settings.rate;
    if (this.settings.voice) {
      const voice = speechSynthesis.getVoices().find(v => v.name === this.settings.voice);
      if (voice) this.utterance.voice = voice;
    }
    if (onEnd) this.utterance.onend = onEnd;
    speechSynthesis.speak(this.utterance);
  }

  private async speakOpenAI(text: string, onEnd?: () => void): Promise<void> {
    // Fetch audio from OpenAI TTS API
    // Play via HTMLAudioElement
  }

  pause(): void { /* speechSynthesis.pause() or audio.pause() */ }
  resume(): void { /* speechSynthesis.resume() or audio.play() */ }
  stop(): void { /* speechSynthesis.cancel() or audio.pause() + reset */ }

  updateSettings(settings: Partial<TTSSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }
}
```

**Step 2: TTSControls 컴포넌트 작성**

`packages/ui/components/TTSControls.tsx`:

```tsx
import type { TTSSettings } from "../types";

interface TTSControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  settings: TTSSettings;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSettingsChange: (settings: Partial<TTSSettings>) => void;
}

/**
 * TTS control bar:
 * - Play/Pause/Stop buttons
 * - Speed slider (0.5x - 2x)
 * - Voice selector dropdown
 * - Engine toggle (Web Speech / OpenAI)
 * - Keyboard: Space for play/pause
 */
export function TTSControls(props: TTSControlsProps) {
  // Play/Pause button
  // Speed control
  // Voice picker
  // Settings popover for engine selection + OpenAI API key
}
```

**Step 3: Commit**

```bash
git add projects/presento/packages/ui/utils/tts.ts projects/presento/packages/ui/components/TTSControls.tsx
git commit -m "feat(presento): add TTS engine (Web Speech + OpenAI) and controls component"
```

---

## Task 6: 피드백 UI (CommentInput + FeedbackPanel)

**Files:**
- Create: `projects/presento/packages/ui/components/CommentInput.tsx`
- Create: `projects/presento/packages/ui/components/FeedbackPanel.tsx`

**Step 1: CommentInput 컴포넌트 작성**

`packages/ui/components/CommentInput.tsx`:

```tsx
interface CommentInputProps {
  slideIndex: number;
  existingComment?: string;
  onComment: (slideIndex: number, comment: string) => void;
}

/**
 * Per-slide comment input at the bottom of SlideViewer.
 * - Text input with placeholder "이 슬라이드에 코멘트 남기기..."
 * - Shows existing comment if already written
 * - Comment indicator badge on slide nav thumbnails
 */
export function CommentInput({ slideIndex, existingComment, onComment }: CommentInputProps) {
  // Textarea with auto-resize
  // Save on blur or Enter
}
```

**Step 2: FeedbackPanel 컴포넌트 작성**

`packages/ui/components/FeedbackPanel.tsx`:

```tsx
import type { SlideComment, Feedback } from "../types";

interface FeedbackPanelProps {
  comments: SlideComment[];
  onSubmit: (feedback: Feedback) => void;
}

/**
 * Final submission panel (appears on last slide or via button).
 * - Shows all slide comments as summary
 * - Overall feedback textarea
 * - 3 action buttons: Revise / Approve / Dismiss
 */
export function FeedbackPanel({ comments, onSubmit }: FeedbackPanelProps) {
  // Comments summary list
  // Overall feedback textarea
  // Action buttons: Revise (primary), Approve (success), Dismiss (secondary)
}
```

**Step 3: Commit**

```bash
git add projects/presento/packages/ui/components/CommentInput.tsx projects/presento/packages/ui/components/FeedbackPanel.tsx
git commit -m "feat(presento): add CommentInput and FeedbackPanel for slide feedback"
```
