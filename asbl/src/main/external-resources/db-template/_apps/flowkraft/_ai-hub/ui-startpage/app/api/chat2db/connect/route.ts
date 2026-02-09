import { NextRequest, NextResponse } from 'next/server';

const CHAT2DB_URL = process.env.CHAT2DB_URL || 'http://flowkraft-ai-hub-chat2db:8888';

/**
 * POST /api/chat2db/connect — Connect to a database.
 * Body: { connection_code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${CHAT2DB_URL}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

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
