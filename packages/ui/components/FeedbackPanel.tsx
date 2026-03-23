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
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="text-2xl mb-2">Submitted!</div>
          <p className="text-gray-400 text-sm">You can close this tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Presentation Feedback</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            Close
          </button>
        </div>

        {/* Slide comments summary */}
        {comments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Slide Comments ({comments.length})</h4>
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.slide} className="flex gap-3 text-sm bg-gray-800/50 rounded-lg px-3 py-2">
                  <span className="text-blue-400 font-mono shrink-0">#{c.slide + 1}</span>
                  <span className="text-gray-300">{c.comment}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall feedback */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Overall Feedback</h4>
          <textarea
            value={overall}
            onChange={(e) => setOverall(e.target.value)}
            placeholder="Any overall thoughts on the presentation..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => handleAction("dismiss")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => handleAction("approve")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction("revise")}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Request Revision
          </button>
        </div>
      </div>
    </div>
  );
}
