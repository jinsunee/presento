/**
 * Presento CLI for Claude Code
 *
 * Modes:
 * 1. Presentation (default): reads slide JSON from stdin, opens presentation UI
 * 2. Speak: reads text from stdin, opens minimal TTS player
 */

import { startPresentoServer, handleServerReady } from "@presento/server";

// @ts-ignore - Bun import attribute for text
import html from "../dist/index.html" with { type: "text" };
const htmlContent = html as unknown as string;

const args = process.argv.slice(2);

if (args[0] === "speak") {
  const text = await Bun.stdin.text();
  if (!text.trim()) {
    console.error("No text provided");
    process.exit(1);
  }

  const server = await startPresentoServer({
    presentation: {
      title: "Speak",
      slides: [{ id: 1, title: "", content: "", notes: text.trim() }],
    },
    origin: "claude-code",
    htmlContent,
    onReady: (url) => handleServerReady(url),
  });

  const feedback = await server.waitForFeedback();
  await Bun.sleep(1000);
  server.stop();
  process.exit(0);
} else {
  const inputJson = await Bun.stdin.text();

  let presentation;
  try {
    presentation = JSON.parse(inputJson);
  } catch {
    console.error("Failed to parse presentation JSON from stdin");
    process.exit(1);
  }

  const server = await startPresentoServer({
    presentation,
    origin: "claude-code",
    htmlContent,
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
}
