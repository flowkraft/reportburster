#!/usr/bin/env node
/**
 * FlowKraft AI Hub - Full Provisioning Script
 * 
 * Provisions both Letta agents AND Matrix chat rooms.
 * 
 * Usage:
 *   npx ts-node scripts/init-agents.ts [--force] [--skip-matrix] [--letta-only]
 * 
 * Flags:
 *   --force          Delete existing Letta agents AND Matrix rooms before re-creating
 *   --skip-matrix    Skip Matrix room provisioning entirely
 *   --letta-only     Only provision Letta agents (legacy mode)
 * 
 * Environment variables:
 *   FORCE_PROVISION=true        - Same as --force
 *   SKIP_MATRIX=true            - Same as --skip-matrix
 *   MATRIX_HOMESERVER_URL       - Matrix/Synapse server URL
 *   MATRIX_SERVER_NAME          - Matrix server domain name
 *   MATRIX_REGISTRATION_SECRET  - Synapse registration shared secret
 */
import provisionAll, { provisionAllAgents } from '../src/services/letta/agentProvisioner';

async function main() {
  console.log('🚀 FlowKraft AI Hub - Provisioning...\n');
  
  const force = process.env.FORCE_PROVISION === 'true' || process.argv.includes('--force');
  const skipMatrix = process.env.SKIP_MATRIX === 'true' || process.argv.includes('--skip-matrix');
  const lettaOnly = process.argv.includes('--letta-only');
  
  if (force) console.log('⚠️  FORCE: Will delete existing Letta agents AND Matrix rooms before creating new ones');
  if (skipMatrix || lettaOnly) console.log('⏭️  Skipping Matrix provisioning');

  // If --letta-only is specified, use the old function for backward compatibility
  if (lettaOnly) {
    const results = await provisionAllAgents({ force });
    console.log('\nProvision results:', JSON.stringify(results, null, 2));
    return;
  }

  // Full provisioning: Letta + Matrix
  const results = await provisionAll({
    force,
    skipMatrix,
    matrixAdmin: {
      username: process.env.MATRIX_ADMIN_USERNAME || 'admin',
      password: process.env.MATRIX_ADMIN_PASSWORD || 'admin',
    },
  });
  
  // Exit with error code if provisioning failed
  if (!results.success && results.errors.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Provisioner failed:', err);
  process.exit(1);
});
