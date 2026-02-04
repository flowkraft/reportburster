#!/usr/bin/env node
import getLettaClient from '../src/services/letta/client';

function normalizeList<T>(resp: unknown): T[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp as T[];
  const obj = resp as { items?: T[] } | undefined;
  return obj?.items ?? [];
}

function formatError(err: unknown): string {
  if (!err) return '';
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch (_) { return String(err); }
}

async function main() {
  const client = getLettaClient();
  const yes = process.env.TRUNCATE_YES === 'true' || process.argv.includes('--yes');
  const force = process.env.FORCE_TRUNCATE === 'true' || process.argv.includes('--force');

  console.log('TRUNCATE DB script starting');
  console.log('Options: yes=', yes, 'force=', force);

  // List agents
  let agents: any[] = [];
  try {
    const resp = await client.agents.list({ limit: 1000 as any });
    agents = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list agents:', formatError(err));
    process.exit(1);
  }

  // List blocks
  let blocks: any[] = [];
  try {
    const resp = await client.blocks.list({ limit: 1000 as any });
    blocks = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list blocks:', formatError(err));
    process.exit(1);
  }

  // List archives
  let archives: any[] = [];
  try {
    const resp = await client.archives.list({ limit: 1000 as any });
    archives = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list archives:', formatError(err));
    process.exit(1);
  }

  // List tools (including custom tools that need to be cleaned for fresh registration)
  let tools: any[] = [];
  try {
    const resp = await client.tools.list({ limit: 1000 as any });
    tools = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list tools:', formatError(err));
    process.exit(1);
  }

  console.log(`Found ${agents.length} agents, ${blocks.length} blocks, ${archives.length} archives, ${tools.length} tools`);

  if (!yes) {
    console.log('\nDRY RUN: to actually delete these resources re-run with --yes or set TRUNCATE_YES=true');
    console.log('You may also pass --force to delete protected resources.');
    console.log('\nAgents (first 20):', agents.slice(0, 20).map(a => ({ id: a.id, name: a.name, tags: a.tags, metadata: a.metadata })));
    console.log('\nBlocks (first 20):', blocks.slice(0, 20).map(b => ({ id: b.id, label: b.label, description: b.description, metadata: b.metadata })));
    console.log('\nArchives (first 20):', archives.slice(0, 20).map(a => ({ id: a.id, name: a.name, description: a.description, metadata: a.metadata })));
    console.log('\nTools (first 20):', tools.slice(0, 20).map(t => ({ id: t.id, name: t.name, tags: t.tags, source_type: t.source_type })));
    process.exit(0);
  }

  console.log('\nProceeding with deletion...');

  // Helper to determine if resource is protected
  const isProtected = (obj: any): boolean => {
    if (!obj) return false;
    if (obj.metadata && (obj.metadata.protected === true || obj.metadata.protected === 'true')) return true;
    if (obj.tags && Array.isArray(obj.tags) && obj.tags.includes('system')) return true;
    const name = (obj.name || obj.label || '') as string;
    if (/^system|^letta|^letta/i.test(name)) return true; // heuristic for platform-owned resources
    return false;
  };

  // Delete agents (including any sleeptime/linked agents)
  for (const a of agents) {
    try {
      if (isProtected(a) && !force) {
        console.log('Skipping protected agent:', a.id, a.name || a.metadata?.agentKey || '');
        continue;
      }
      await client.agents.delete(a.id);
      console.log('Deleted agent:', a.id, a.name || '');
    } catch (err) {
      console.warn('Failed to delete agent', a.id, formatError(err));
    }
  }

  // Refresh blocks and archives after agent deletions
  try {
    const resp = await client.blocks.list({ limit: 1000 as any });
    blocks = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list blocks (after agent deletion):', formatError(err));
    process.exit(1);
  }

  try {
    const resp = await client.archives.list({ limit: 1000 as any });
    archives = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list archives (after agent deletion):', formatError(err));
    process.exit(1);
  }

  // Delete blocks
  for (const b of blocks) {
    try {
      if (isProtected(b) && !force) {
        console.log('Skipping protected block:', b.id, b.label);
        continue;
      }
      await client.blocks.delete(b.id);
      console.log('Deleted block:', b.id, b.label);
    } catch (err) {
      console.warn('Failed to delete block', b.id, formatError(err));
    }
  }

  // Delete archives
  for (const ar of archives) {
    try {
      if (isProtected(ar) && !force) {
        console.log('Skipping protected archive:', ar.id, ar.name);
        continue;
      }
      await client.archives.delete(ar.id);
      console.log('Deleted archive:', ar.id, ar.name);
    } catch (err) {
      console.warn('Failed to delete archive', ar.id, formatError(err));
    }
  }

  // Delete tools (including custom tools - they will be re-registered on next provision)
  // Refresh tools list after other deletions
  try {
    const resp = await client.tools.list({ limit: 1000 as any });
    tools = normalizeList<any>(resp as unknown);
  } catch (err) {
    console.error('Failed to list tools (after other deletions):', formatError(err));
  }

  for (const t of tools) {
    try {
      // Skip Letta's built-in base tools that cannot be deleted
      // These are re-created by ensureBaseToolsRegistered anyway
      const toolName = (t.name || '') as string;
      const tags = (t.tags || []) as string[];

      // Identify truly system tools that should not be deleted
      // Note: We DO want to delete 'base' tagged tools as they get re-registered
      if (isProtected(t) && !force) {
        console.log('Skipping protected tool:', t.id, t.name);
        continue;
      }

      await client.tools.delete(t.id);
      console.log('Deleted tool:', t.id, t.name, `(tags: ${tags.join(', ') || 'none'})`);
    } catch (err) {
      // Some tools may be undeletable (built-in) - this is expected
      const errStr = formatError(err);
      if (/cannot delete|built-in|system|protected/i.test(errStr)) {
        console.log('Skipping built-in tool:', t.id, t.name);
      } else {
        console.warn('Failed to delete tool', t.id, t.name, errStr);
      }
    }
  }

  console.log('\nTruncate complete.');
}

main().catch(err => {
  console.error('Truncate script failed:', err);
  process.exit(1);
});
