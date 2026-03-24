/**
 * Terminal TTS - plays text-to-speech without a browser
 *
 * Strategy:
 *   1. If OpenAI API key is available → call OpenAI TTS API, play with system audio player
 *   2. Otherwise → use system TTS command (macOS `say`, Linux `espeak`/`spd-say`)
 */

import { $ } from "bun";
import { tmpdir } from "os";
import { join } from "path";
import type { PresentoConfig } from "./index";

interface SpeakOptions {
  text: string;
  config: PresentoConfig;
  rate?: number;
}

export async function speakText(options: SpeakOptions): Promise<void> {
  const { text, config, rate = 1.0 } = options;

  if (config.openaiApiKey) {
    try {
      await speakOpenAI(text, config.openaiApiKey, rate);
      return;
    } catch (err) {
      console.error("OpenAI TTS failed, falling back to system TTS:", err);
    }
  }

  await speakSystem(text, rate);
}

async function speakOpenAI(text: string, apiKey: string, rate: number): Promise<void> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "alloy",
      speed: rate,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI TTS API error ${response.status}: ${body}`);
  }

  const audioData = await response.arrayBuffer();
  const tempFile = join(tmpdir(), `presento-tts-${Date.now()}.mp3`);
  await Bun.write(tempFile, audioData);

  try {
    await playAudioFile(tempFile);
  } finally {
    try { await $`rm -f ${tempFile}`.quiet(); } catch {}
  }
}

async function playAudioFile(path: string): Promise<void> {
  const platform = process.platform;

  if (platform === "darwin") {
    await $`afplay ${path}`.quiet();
  } else if (platform === "win32") {
    await $`cmd.exe /c start /wait "" ${path}`.quiet();
  } else {
    // Linux: try common players
    for (const player of ["aplay", "paplay", "mpv", "ffplay"]) {
      try {
        await $`which ${player}`.quiet();
        if (player === "ffplay") {
          await $`ffplay -nodisp -autoexit ${path}`.quiet();
        } else if (player === "mpv") {
          await $`mpv --no-video ${path}`.quiet();
        } else {
          await $`${player} ${path}`.quiet();
        }
        return;
      } catch { continue; }
    }
    throw new Error("No audio player found. Install mpv, ffplay, or pulseaudio.");
  }
}

async function speakSystem(text: string, rate: number): Promise<void> {
  const platform = process.platform;

  if (platform === "darwin") {
    // macOS `say` command: rate is in words per minute (default ~175)
    const wpm = Math.round(175 * rate);
    await $`say -r ${wpm} ${text}`;
  } else if (platform === "win32") {
    // Windows PowerShell TTS
    const psScript = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = ${Math.round((rate - 1) * 5)}; $s.Speak('${text.replace(/'/g, "''")}')`;
    await $`powershell -Command ${psScript}`.quiet();
  } else {
    // Linux: try espeak or spd-say
    for (const cmd of ["espeak", "spd-say"]) {
      try {
        await $`which ${cmd}`.quiet();
        if (cmd === "espeak") {
          const speed = Math.round(175 * rate);
          await $`espeak -s ${speed} ${text}`;
        } else {
          await $`spd-say ${text}`;
        }
        return;
      } catch { continue; }
    }
    throw new Error("No TTS engine found. Install espeak or speech-dispatcher.");
  }
}
