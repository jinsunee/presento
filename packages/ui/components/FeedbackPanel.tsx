import { useState } from "react";
import type { SlideComment, Feedback } from "../types";

interface FeedbackPanelProps {
  comments: SlideComment[];
  onSubmit: (feedback: Feedback) => void;
  onClose: () => void;
}

export function FeedbackPanel({ comments, onSubmit, onClose }: FeedbackPanelProps) {
  const [overall, setOverall] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleAction = (action: "revise" | "approve" | "dismiss") => {
    setSubmitted(true);
    onSubmit({
      slides_comments: comments,
      overall: overall.trim(),
      action,
    });
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl p-10 text-center shadow-2xl shadow-black/50">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="text-lg font-semibold text-white mb-1">Feedback Submitted</div>
          <p className="text-sm text-slate-500">You can close this tab now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">Presentation Feedback</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Slide comments summary */}
          {comments.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-3">
                Slide Notes ({comments.length})
              </h4>
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.slide} className="flex gap-3 text-sm bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3">
                    <span className="text-blue-400/80 font-mono text-xs shrink-0 mt-0.5">#{c.slide + 1}</span>
                    <span className="text-slate-400 leading-relaxed">{c.comment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall feedback */}
          <div className="mb-6">
            <h4 className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-2">Overall Feedback</h4>
            <textarea
              value={overall}
              onChange={(e) => setOverall(e.target.value)}
              placeholder="Any thoughts on the presentation as a whole..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/30 transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => handleAction("dismiss")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleAction("approve")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200 cursor-pointer"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction("revise")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200 cursor-pointer"
            >
              Request Revision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
