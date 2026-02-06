import { NextResponse } from 'next/server';
import provisionAll, { provisionAllAgents } from '../../../../src/services/letta/agentProvisioner';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check required environment variables for Letta
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiApiBase = process.env.OPENAI_API_BASE;

    if (!openaiApiKey || !openaiApiBase) {
      const missing = [];
      if (!openaiApiKey) missing.push('OPENAI_API_KEY');
      if (!openaiApiBase) missing.push('OPENAI_API_BASE');

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables',
          missing,
          message: `Please add ${missing.join(' and ')} to your .env file, then restart the app and try again.`,
        },
        { status: 400 }
      );
    }

    // Get parameters from request body
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;
    const skipMatrix = body.skipMatrix === true;
    const lettaOnly = body.lettaOnly === true;
    const stream = body.stream === true;

    // ── Streaming mode: SSE with real-time console capture ──────────
    if (stream) {
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          const send = (type: string, message: string) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type, message, ts: new Date().toISOString() })}\n\n`
                )
              );
            } catch {
              /* stream already closed */
            }
          };

          // Capture console output and forward to SSE stream
          const origLog = console.log;
          const origError = console.error;
          const origWarn = console.warn;

          const fmt = (...args: any[]): string =>
            args
              .map((a) => {
                if (typeof a === 'string') return a;
                try {
                  return JSON.stringify(a);
                } catch {
                  return String(a);
                }
              })
              .join(' ');

          console.log = (...args: any[]) => {
            origLog(...args);
            send('log', fmt(...args));
          };
          console.error = (...args: any[]) => {
            origError(...args);
            send('error', fmt(...args));
          };
          console.warn = (...args: any[]) => {
            origWarn(...args);
            send('warn', fmt(...args));
          };

          try {
            send('log', `Provisioning started${force ? ' (force)' : ''}...`);

            let result: any;

            if (lettaOnly) {
              const results = await provisionAllAgents({ force });
              const errorCount = results.filter((r: any) => r.status === 'error').length;
              result = {
                success: errorCount === 0,
                message:
                  errorCount === 0
                    ? 'Letta agents provisioned successfully'
                    : `Provisioned with ${errorCount} error(s)`,
                agents: results,
              };
            } else {
              const fullResult = await provisionAll({ force, skipMatrix });
              result = {
                success: fullResult.success,
                message: fullResult.success
                  ? 'FlowKraft AI Hub provisioned successfully (Letta + Matrix)'
                  : `Provisioning completed with ${fullResult.errors.length} error(s)`,
                letta: fullResult.letta,
                matrix: fullResult.matrix
                  ? {
                      success: fullResult.matrix.success,
                      skipped: fullResult.matrix.skipped,
                      roomCount: fullResult.matrix.rooms.length,
                    }
                  : null,
                errors: fullResult.errors,
              };
            }

            send('result', JSON.stringify(result));
            send('done', result.success ? 'success' : 'error');
          } catch (err: any) {
            send('error', `Fatal error: ${err.message || 'Unknown error'}`);
            send('done', 'error');
          } finally {
            console.log = origLog;
            console.error = origError;
            console.warn = origWarn;
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // ── Non-streaming mode (backward compatibility) ─────────────────
    console.log(`Provisioning agents${skipMatrix ? ' (skip-matrix)' : ''}${force ? ' (force)' : ''}`);

    if (lettaOnly) {
      // Letta-only provisioning
      const results = await provisionAllAgents({ force });
      const errorCount = results.filter(r => r.status === 'error').length;

      return NextResponse.json({
        success: errorCount === 0,
        message: errorCount === 0
          ? 'Letta agents provisioned successfully'
          : `Provisioned with ${errorCount} error(s)`,
        agents: results,
      });
    }

    // Full provisioning: Letta + Matrix
    const result = await provisionAll({
      force,
      skipMatrix,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'FlowKraft AI Hub provisioned successfully (Letta + Matrix)'
        : `Provisioning completed with ${result.errors.length} error(s)`,
      letta: result.letta,
      matrix: result.matrix ? {
        success: result.matrix.success,
        skipped: result.matrix.skipped,
        roomCount: result.matrix.rooms.length,
      } : null,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Error provisioning:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to provision',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
