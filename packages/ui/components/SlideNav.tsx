interface SlideNavProps {
  currentIndex: number;
  totalSlides: number;
  commentedSlides?: number[];
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export function SlideNav({ currentIndex, totalSlides, commentedSlides = [], onPrev, onNext, onGoTo }: SlideNavProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-t border-gray-800 bg-gray-950">
      {/* Prev button */}
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="px-3 py-1.5 rounded text-sm font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>

      {/* Thumbnail minimap */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto px-2">
        {Array.from({ length: totalSlides }, (_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className={`relative w-8 h-5 rounded-sm border transition-all flex-shrink-0 ${
              i === currentIndex
                ? "border-blue-500 bg-blue-500/20 scale-110"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
            }`}
          >
            {/* Comment indicator */}
            {commentedSlides.includes(i) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={currentIndex === totalSlides - 1}
        className="px-3 py-1.5 rounded text-sm font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
