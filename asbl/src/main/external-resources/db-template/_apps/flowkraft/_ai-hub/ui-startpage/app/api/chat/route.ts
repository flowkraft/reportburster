import { NextRequest, NextResponse } from 'next/server';
import { streamText, convertToModelMessages, generateText } from 'ai';
import { lettaLocal } from '@letta-ai/vercel-ai-sdk-provider';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, agentId, debug } = body || {};

  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  const model = lettaLocal();

  let modelMessages;
  try {
    modelMessages = convertToModelMessages(messages || []);
  } catch (e: any) {
    console.error('convertToModelMessages error, messages:', messages, e);
    return NextResponse.json(
      { error: 'Invalid messages payload', detail: String(e?.message || e) },
      { status: 400 }
    );
  }

  // Debug non-streaming path via body.debug === true
  if (debug === true) {
    try {
      const result = await generateText({
        model,
        providerOptions: { letta: { agent: { id: agentId }, timeoutInSeconds: 120 } },
        messages: modelMessages,
      });
      return NextResponse.json({ ok: true, debug: true, result });
    } catch (e: any) {
      console.error('generateText (debug) error:', e);
      return NextResponse.json(
        { error: 'generateText failed', detail: String(e?.message || e) },
        { status: 500 }
      );
    }
  }

  // Streaming path
  try {
    const stream = streamText({
      model,
      providerOptions: { letta: { agent: { id: agentId } } },
      messages: modelMessages,
    });

    const uiStream = stream.toUIMessageStream();

    // Return streaming response with proper SSE headers
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const reader = uiStream.getReader();

          // Initial heartbeat
          controller.enqueue(encoder.encode(': connected\n\n'));

          // Heartbeat interval
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': heartbeat\n\n'));
            } catch (_) {
              clearInterval(heartbeat);
            }
          }, 15000);

          let sawData = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                sawData = true;

                let chunk: string;
                if (typeof value === 'string' || value instanceof String) {
                  chunk = String(value);
                } else if (value instanceof Uint8Array) {
                  chunk = new TextDecoder().decode(value);
                } else {
                  try {
                    chunk = JSON.stringify(value);
                  } catch (e) {
                    chunk = String(value);
                  }
                }

                // If chunk already looks like an SSE event, forward as-is
                if (/^(data:|event:|:)/.test(chunk.trim())) {
                  controller.enqueue(encoder.encode(chunk));
                } else {
                  // Prefix every line with data: and terminate with an empty line
                  const lines = chunk.split(/\r?\n/).map((l) => `data: ${l}`).join('\n') + '\n\n';
                  controller.enqueue(encoder.encode(lines));
                }
              }
            }

            // Fallback if no data was streamed
            if (!sawData) {
              console.warn('Chat stream ended without emitting data — attempting generateText fallback');
              try {
                const result = await generateText({
                  model,
                  providerOptions: { letta: { agent: { id: agentId }, timeoutInSeconds: 120 } },
                  messages: modelMessages,
                });
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ fallback: true, text: result?.text || null })}\n\n`)
                );
              } catch (e: any) {
                console.error('Fallback generateText error:', e);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ fallback: true, error: String(e?.message || e) })}\n\n`)
                );
              }
            }
          } catch (e) {
            console.error('Chat pump error:', e);
          } finally {
            clearInterval(heartbeat);
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream;charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      }
    );
  } catch (e: any) {
    console.error('streamText error:', e);
    return NextResponse.json(
      { error: 'Failed to start chat stream', detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}
