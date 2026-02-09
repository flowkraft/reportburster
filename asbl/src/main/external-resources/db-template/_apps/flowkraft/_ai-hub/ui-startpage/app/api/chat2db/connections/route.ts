import { NextResponse } from 'next/server';

const CHAT2DB_URL = process.env.CHAT2DB_URL || 'http://flowkraft-ai-hub-chat2db:8888';

/**
 * GET /api/chat2db/connections — List available database connections.
 */
export async function GET() {
  try {
    const res = await fetch(`${CHAT2DB_URL}/api/connections`);

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Chat2DB backend unreachable', detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}
