#!/usr/bin/env node
import getLettaClient from '../src/services/letta/client';
import { AGENTS } from '../src/agents';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: { ids?: string[]; name?: string; dryRun?: boolean; yes?: boolean } = {};
  for (const a of args) {
    if (a.startsWith('--ids=')) out.ids = a.replace('--ids=', '').split(',').map(s => s.trim()).filter(Boolean);
    else if (a.startsWith('--name=')) out.name = a.replace('--name=', '').trim();
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--no-dry-run' || a === '--run') out.dryRun = false;
    else if (a === '--yes' || a === '-y') {
      out.yes = true;
      // treat --yes as intent to actually perform deletions
      out.dryRun = false;
    }
  }

  // If running via `npm run` and options were passed as `--name=...`, npm will
  // expose them as `npm_config_name` environment variables; support that here.
  // This avoids `npm WARN Unknown cli config "--name"` confusion on Windows.
  try {
    if (!out.name && process.env.npm_config_name) {
      out.name = process.env.npm_config_name;
      console.warn('Using npm_config_name from npm run args:', out.name);
    }
    if (!out.ids && process.env.npm_config_ids) {
      out.ids = (process.env.npm_config_ids || '').split(',').map(s => s.trim()).filter(Boolean);
      console.warn('Using npm_config_ids from npm run args:', out.ids);
    }
    if (process.env.npm_config_yes === 'true') {
      out.yes = true;
      out.dryRun = false;
      console.warn('Using npm_config_yes from npm run args');
    }
    if (process.env.npm_config_no_dry_run === 'true' || process.env.npm_config_run === 'true') {
      out.dryRun = false;
      console.warn('Using npm_config_no_dry_run/npm_config_run from npm run args');
    }
  } catch (_e) {
    // ignore env parsing issues
  }

  // default to dry run unless explicitly disabled
  if (out.dryRun === undefined) out.dryRun = true;
  return out;
}

function normalizeList<T>(resp: unknown): T[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp as T[];
  const obj = resp as { items?: T[] } | undefined;
  return obj?.items ?? [];
}

async function confirmPrompt(prompt: string) {
  return new Promise<boolean>((resolve) => {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (ans: string) => {
      rl.close();
      const yes = ans.trim().toLowerCase();
      resolve(yes === 'y' || yes === 'yes');
    });
  });
}

async function main() {
  const { ids, name, dryRun, yes } = parseArgs();

  // If no specific filters, default to deleting all FlowKraft agents
  const deleteAllFlowkraft = !ids && !name;

  if (!deleteAllFlowkraft && !ids && !name) {
    console.error('Usage: delete-agents [--ids=id1,id2] [--name="Prefix or exact name"] [--dry-run] [--yes]');
    console.error('       Run without args to delete all FlowKraft agents');
    process.exit(2);
  }

  const client = getLettaClient();

  // Fetch agents (page up to 1000)
  const resp = await client.agents.list({ limit: 1000 as any });
  const allAgents = normalizeList<any>(resp as unknown);

  let matches = allAgents.filter((a: any) => {
    // If deleting all FlowKraft agents
    if (deleteAllFlowkraft) {
      return (
        a.metadata?.flowkraft_id ||
        a.metadata?.agentKey ||
        AGENTS.some((config) => config.key === a.name || config.displayName === a.name)
      );
    }

    // Otherwise use filters
    if (ids && ids.length > 0) return ids.includes(a.id);
    if (name) {
      const nm = (a.name || '').toLowerCase();
      const q = name.toLowerCase();
      return nm === q || nm.includes(q) || (a.tags || []).includes(name);
    }
    return false;
  });

  if (matches.length === 0) {
    console.log('No matching agents found for query', { ids, name, deleteAllFlowkraft });
    return;
  }

  console.log('Matched agents:');
  for (const a of matches) {
    console.log('-', a.id, '|', a.name, '| tags:', (a.tags || []).join(', '));
  }

  if (dryRun) {
    console.log('\nDRY RUN: no agents will be deleted. Re-run with --yes to actually delete or use --dry-run=false');
    return;
  }

  if (!yes) {
    const ok = await confirmPrompt('\nDelete the matched agents? (y/N): ');
    if (!ok) {
      console.log('Aborted by user');
      return;
    }
  }

  function getErrorMessage(err: unknown): string {
    if (!err) return String(err);
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch (_e) {
      return String(err);
    }
  }

  for (const a of matches) {
    try {
      console.log('Deleting', a.id, a.name);
      await client.agents.delete(a.id);
      console.log('Deleted', a.id);
    } catch (err) {
      console.warn('Failed to delete agent', a.id, getErrorMessage(err));
    }
  }

  console.log('Done.');
}

main().catch(err => {
  console.error('delete-agents failed:', err);
  process.exit(1);
});
