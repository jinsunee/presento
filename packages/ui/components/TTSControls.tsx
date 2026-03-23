import { useState, useEffect } from "react";
import type { TTSSettings } from "../types";
import { TTSPlayer } from "../utils/tts";

interface TTSControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  settings: TTSSettings;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSettingsChange: (settings: Partial<TTSSettings>) => void;
}

export function TTSControls({
  isPlaying,
  isPaused,
  settings,
  onPlay,
  onPause,
  onStop,
  onSettingsChange,
}: TTSControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(TTSPlayer.getAvailableVoices());
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* Single Play/Stop toggle */}
      {!isPlaying ? (
        <button
          onClick={onPlay}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors duration-200 cursor-pointer"
          title="Play (Space)"
          aria-label="Play"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      ) : (
        <button
          onClick={onStop}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors duration-200 cursor-pointer"
          title="Stop (Space)"
          aria-label="Stop"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        </button>
      )}

      {/* Speed */}
      <div className="flex items-center gap-1.5 ml-1 px-2 py-1 rounded-lg bg-white/[0.04]">
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.rate}
          onChange={(e) => onSettingsChange({ rate: parseFloat(e.target.value) })}
          className="w-14 h-1 accent-blue-500 cursor-pointer"
        />
        <span className="text-[10px] font-mono text-slate-500 w-7 text-right">{settings.rate.toFixed(1)}x</span>
      </div>

      {/* Settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${
            showSettings ? "bg-white/[0.1] text-white" : "bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
          }`}
          title="TTS Settings"
          aria-label="Settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        {showSettings && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-[#12121a] border border-white/[0.08] rounded-xl p-4 shadow-2xl shadow-black/40 z-50 backdrop-blur-xl">
            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-wider font-medium text-slate-500 block mb-1.5">Engine</label>
              <select
                value={settings.engine}
                onChange={(e) => onSettingsChange({ engine: e.target.value as "web-speech" | "openai" })}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="web-speech">Web Speech API (Free)</option>
                <option value="openai">OpenAI TTS (Paid)</option>
              </select>
            </div>

            {settings.engine === "web-speech" && voices.length > 0 && (
              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-wider font-medium text-slate-500 block mb-1.5">Voice</label>
                <select
                  value={settings.voice || ""}
                  onChange={(e) => onSettingsChange({ voice: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  <option value="">Default</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>
            )}

            {settings.engine === "openai" && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-medium text-slate-500 block mb-1.5">API Key</label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ""}
                  onChange={(e) => onSettingsChange({ openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
