import { NextRequest, NextResponse } from 'next/server';
import { getLettaClient } from '../../../../../src/services/letta/client';
import type { BlockResponse } from '@letta-ai/letta-client/resources/blocks';

// Short agent ID length for constructing block labels
const SHORT_AGENT_ID_LEN = 8;

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
  const { agentId } = await params;
  if (!agentId) {
    return NextResponse.json({ error: 'Missing agent id' }, { status: 400 });
  }

  const client = getLettaClient();

  try {
    // Retrieve the main agent to find its primary memory block
    let mainAgent: any = null;
    try {
      mainAgent = await client.agents.retrieve(agentId) as any;
    } catch (err) {
      // If retrieve fails, try listing
      try {
        const list = await client.agents.list({ limit: 100 });
        const items = (list as any)?.items ?? list ?? [];
        mainAgent = items.find((a: any) => String(a?.id) === String(agentId));
      } catch (_e) {
        // ignore
      }
    }

    if (!mainAgent) {
      return NextResponse.json({ error: 'Main agent not found' }, { status: 404 });
    }

    // More robust sleeptime discovery logic:
    // 1) Direct property: sleeptime_agent_id
    // 2) Group membership fields: multi_agent_group.agent_ids, managed_group.agent_ids
    // 3) Shared 'subconscious_channel' block attached to both agents

    // 1) direct property
    let sleeptimeAgentId: string | undefined = mainAgent?.sleeptime_agent_id as string;

    // 2) group membership
    if (!sleeptimeAgentId) {
      sleeptimeAgentId = (mainAgent?.multi_agent_group as any)?.agent_ids?.find((x: string) => String(x) !== String(agentId)) || 
                         (mainAgent?.managed_group as any)?.agent_ids?.find((x: string) => String(x) !== String(agentId));
    }

    // 3) shared subconscious_channel block detection
    if (!sleeptimeAgentId) {
      try {
        const blocks = mainAgent?.memory?.blocks || [];
        // Prefer any block whose label includes 'subconscious_channel'
        const sharedBlock = blocks.find((b: any) => String(b?.label || '').toLowerCase().includes('subconscious_channel'));
        let blockId: string | undefined = sharedBlock?.id;

        // If not found, try to construct the expected namespaced label using agent metadata
        if (!blockId && mainAgent?.metadata?.agentKey) {
          const shortAgent = String(agentId).slice(0, SHORT_AGENT_ID_LEN);
          const expectedSharedLabel = `${mainAgent.metadata.agentKey}-${shortAgent}__subconscious_channel`;
          try {
            const blkResp = await client.blocks.list({ label: expectedSharedLabel, limit: 1 as any });
            const found = normalizeList<BlockResponse>(blkResp as unknown);
            if (found && found.length > 0) blockId = found[0].id;
          } catch (_e) {
            // ignore
          }
        }

        if (blockId) {
          try {
            const blockAgentsResp = await client.blocks.agents.list(blockId as string);
            const blockAgents = (blockAgentsResp as any)?.items ?? blockAgentsResp ?? [];
            const candidate = blockAgents.find((a: any) => a && a.id && String(a.id) !== String(agentId));
            if (candidate) sleeptimeAgentId = candidate.id;
          } catch (_e) {
            // ignore
          }
        }
      } catch (_e) {
        // ignore
      }
    }

    if (!sleeptimeAgentId) {
      return NextResponse.json({ sleeptimeAgent: null });
    }

    // Retrieve full sleeptime agent details with retries for eventual consistency
    let sleeptimeAgent: any = null;
    try {
      const MAX_RETRIEVE_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIEVE_RETRIES; attempt++) {
        try {
          sleeptimeAgent = await client.agents.retrieve(sleeptimeAgentId as string, { 
            include_relationships: ['memory', 'archives'] 
          }) as any;
          // If we got a non-empty archives array or memory, we consider it successful
          if (sleeptimeAgent && ((Array.isArray(sleeptimeAgent.archives) && sleeptimeAgent.archives.length > 0) || 
              (Array.isArray(sleeptimeAgent.memory?.blocks) && sleeptimeAgent.memory.blocks.length > 0))) break;
        } catch (_err) {
          // ignore transient retrieve errors
        }
        // small backoff
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }

      // If still null or empty, fallback to shallow retrieve
      if (!sleeptimeAgent) {
        try {
          const shallow = await client.agents.retrieve(sleeptimeAgentId as string) as any;
          sleeptimeAgent = shallow;
        } catch (_e) {
          return NextResponse.json({ sleeptimeAgent: null });
        }
      }
    } catch (err) {
      // if all fails, fallback to shallow
      try {
        const shallow = await client.agents.retrieve(sleeptimeAgentId as string) as any;
        sleeptimeAgent = shallow;
      } catch (_e) {
        return NextResponse.json({ sleeptimeAgent: null });
      }
    }

    // Ensure we have archives and memory blocks via explicit list endpoints
    let archives: any[] = sleeptimeAgent.archives ?? [];
    try {
      const primaryFullAgentKey = mainAgent?.metadata?.fullAgentKey ?? `${mainAgent?.metadata?.agentKey || ''}-${mainAgent?.id}`;
      const sleeptimeFullAgentKey = sleeptimeAgent?.metadata?.fullAgentKey ?? `${mainAgent?.metadata?.agentKey || ''}-sleeptime-${sleeptimeAgent.id}`;
      const metaArchiveId = sleeptimeAgent?.metadata?.archiveId || mainAgent?.metadata?.archiveId;

      if (!archives || archives.length === 0) {
        if (metaArchiveId) {
          try {
            const a = await client.archives.retrieve(String(metaArchiveId)) as any;
            if (a) archives = [a];
          } catch (_e) {
            // ignore
          }
        }
      }

      if (!archives || archives.length === 0) {
        try {
          const archiveName = `Agent Archive - ${mainAgent?.metadata?.agentKey || ''}-${mainAgent?.id}`;
          const all = normalizeList<any>(await client.archives.list());
          archives = all.filter((a: any) => {
            const meta = (a as any)?.metadata || {};
            const shared = Array.isArray(meta.sharedOwners) ? meta.sharedOwners : (meta?.sharedOwners ? [meta.sharedOwners] : []);
            if (shared.length > 0) {
              return shared.includes(primaryFullAgentKey) && shared.includes(sleeptimeFullAgentKey);
            }
            if (String(meta.ownerFullAgentKey) === String(primaryFullAgentKey) || String(meta.fullAgentKey) === String(primaryFullAgentKey)) return true;
            if (String(a?.name) === archiveName) return true;
            return false;
          });
        } catch (_e) {
          // ignore
        }
      } else {
        archives = (archives || []).filter((a: any) => {
          if (metaArchiveId && String(a?.id) === String(metaArchiveId)) return true;
          const meta = (a as any)?.metadata || {};
          const shared = Array.isArray(meta.sharedOwners) ? meta.sharedOwners : (meta?.sharedOwners ? [meta.sharedOwners] : []);
          if (shared.length > 0) return shared.includes(primaryFullAgentKey) && shared.includes(sleeptimeFullAgentKey);
          if (String(meta.ownerFullAgentKey) === String(primaryFullAgentKey) || String(meta.fullAgentKey) === String(primaryFullAgentKey)) return true;
          const archiveName = `Agent Archive - ${mainAgent?.metadata?.agentKey || ''}-${mainAgent?.id}`;
          if (String(a?.name) === archiveName) return true;
          return false;
        });
      }
    } catch (_e) {
      // keep what retrieve returned
    }

    let memoryBlocks: any[] = sleeptimeAgent.memory?.blocks ?? [];
    try {
      const mresp = await (client.agents as any).blocks.list(sleeptimeAgentId as string);
      memoryBlocks = (mresp as any)?.items ?? mresp ?? memoryBlocks;
    } catch (_e) {
      // ignore
    }

    // Filter memory blocks to only include the shared subset
    try {
      const primaryFullAgentKey = mainAgent?.metadata?.fullAgentKey ?? `${mainAgent?.metadata?.agentKey || ''}-${mainAgent?.id}`;
      const sleeptimeFullAgentKey = sleeptimeAgent?.metadata?.fullAgentKey ?? `${mainAgent?.metadata?.agentKey || ''}-sleeptime-${sleeptimeAgent.id}`;
      const SHARED_BLOCK_LABELS = ['sleeptime_identity', 'sleeptime_procedures', 'subconscious_channel', 'archival_context', 'archival_context_policy'];
      memoryBlocks = (memoryBlocks || []).filter((blk: any) => {
        const meta = blk?.metadata || {};
        const shared = Array.isArray(meta.sharedOwners) ? meta.sharedOwners : (meta?.sharedOwners ? [meta.sharedOwners] : []);
        if (shared.length > 0) {
          return shared.includes(primaryFullAgentKey) && shared.includes(sleeptimeFullAgentKey);
        }
        if (String(meta.ownerFullAgentKey) === String(primaryFullAgentKey)) {
          const lbl = String(blk?.label || '').toLowerCase();
          return SHARED_BLOCK_LABELS.some(s => lbl.includes(s));
        }
        return false;
      });
    } catch (_e) {
      // ignore filtering errors
    }

    // Fetch tools attached to the sleeptime agent
    let tools: any[] = sleeptimeAgent?.tools ?? [];
    try {
      if (!tools || tools.length === 0) {
        const toolsResp = await (client.agents as any).tools.list(sleeptimeAgentId as string);
        tools = normalizeList<any>(toolsResp as unknown);
      }
    } catch (_e) {
      // keep what we have
    }

    // Only return the fields we care about
    const result = {
      id: sleeptimeAgent.id,
      name: sleeptimeAgent.name,
      metadata: sleeptimeAgent.metadata,
      enable_sleeptime: sleeptimeAgent.enable_sleeptime ?? false,
      archives,
      memoryBlocks,
      tools,
    };

    return NextResponse.json({ sleeptimeAgent: result });
  } catch (err: any) {
    console.error('Error fetching sleeptime agent for', agentId, err?.message || err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
