/**
 * POST /api/llm/ollama/pull
 *
 * Proxies Ollama's POST /api/pull and streams download progress as SSE events.
 * Used by the LLM Provider form to let users pull new models from the Ollama registry.
 *
 * Request body: { model: "llama3:latest", baseUrl?: string }
 *
 * SSE events:
 *   data: { "status": "pulling",  "progress": 45, "detail": "pulling f1cd752815fc" }
 *   data: { "status": "success" }
 *   data: { "status": "error",    "message": "model not found" }
 */

const DEFAULT_OLLAMA_URL = "http://flowkraft-ai-hub-ollama:11434";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const modelName = body.model?.trim();
  const baseUrl =
    body.baseUrl?.trim() ||
    process.env.OLLAMA_BASE_URL ||
    DEFAULT_OLLAMA_URL;

  if (!modelName) {
    return new Response(
      JSON.stringify({ error: "Missing required field: model" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          /* stream closed */
        }
      };

      try {
        const ollamaRes = await fetch(`${baseUrl}/api/pull`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modelName, stream: true }),
        });

        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text().catch(() => "");
          send({ status: "error", message: `Ollama error ${ollamaRes.status}: ${errText || ollamaRes.statusText}` });
          controller.close();
          return;
        }

        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);

              if (chunk.error) {
                send({ status: "error", message: chunk.error });
                continue;
              }

              if (chunk.status === "success") {
                send({ status: "success" });
                continue;
              }

              // Compute progress percentage from completed/total
              let progress = 0;
              if (chunk.total && chunk.total > 0 && chunk.completed != null) {
                progress = Math.round((chunk.completed / chunk.total) * 100);
              }

              send({
                status: "pulling",
                progress,
                detail: chunk.status || "",
              });
            } catch {
              // Malformed JSON line — skip
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer);
            if (chunk.status === "success") {
              send({ status: "success" });
            } else if (chunk.error) {
              send({ status: "error", message: chunk.error });
            }
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        send({
          status: "error",
          message: err.message || "Failed to connect to Ollama",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
