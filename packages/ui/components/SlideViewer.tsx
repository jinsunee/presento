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
    <div className="relative flex flex-col items-center justify-center min-h-full px-8 sm:px-16 lg:px-24 py-20">
      {slide.title && (
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 text-center leading-tight tracking-tight text-white">
          {slide.title}
        </h2>
      )}

      <div
        className="w-full max-w-3xl text-lg sm:text-xl leading-relaxed text-slate-300
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4 [&_h1]:mt-6
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 [&_h2]:mt-5
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mb-2 [&_h3]:mt-4
          [&_p]:mb-4 [&_p]:leading-relaxed
          [&_strong]:text-white [&_strong]:font-semibold
          [&_em]:text-slate-400 [&_em]:italic
          [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-blue-400/30 hover:[&_a]:decoration-blue-400
          [&_ul]:mb-4 [&_ul]:space-y-2.5 [&_ul]:list-none [&_ul]:pl-0
          [&_li]:relative [&_li]:pl-5 [&_li]:text-slate-300
          [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.6em] [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-blue-400/60
          [&_code]:text-emerald-400 [&_code]:text-[0.9em] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:bg-emerald-500/10 [&_code]:rounded [&_code]:font-mono
          [&_pre]:mb-5 [&_pre]:p-5 [&_pre]:rounded-xl [&_pre]:bg-[#0d1117] [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:overflow-x-auto
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm [&_pre_code]:leading-relaxed [&_pre_code]:text-slate-300
          [&_blockquote]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-500/40 [&_blockquote]:text-slate-400 [&_blockquote]:italic [&_blockquote]:mb-4
          [&_table]:w-full [&_table]:mb-4 [&_table]:border-collapse
          [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-400 [&_th]:pb-3 [&_th]:border-b [&_th]:border-white/[0.08] [&_th]:px-3
          [&_td]:py-2.5 [&_td]:px-3 [&_td]:text-sm [&_td]:text-slate-300 [&_td]:border-b [&_td]:border-white/[0.04]"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
