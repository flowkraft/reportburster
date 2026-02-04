import { NextRequest, NextResponse } from 'next/server';
import { getLettaClient } from '../../../../src/services/letta/client';

/**
 * GET /api/tools/[toolId]
 * Retrieve a tool by ID, including its source code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;

  if (!toolId) {
    return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
  }

  try {
    const client = getLettaClient();
    const tool = await client.tools.retrieve(toolId);
    
    return NextResponse.json(tool);
  } catch (error: any) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tool' },
      { status: error.status || 500 }
    );
  }
}
