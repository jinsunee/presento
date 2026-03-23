/**
 * Presento CLI for Claude Code
 *
 * Reads slide JSON from stdin, opens interactive presentation UI in browser.
 */

import { startPresentoServer, handleServerReady } from "@presento/server";

// @ts-ignore - Bun import attribute for text
import html from "../dist/index.html" with { type: "text" };
const htmlContent = html as unknown as string;

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
