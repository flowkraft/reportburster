import { NextRequest, NextResponse } from 'next/server';
import { getLettaClient } from '../../../../src/services/letta/client';

function normalizeList<T>(resp: unknown): T[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp as T[];
  const obj = resp as { items?: T[] } | undefined;
  return obj?.items ?? [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    if (!agentId) {
      return NextResponse.json({ error: 'agent id is required' }, { status: 400 });
    }

    const client = getLettaClient();

    // Retrieve full agent details including relationships needed for the UI
    let agent = await client.agents.retrieve(agentId, { 
      include_relationships: ['memory', 'tools', 'archives', 'agent.tags'] 
    }) as any;

    // Primary archive identification: prefer attached archives, then search by naming convention
    try {
      // Attempt to get archives explicitly attached to the agent
      if (!agent?.archives || (Array.isArray(agent.archives) && agent.archives.length === 0)) {
        try {
          const aresp = await (client.agents as any).archives.list(agentId);
          agent.archives = (aresp as any)?.items ?? aresp ?? [];
        } catch (_e) {
          // ignore
        }
      }

      // If still missing, prefer explicit archive mapping stored on the agent metadata (archiveId)
      if (!agent?.archives || (Array.isArray(agent.archives) && agent.archives.length === 0)) {
        try {
          const metaArchiveId = agent?.metadata?.archiveId;
          if (metaArchiveId) {
            try {
              const a = await client.archives.retrieve(String(metaArchiveId)) as any;
              if (a) {
                agent.archives = [a];
              }
            } catch (_e) {
              // ignore retrieval failure and fall back to global search
            }
          }

          if (!agent?.archives || (Array.isArray(agent.archives) && agent.archives.length === 0)) {
            const baseKey = agent?.metadata?.fullAgentKey ?? `${agent?.metadata?.agentKey || ''}-${agent.id}`;
            const archiveName = `Agent Archive - ${agent?.metadata?.agentKey || ''}-${agent.id}`;

            const allArchivesResp = await client.archives.list();
            const allArchives = normalizeList<any>(allArchivesResp as unknown);

            const matches = allArchives.filter((a: any) => {
              const meta = (a as any)?.metadata || {};
              const shared = Array.isArray(meta.sharedOwners) ? meta.sharedOwners : (meta?.sharedOwners ? [meta.sharedOwners] : []);
              if (shared.length > 0) {
                return shared.includes(baseKey);
              }
              if (String(meta?.fullAgentKey) === String(baseKey) || String(meta?.ownerFullAgentKey) === String(baseKey)) return true;
              if (String(a?.name) === archiveName) return true;
              return false;
            });

            agent.archives = matches;
          }
        } catch (_e) {
          // ignore
        }
      }
    } catch (_e) {}

    return NextResponse.json(agent);
  } catch (err: any) {
    console.error('Agent detail API error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    if (!agentId) {
      return NextResponse.json({ error: 'agent id is required' }, { status: 400 });
    }

    const client = getLettaClient();
    const body = await request.json();
    
    // Use the SDK `update` method
    const updated = await (client.agents as any).update(agentId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Agent update API error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
