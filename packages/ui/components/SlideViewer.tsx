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
    <div className="flex flex-col items-center justify-start min-h-full px-12 py-16 md:px-20 lg:px-32">
      {/* Title */}
      {slide.title && (
        <div className="w-full max-w-5xl mb-10">
          <div className="text-sm font-medium text-blue-400 tracking-widest uppercase mb-3">
            {currentIndex + 1} / {totalSlides}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{slide.title}</h2>
          <div className="mt-4 h-1 w-24 bg-blue-500 rounded-full" />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-invert max-w-5xl w-full
          [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-6
          [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-6
          [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-4
          [&_p]:text-[1.75rem] [&_p]:leading-relaxed [&_p]:text-gray-200
          [&_li]:text-[1.75rem] [&_li]:leading-relaxed [&_li]:text-gray-200 [&_li]:my-2
          [&_strong]:text-white [&_strong]:font-semibold
          [&_code]:text-emerald-400 [&_code]:text-2xl
          [&_pre]:bg-gray-900/80 [&_pre]:border [&_pre]:border-gray-700 [&_pre]:rounded-xl [&_pre]:text-xl
          [&_table]:text-2xl
          [&_th]:text-white [&_th]:bg-gray-800/60 [&_th]:px-5 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-xl
          [&_td]:px-5 [&_td]:py-3 [&_td]:text-gray-200 [&_td]:text-2xl [&_td]:border-b [&_td]:border-gray-700/50
          [&_a]:text-blue-400 [&_blockquote]:border-l-blue-500"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
