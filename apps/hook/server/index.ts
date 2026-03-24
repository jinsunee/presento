/**
 * Presento CLI for Claude Code
 *
 * Usage:
 *   presento <path-to-json>          — open presentation in browser
 *   presento --speak <path-to-json>  — read aloud in terminal (no browser)
 *   echo '{}' | presento             — read from stdin
 *   echo '{}' | presento --speak     — read from stdin in terminal
 */

import { startPresentoServer, handleServerReady, loadConfig } from "@presento/server";
import { speakText } from "@presento/server/tts";

// @ts-ignore - Bun import attribute for text
import html from "../dist/index.html" with { type: "text" };
const htmlContent = html as unknown as string;

const args = process.argv.slice(2);
const speakMode = args.includes("--speak");
const filePath = args.find(a => a !== "--speak");

let inputJson: string;

if (filePath) {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  inputJson = await file.text();
} else {
  inputJson = await Bun.stdin.text();
}

let presentation;
try {
  presentation = JSON.parse(inputJson);
} catch {
  console.error("Failed to parse presentation JSON");
  process.exit(1);
}

const config = await loadConfig();

if (speakMode) {
  // Terminal TTS mode — no browser
  const slides = presentation.slides || [];
  console.log(`\n📖 Reading: ${presentation.title}\n`);

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    console.log(`[${i + 1}/${slides.length}] ${slide.title}`);
    console.log(slide.content);
    console.log("");

    await speakText({ text: slide.notes, config });
  }

  console.log("✅ Done reading.");
  process.exit(0);
}

// Browser presentation mode
const server = await startPresentoServer({
  presentation,
  origin: "claude-code",
  htmlContent,
  config,
  onReady: (url) => handleServerReady(url),
});

const feedback = await server.waitForFeedback();
await Bun.sleep(1500);
server.stop();

if (feedback.action === "dismiss") {
  console.log("Presentation dismissed. No feedback.");
} else if (feedback.action === "approve") {
  let output = "Presentation approved.";
  if (feedback.slides_comments.length > 0 || feedback.overall) {
    output += "\n\nNotes:\n";
    for (const c of feedback.slides_comments) {
      output += `- Slide ${c.slide}: ${c.comment}\n`;
    }
    if (feedback.overall) output += `\nOverall: ${feedback.overall}`;
  }
  console.log(output);
} else {
  let output = "Revision requested:\n";
  for (const c of feedback.slides_comments) {
    output += `- Slide ${c.slide}: ${c.comment}\n`;
  }
  if (feedback.overall) output += `\nOverall feedback: ${feedback.overall}`;
  console.log(output);
}

process.exit(0);
