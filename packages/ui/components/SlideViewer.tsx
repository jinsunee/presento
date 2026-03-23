import { useMemo } from "react";
import type { Slide } from "../types";
import { renderMarkdown } from "../utils/markdown";

interface SlideViewerProps {
  slide: Slide;
  currentIndex: number;
  totalSlides: number;
}

export function SlideViewer({ slide, currentIndex, totalSlides }: SlideViewerProps) {
  const contentHtml = useMemo(() => renderMarkdown(slide.content), [slide.content]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-12">
      {/* Slide number */}
      <div className="text-sm text-gray-500 mb-4">
        {currentIndex + 1} / {totalSlides}
      </div>

      {/* Title */}
      {slide.title && (
        <h2 className="text-3xl font-bold mb-8 text-center">{slide.title}</h2>
      )}

      {/* Content */}
      <div
        className="prose prose-invert prose-lg max-w-4xl w-full
          prose-headings:text-white prose-p:text-gray-300
          prose-strong:text-white prose-code:text-emerald-400
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700
          prose-table:text-gray-300 prose-th:text-white
          prose-a:text-blue-400 prose-blockquote:border-l-blue-500
          prose-li:text-gray-300"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
