import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    // Check required environment variables for Letta
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiApiBase = process.env.OPENAI_API_BASE;

    if (!openaiApiKey || !openaiApiBase) {
      const missing = [];
      if (!openaiApiKey) missing.push('OPENAI_API_KEY');
      if (!openaiApiBase) missing.push('OPENAI_API_BASE');

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables',
          missing,
          message: `Please add ${missing.join(' and ')} to your .env file, then restart the app and try again.`,
        },
        { status: 400 }
      );
    }

    // Get parameters from request body
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;           // Force re-provisioning (both Letta and Matrix)
    const skipMatrix = body.skipMatrix === true;
    const lettaOnly = body.lettaOnly === true;

    // Build the npm script command with appropriate flags
    const scriptName = force ? 'agents:provision-force' : 'agents:provision';
    
    // Add environment variables
    const envVars: Record<string, string> = { ...process.env as Record<string, string> };
    if (skipMatrix || lettaOnly) {
      envVars.SKIP_MATRIX = 'true';
    }

    console.log(`Running npm script: ${scriptName}${skipMatrix ? ' (skip-matrix)' : ''}${force ? ' (force)' : ''}`);

    const { stdout, stderr } = await execAsync(`npm run ${scriptName}`, {
      cwd: process.cwd(),
      env: envVars,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for output
    });

    // Log output for debugging
    if (stdout) console.log('Provision stdout:', stdout);
    if (stderr) console.error('Provision stderr:', stderr);

    return NextResponse.json({
      success: true,
      message: skipMatrix 
        ? 'Letta agents provisioned successfully' 
        : 'FlowKraft AI Hub provisioned successfully (Letta + Matrix)',
      output: stdout,
    });
  } catch (error: any) {
    console.error('Error provisioning:', error);

    // Extract useful error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorOutput = error.stdout || error.stderr || '';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to provision',
        message: errorMessage,
        output: errorOutput,
      },
      { status: 500 }
    );
  }
}
