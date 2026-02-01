import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    // Check required environment variables
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

    // Get force parameter from request body
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    // Run the npm script to provision agents
    const scriptName = force ? 'agents:provision-force' : 'agents:provision';
    console.log(`Running npm script: ${scriptName}`);

    const { stdout, stderr } = await execAsync(`npm run ${scriptName}`, {
      cwd: process.cwd(),
      env: { ...process.env },
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for output
    });

    // Log output for debugging
    if (stdout) console.log('Provision stdout:', stdout);
    if (stderr) console.error('Provision stderr:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Agents provisioned successfully',
      output: stdout,
    });
  } catch (error: any) {
    console.error('Error provisioning agents:', error);

    // Extract useful error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorOutput = error.stdout || error.stderr || '';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to provision agents',
        message: errorMessage,
        output: errorOutput,
      },
      { status: 500 }
    );
  }
}
