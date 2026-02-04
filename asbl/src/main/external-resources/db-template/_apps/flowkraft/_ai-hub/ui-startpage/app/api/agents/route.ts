import { NextResponse } from 'next/server';
import { getLettaClient } from '../../../src/services/letta/client';

export async function GET() {
  try {
    const client = getLettaClient();
    const agentsResponse: any = await client.agents.list();

    // The response is a paginated object with an 'agents' array
    const agentsList = Array.isArray(agentsResponse) ? agentsResponse : (agentsResponse.agents || []);

    return NextResponse.json({
      success: true,
      agents: agentsList,
      count: agentsList.length,
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch agents from Letta',
        agents: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
