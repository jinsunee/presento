import { openBrowser } from "./browser";
import type { Presentation, Feedback } from "@presento/ui/types";

export { openBrowser } from "./browser";

export interface ServerOptions {
  presentation: Presentation;
  origin: string;
  htmlContent: string;
  onReady?: (url: string, port: number) => void;
}

export interface ServerResult {
  port: number;
  url: string;
  waitForFeedback: () => Promise<Feedback>;
  stop: () => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;

export async function startPresentoServer(options: ServerOptions): Promise<ServerResult> {
  const { presentation, origin, htmlContent, onReady } = options;

  let resolveFeedback: (result: Feedback) => void;
  const feedbackPromise = new Promise<Feedback>((resolve) => {
    resolveFeedback = resolve;
  });

  let server: ReturnType<typeof Bun.serve> | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      server = Bun.serve({
        port: 0, // random port

        async fetch(req) {
          const url = new URL(req.url);

          // GET /api/slides - return presentation data
          if (url.pathname === "/api/slides") {
            const openaiApiKey = process.env.OPENAI_API_KEY || "";
            return Response.json({ presentation, origin, openaiApiKey });
          }

          // POST /api/feedback - receive user feedback
          if (url.pathname === "/api/feedback" && req.method === "POST") {
            const feedback = (await req.json()) as Feedback;
            resolveFeedback(feedback);
            return Response.json({ ok: true });
          }

          // Serve SPA for all other routes
          return new Response(htmlContent, {
            headers: { "Content-Type": "text/html" },
          });
        },
      });

      break;
    } catch (err: unknown) {
      const isAddressInUse = err instanceof Error && err.message.includes("EADDRINUSE");
      if (isAddressInUse && attempt < MAX_RETRIES) {
        await Bun.sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }

  if (!server) throw new Error("Failed to start server");

  const serverUrl = `http://localhost:${server.port}`;
  if (onReady) onReady(serverUrl, server.port);

  return {
    port: server.port,
    url: serverUrl,
    waitForFeedback: () => feedbackPromise,
    stop: () => server.stop(),
  };
}

export async function handleServerReady(url: string): Promise<void> {
  await openBrowser(url);
}
