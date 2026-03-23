import { useState, useEffect, useRef, useCallback } from "react";

interface CommentInputProps {
  slideIndex: number;
  existingComment?: string;
  onComment: (slideIndex: number, comment: string) => void;
  openaiApiKey?: string;
}

export function CommentInput({ slideIndex, existingComment, onComment, openaiApiKey }: CommentInputProps) {
  const [text, setText] = useState(existingComment || "");
  const [focused, setFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setText(existingComment || "");
  }, [slideIndex, existingComment]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleBlur = () => {
    setFocused(false);
    onComment(slideIndex, text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onComment(slideIndex, text.trim());
      textareaRef.current?.blur();
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecording || !openaiApiKey) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) return; // too short, ignore

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          formData.append("model", "whisper-1");

          const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${openaiApiKey}` },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            const transcribed = data.text?.trim();
            if (transcribed) {
              setText(prev => {
                const newText = prev ? `${prev} ${transcribed}` : transcribed;
                onComment(slideIndex, newText.trim());
                return newText;
              });
            }
          }
        } catch (err) {
          console.error("Whisper transcription failed:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access failed:", err);
    }
  }, [isRecording, openaiApiKey, slideIndex, onComment]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  // Push-to-talk: M key
  useEffect(() => {
    if (!openaiApiKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.code === "KeyM" && !e.repeat) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyM") {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [openaiApiKey, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className={`px-6 py-3 border-t transition-colors duration-200 ${
      isRecording ? "border-red-500/40 bg-red-500/[0.03]" :
      focused ? "border-blue-500/30 bg-white/[0.02]" : "border-white/[0.06]"
    }`}>
      <div className="flex items-start gap-2">
        <svg className="mt-2 flex-shrink-0 text-slate-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : "Add a note on this slide... (or hold M to speak)"}
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none py-1.5 leading-relaxed"
        />

        {/* Mic button */}
        {openaiApiKey && (
          <button
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`mt-1 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : isTranscribing
                ? "bg-white/[0.06] text-amber-400"
                : "bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]"
            }`}
            title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Voice feedback (or hold M)"}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isTranscribing ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isRecording ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
