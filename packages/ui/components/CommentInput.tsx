import { useState, useEffect, useRef } from "react";

interface CommentInputProps {
  slideIndex: number;
  existingComment?: string;
  onComment: (slideIndex: number, comment: string) => void;
}

export function CommentInput({ slideIndex, existingComment, onComment }: CommentInputProps) {
  const [text, setText] = useState(existingComment || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when slide changes
  useEffect(() => {
    setText(existingComment || "");
  }, [slideIndex, existingComment]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleBlur = () => {
    onComment(slideIndex, text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onComment(slideIndex, text.trim());
      textareaRef.current?.blur();
    }
  };

  return (
    <div className="px-6 py-2 border-t border-gray-800">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment on this slide..."
        rows={1}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );
}
