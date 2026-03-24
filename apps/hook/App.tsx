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

  const [isSpeakMode, setIsSpeakMode] = useState(false);

  useEffect(() => {
    fetch("/api/slides")
      .then(r => r.json())
      .then(data => {
        setPresentation(data.presentation);
        if (data.presentation?.mode === "speak") {
          setIsSpeakMode(true);
        }
        if (data.config?.openaiApiKey) {
          setTTSSettings(prev => ({
            ...prev,
            engine: "openai",
            openaiApiKey: data.config.openaiApiKey,
          }));
          tts.updateSettings({
            engine: "openai",
            openaiApiKey: data.config.openaiApiKey,
          });
        }
      });
  }, []);

  const [tts] = useState(() => new TTSPlayer(ttsSettings));
  const [autoPlayTriggered, setAutoPlayTriggered] = useState(false);

  const playSlide = useCallback((index: number) => {
    if (!presentation) return;
    const slide = presentation.slides[index];
    setIsPlaying(true);
    setIsPaused(false);
    tts.speak(slide.notes, () => {
      if (index < presentation.slides.length - 1) {
        setCurrentSlide(index + 1);
        playSlide(index + 1);
      } else {
        setIsPlaying(false);
        setShowFeedback(true);
      }
    });
  }, [presentation, tts]);

  // Auto-play in speak mode
  useEffect(() => {
    if (isSpeakMode && presentation && !autoPlayTriggered) {
      setAutoPlayTriggered(true);
      // Small delay to let the UI render first
      const timer = setTimeout(() => playSlide(0), 500);
      return () => clearTimeout(timer);
    }
  }, [isSpeakMode, presentation, autoPlayTriggered, playSlide]);

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

  const handleSubmit = async (feedback: Feedback) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
  };

  if (!presentation) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
      Loading presentation...
    </div>
  );

  const slide = presentation.slides[currentSlide];

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{isSpeakMode ? "Presento Reader" : "Presento"}</h1>
          <span className="text-sm text-gray-500">{currentSlide + 1}/{presentation.slides.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <TTSControls
            isPlaying={isPlaying}
            isPaused={isPaused}
            settings={ttsSettings}
            onPlay={() => isPaused ? (() => { tts.resume(); setIsPaused(false); })() : playSlide(currentSlide)}
            onPause={() => { tts.pause(); setIsPaused(true); }}
            onStop={() => { tts.stop(); setIsPlaying(false); setIsPaused(false); }}
            onSettingsChange={(s) => { setTTSSettings(prev => ({ ...prev, ...s })); tts.updateSettings(s); }}
          />
          <button
            onClick={() => setShowFeedback(true)}
            className="px-3 py-1.5 rounded text-sm font-medium bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Feedback
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <SlideViewer slide={slide} currentIndex={currentSlide} totalSlides={presentation.slides.length} />
      </main>

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

      <SlideNav
        currentIndex={currentSlide}
        totalSlides={presentation.slides.length}
        commentedSlides={comments.map(c => c.slide)}
        onPrev={() => { tts.stop(); setIsPlaying(false); setIsPaused(false); setCurrentSlide(i => Math.max(i - 1, 0)); }}
        onNext={() => { tts.stop(); setIsPlaying(false); setIsPaused(false); setCurrentSlide(i => Math.min(i + 1, presentation.slides.length - 1)); }}
        onGoTo={(i) => { tts.stop(); setIsPlaying(false); setIsPaused(false); setCurrentSlide(i); }}
      />

      {showFeedback && (
        <FeedbackPanel comments={comments} onSubmit={handleSubmit} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
