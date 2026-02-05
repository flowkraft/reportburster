/**
 * OpenAI-Compatible Models Endpoint for Letta
 * 
 * Returns available models (Letta agents) in OpenAI models format.
 * Route: /api/openai/[agentId]/v1/models
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLettaClient } from '../../../../../../src/services/letta/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId: agentIdParam } = await params;
  
  try {
    const client = getLettaClient();
    const resp: any = await client.agents.list({ limit: 100 });
    const agents = Array.isArray(resp) ? resp : (resp?.items ?? resp?.data ?? resp?.agents ?? []);

    // Format as OpenAI models response
    const models = agents.map((agent: any) => ({
      id: `letta:${agent.metadata?.agentKey || agent.id}`,
      object: 'model',
      created: Math.floor(new Date(agent.created_at || Date.now()).getTime() / 1000),
      owned_by: 'letta',
      permission: [],
      root: agent.id,
      parent: null,
    }));

    return NextResponse.json({
      object: 'list',
      data: models
    });
  } catch (e: any) {
    console.error('[OpenAI Adapter] Error listing models:', e);
    return NextResponse.json(
      { error: { message: String(e?.message || e) } },
      { status: 500 }
    );
  }
}
