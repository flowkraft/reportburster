#!/usr/bin/env node
import provisionAllAgents from '../src/services/letta/agentProvisioner';

async function main() {
  console.log('Starting agent provisioner...');
  const force = process.env.FORCE_PROVISION === 'true' || process.argv.includes('--force');
  if (force) console.log('FORCE_PROVISION detected: will delete existing agents matching configuration before creating new ones');
  const results = await provisionAllAgents({ force });
  console.log('\nProvision results:', JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Provisioner failed:', err);
  process.exit(1);
});
