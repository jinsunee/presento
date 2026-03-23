import { useState, useEffect, useCallback, useRef } from "react";
import { SlideViewer } from "@presento/ui/components/SlideViewer";
import { SlideNav } from "@presento/ui/components/SlideNav";
import { TTSControls } from "@presento/ui/components/TTSControls";
import { CommentInput } from "@presento/ui/components/CommentInput";
import { FeedbackPanel } from "@presento/ui/components/FeedbackPanel";
import { TTSPlayer } from "@presento/ui/utils/tts";
import type { Presentation, SlideComment, Feedback, TTSSettings } from "@presento/ui/types";

export default function App() {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0); // what user SEES
  const [ttsSlide, setTtsSlide] = useState(0); // what TTS is READING
  const ttsSlideRef = useRef(0); // ref for use in callbacks
  const playGenRef = useRef(0); // generation counter to cancel stale playback chains
  const [comments, setComments] = useState<SlideComment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings>({
    engine: "web-speech",
    rate: 1.0,
  });

  const [tts] = useState(() => new TTSPlayer(ttsSettings));

  useEffect(() => {
    fetch("/api/slides")
      .then(r => r.json())
      .then(data => {
        setPresentation(data.presentation);
        if (data.openaiApiKey) {
          const newSettings = { engine: "openai" as const, rate: 1.0, openaiApiKey: data.openaiApiKey };
          setTTSSettings(newSettings);
          tts.updateSettings(newSettings);
        }
      });
  }, [tts]);

  // Keep ref in sync
  useEffect(() => {
    ttsSlideRef.current = ttsSlide;
  }, [ttsSlide]);

  // Play from a specific slide, TTS advances independently
  const playFromSlide = useCallback((index: number) => {
    if (!presentation) return;

    // Stop any existing playback first
    tts.stop();

    // Increment generation so any stale onEnd callbacks are ignored
    const gen = ++playGenRef.current;

    const advanceAndSpeak = (i: number) => {
      // If a newer playFromSlide was called, abort this chain
      if (playGenRef.current !== gen) return;

      if (i >= presentation.slides.length) {
        setIsPlaying(false);
        setShowFeedback(true);
        return;
      }
      const slide = presentation.slides[i];
      setTtsSlide(i);
      ttsSlideRef.current = i;
      tts.speak(slide.notes, () => {
        advanceAndSpeak(i + 1);
      });
    };

    setIsPlaying(true);
    setIsPaused(false);
    advanceAndSpeak(index);
  }, [presentation, tts]);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) { tts.stop(); setIsPlaying(false); setIsPaused(false); }
        else playFromSlide(currentSlide);
      }
      // Arrow keys only move the VIEW, don't affect TTS
      if (e.code === "ArrowRight") { e.preventDefault(); setCurrentSlide(i => Math.min(i + 1, (presentation?.slides.length ?? 1) - 1)); }
      if (e.code === "ArrowLeft") { e.preventDefault(); setCurrentSlide(i => Math.max(i - 1, 0)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPlaying, isPaused, currentSlide, presentation, tts, playFromSlide]);

  const handleSubmit = async (feedback: Feedback) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
  };

  if (!presentation) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a12]">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
      <span className="text-sm text-slate-500 tracking-wide">Loading presentation...</span>
    </div>
  );

  const slide = presentation.slides[currentSlide];
  const isViewingTtsSlide = currentSlide === ttsSlide;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a12] text-slate-100 selection:bg-blue-500/30">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-white/[0.03] border-b border-white/[0.06] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Presento
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <span className="text-xs font-medium text-slate-300">{currentSlide + 1}</span>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs text-slate-500">{presentation.slides.length}</span>
          </div>
          {/* Show TTS position indicator when user is on a different slide */}
          {isPlaying && !isViewingTtsSlide && (
            <button
              onClick={() => setCurrentSlide(ttsSlide)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Playing slide {ttsSlide + 1}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TTSControls
            isPlaying={isPlaying}
            isPaused={isPaused}
            settings={ttsSettings}
            onPlay={() => playFromSlide(currentSlide)}
            onPause={() => {}}
            onStop={() => { tts.stop(); setIsPlaying(false); setIsPaused(false); }}
            onSettingsChange={(s) => { setTTSSettings(prev => ({ ...prev, ...s })); tts.updateSettings(s); }}
          />
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] text-slate-300 transition-all duration-200 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Feedback
          </button>
        </div>
      </header>

      {/* Slide content */}
      <main className="relative flex-1 overflow-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[120px]" />
        </div>
        <SlideViewer slide={slide} currentIndex={currentSlide} totalSlides={presentation.slides.length} />
      </main>

      {/* Comment input */}
      <CommentInput
        slideIndex={currentSlide}
        existingComment={comments.find(c => c.slide === currentSlide)?.comment}
        openaiApiKey={ttsSettings.openaiApiKey}
        onComment={(idx, text) => {
          setComments(prev => {
            const filtered = prev.filter(c => c.slide !== idx);
            return text ? [...filtered, { slide: idx, comment: text }] : filtered;
          });
        }}
      />

      {/* Navigation — no longer stops TTS */}
      <SlideNav
        currentIndex={currentSlide}
        totalSlides={presentation.slides.length}
        commentedSlides={comments.map(c => c.slide)}
        ttsSlide={isPlaying ? ttsSlide : undefined}
        onPrev={() => setCurrentSlide(i => Math.max(i - 1, 0))}
        onNext={() => setCurrentSlide(i => Math.min(i + 1, presentation.slides.length - 1))}
        onGoTo={setCurrentSlide}
      />

      {/* Feedback panel */}
      {showFeedback && (
        <FeedbackPanel comments={comments} onSubmit={handleSubmit} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
