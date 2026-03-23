interface SlideNavProps {
  currentIndex: number;
  totalSlides: number;
  commentedSlides?: number[];
  ttsSlide?: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export function SlideNav({ currentIndex, totalSlides, commentedSlides = [], ttsSlide, onPrev, onNext, onGoTo }: SlideNavProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 bg-white/[0.02] border-t border-white/[0.06]">
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        aria-label="Previous slide"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div className="flex-1 flex items-center justify-center gap-1.5 overflow-x-auto py-1">
        {Array.from({ length: totalSlides }, (_, i) => {
          const isViewing = i === currentIndex;
          const isTtsPlaying = ttsSlide !== undefined && i === ttsSlide;

          return (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className={`relative group flex-shrink-0 transition-all duration-200 cursor-pointer ${
                isViewing
                  ? "w-10 h-1.5 rounded-full bg-blue-500"
                  : isTtsPlaying
                  ? "w-8 h-1.5 rounded-full bg-blue-400/50 animate-pulse"
                  : "w-6 h-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2]"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              {commentedSlides.includes(i) && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={currentIndex === totalSlides - 1}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        aria-label="Next slide"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}
