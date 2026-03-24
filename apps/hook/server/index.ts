/**
 * Presento CLI for Claude Code
 *
 * Usage:
 *   presento <path-to-json>   — read from file
 *   echo '{}' | presento      — read from stdin
 */

import { startPresentoServer, handleServerReady, loadConfig } from "@presento/server";

// @ts-ignore - Bun import attribute for text
import html from "../dist/index.html" with { type: "text" };
const htmlContent = html as unknown as string;

const args = process.argv.slice(2);
let inputJson: string;

if (args[0]) {
  // File path provided as argument
  const file = Bun.file(args[0]);
  if (!(await file.exists())) {
    console.error(`File not found: ${args[0]}`);
    process.exit(1);
  }
  inputJson = await file.text();
} else {
  // Read from stdin
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
