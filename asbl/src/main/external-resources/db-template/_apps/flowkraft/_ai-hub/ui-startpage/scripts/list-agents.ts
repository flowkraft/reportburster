#!/usr/bin/env node
import getLettaClient from '../src/services/letta/client';

async function main() {
  const client = getLettaClient();
  try {
    const resp = await client.agents.list({ limit: 1000 as any });
    const agents = Array.isArray(resp) ? resp : (resp?.items ?? []);
    if (!agents || agents.length === 0) {
      console.log('No agents found');
      return;
    }

    console.log(`\n📦 Found ${agents.length} agent(s):\n`);

    for (const a of agents) {
      // Prefer official tags; fall back to metadata.tags or the list value
      let tags: string[] = [];
      try {
        const full = await client.agents.retrieve(a.id) as any;
        tags = Array.isArray(full.tags) && full.tags.length > 0 ? full.tags : (Array.isArray(full.metadata?.tags) ? full.metadata.tags : []);
        // debug dump for inspection (first agent only)
        if (a.id && a.id === agents[0].id) {
          console.log('DEBUG agent full object keys:', Object.keys(full));
          console.log('DEBUG full (partial):', JSON.stringify({ id: full.id, name: full.name, tags: full.tags, metadataTags: full.metadata?.tags ?? null }, null, 2));
        }
      } catch (err) {
        // fallback to listing value and metadata in listing
        const tArr = Array.isArray(a.tags) ? a.tags : (typeof a.tags === 'string' ? [a.tags] : []);
        tags = tArr.length > 0 ? tArr : (Array.isArray((a as any).metadata?.tags) ? (a as any).metadata.tags : []);
      }

      const filtered = tags;
      const role = (a as any).metadata?.role || 'N/A';
      const flowkraftId = (a as any).metadata?.flowkraft_id || '';

      console.log(`${a.id} | ${a.name}${flowkraftId ? ` (${flowkraftId})` : ''}`);
      console.log(`   Role: ${role}`);
      console.log(`   Tags: ${filtered.join(', ')}`);
      console.log('');
    }
  } catch (err) {
    console.error('list-agents failed:', err);
    process.exit(1);
  }
}

main();
