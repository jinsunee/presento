import type { TTSSettings } from "../types";

export class TTSPlayer {
  private settings: TTSSettings;
  private utterance: SpeechSynthesisUtterance | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isSpeaking = false;

  constructor(settings: TTSSettings) {
    this.settings = settings;
  }

  async speak(text: string, onEnd?: () => void): Promise<void> {
    this.stop();
    if (this.settings.engine === "openai" && this.settings.openaiApiKey) {
      return this.speakOpenAI(text, onEnd);
    }
    return this.speakWebSpeech(text, onEnd);
  }

  private speakWebSpeech(text: string, onEnd?: () => void): void {
    speechSynthesis.cancel();
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.settings.rate;
    if (this.settings.voice) {
      const voice = speechSynthesis.getVoices().find(v => v.name === this.settings.voice);
      if (voice) this.utterance.voice = voice;
    }
    this.utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    this.utterance.onerror = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    this.isSpeaking = true;
    speechSynthesis.speak(this.utterance);
  }

  private async speakOpenAI(text: string, onEnd?: () => void): Promise<void> {
    if (!this.settings.openaiApiKey) return;

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.settings.openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: "alloy",
          speed: this.settings.rate,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI TTS failed, falling back to Web Speech");
        return this.speakWebSpeech(text, onEnd);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      this.audioElement = new Audio(url);
      this.audioElement.onended = () => {
        URL.revokeObjectURL(url);
        this.isSpeaking = false;
        onEnd?.();
      };
      this.audioElement.onerror = () => {
        URL.revokeObjectURL(url);
        this.isSpeaking = false;
        onEnd?.();
      };
      this.isSpeaking = true;
      await this.audioElement.play();
    } catch {
      console.error("OpenAI TTS error, falling back to Web Speech");
      return this.speakWebSpeech(text, onEnd);
    }
  }

  pause(): void {
    if (this.settings.engine === "openai" && this.audioElement) {
      this.audioElement.pause();
    } else {
      speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.settings.engine === "openai" && this.audioElement) {
      this.audioElement.play();
    } else {
      speechSynthesis.resume();
    }
  }

  stop(): void {
    this.isSpeaking = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
    speechSynthesis.cancel();
    this.utterance = null;
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }

  updateSettings(settings: Partial<TTSSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }
}
