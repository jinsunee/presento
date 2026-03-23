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
    <div className="flex items-center gap-2">
      {/* Play/Pause */}
      {!isPlaying ? (
        <button
          onClick={onPlay}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
          title="Play (Space)"
        >
          Play
        </button>
      ) : isPaused ? (
        <button
          onClick={onPlay}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
          title="Resume (Space)"
        >
          Resume
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-3 py-1.5 rounded bg-yellow-600 hover:bg-yellow-500 text-sm font-medium transition-colors"
          title="Pause (Space)"
        >
          Pause
        </button>
      )}

      {/* Stop */}
      {isPlaying && (
        <button
          onClick={onStop}
          className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          Stop
        </button>
      )}

      {/* Speed */}
      <div className="flex items-center gap-1 ml-2">
        <span className="text-xs text-gray-400">{settings.rate.toFixed(1)}x</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.rate}
          onChange={(e) => onSettingsChange({ rate: parseFloat(e.target.value) })}
          className="w-16 h-1 accent-blue-500"
        />
      </div>

      {/* Settings toggle */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors text-sm"
          title="TTS Settings"
        >
          Settings
        </button>

        {showSettings && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl z-50">
            {/* Engine selection */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">Engine</label>
              <select
                value={settings.engine}
                onChange={(e) => onSettingsChange({ engine: e.target.value as "web-speech" | "openai" })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              >
                <option value="web-speech">Web Speech API (Free)</option>
                <option value="openai">OpenAI TTS (Paid)</option>
              </select>
            </div>

            {/* Voice selection (Web Speech only) */}
            {settings.engine === "web-speech" && voices.length > 0 && (
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">Voice</label>
                <select
                  value={settings.voice || ""}
                  onChange={(e) => onSettingsChange({ voice: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                >
                  <option value="">Default</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* OpenAI API Key */}
            {settings.engine === "openai" && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ""}
                  onChange={(e) => onSettingsChange({ openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
