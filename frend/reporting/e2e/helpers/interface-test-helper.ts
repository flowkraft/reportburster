import * as path from 'path';
import * as fs from 'fs';
import { expect } from '@playwright/test';
import * as jetpack from 'fs-jetpack';

/**
 * Shared assertion library for interface tests (CLI and REST).
 *
 * Both interface-client-cli.spec.ts and interface-client-rest.spec.ts use these
 * methods to verify identical results — if CLI produces correct output but REST
 * doesn't (or vice versa), the bug is in the interface layer, not the engine.
 */
export class InterfaceTestHelper {
  static readonly PORTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR;

  /**
   * Assert that burst produced the expected output files.
   *
   * @param expectedFiles array of expected output file names (e.g., ['clyde.grew@northridgehealth.org.pdf'])
   * @param extension file extension to match (default: 'pdf')
   */
  static async assertOutputFiles(
    expectedFiles: string[],
    extension: string = 'pdf',
  ): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(this.PORTABLE_DIR, {
      matching: `output/**/*.${extension}`,
    });
    const outputFileNames = outputFilePaths.map((filePath) =>
      path.basename(filePath),
    );

    expect(outputFileNames.sort()).toEqual(expectedFiles.sort());
  }

  /**
   * Assert that processing produced exactly N output files with the given extension.
   *
   * @param expectedCount expected number of files
   * @param extension file extension to match
   */
  static async assertOutputFileCount(
    expectedCount: number,
    extension: string = 'pdf',
  ): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(this.PORTABLE_DIR, {
      matching: `output/**/*.${extension}`,
    });

    expect(outputFilePaths.length).toEqual(expectedCount);
  }

  /**
   * Assert that at least one output file exists with the given extension.
   */
  static async assertOutputFilesExist(
    extension: string = 'pdf',
  ): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(this.PORTABLE_DIR, {
      matching: `output/**/*.${extension}`,
    });

    expect(outputFilePaths.length).toBeGreaterThan(0);
  }

  /**
   * Assert that merge produced a single output file with the expected name.
   */
  static async assertMergeOutput(expectedFileName: string): Promise<void> {
    const outputFilePaths = await jetpack.findAsync(this.PORTABLE_DIR, {
      matching: `output/**/${expectedFileName}`,
    });

    expect(outputFilePaths.length).toEqual(1);
  }

  /**
   * Assert that no errors were logged during processing.
   */
  static async assertNoErrors(): Promise<void> {
    const errorsLogPath = path.join(this.PORTABLE_DIR, 'logs', 'errors.log');
    if (fs.existsSync(errorsLogPath)) {
      const content = fs.readFileSync(errorsLogPath, 'utf-8').trim();
      expect(content).toEqual('');
    }
  }

  /**
   * Assert that info.log contains a specific string (e.g., 'Execution Ended').
   */
  static async assertInfoLogContains(text: string): Promise<void> {
    const infoLogPath = path.join(this.PORTABLE_DIR, 'logs', 'info.log');
    expect(fs.existsSync(infoLogPath)).toBeTruthy();
    const content = fs.readFileSync(infoLogPath, 'utf-8');
    expect(content).toContain(text);
  }

  /**
   * Wait for a job to complete by polling for 'Execution Ended' in info.log.
   *
   * @param timeoutMs maximum wait time (default: 60 seconds)
   * @param pollIntervalMs poll interval (default: 500ms)
   */
  static async waitForJobCompletion(
    timeoutMs: number = 60000,
    pollIntervalMs: number = 500,
  ): Promise<void> {
    const infoLogPath = path.join(this.PORTABLE_DIR, 'logs', 'info.log');
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (fs.existsSync(infoLogPath)) {
        const content = fs.readFileSync(infoLogPath, 'utf-8');
        if (content.includes('Execution Ended')) {
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(
      `Job did not complete within ${timeoutMs}ms — 'Execution Ended' not found in info.log`,
    );
  }

  /**
   * Clean the output directory and logs before a test run.
   */
  static cleanOutputAndLogs(): void {
    const outputDir = path.join(this.PORTABLE_DIR, 'output');
    const logsDir = path.join(this.PORTABLE_DIR, 'logs');

    // Clean output
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Clean logs
    for (const logFile of ['info.log', 'errors.log', 'warnings.log']) {
      const logPath = path.join(logsDir, logFile);
      if (fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '');
      }
    }
  }

  /**
   * Execute a CLI command via child_process and return the result.
   *
   * @param args CLI arguments (e.g., ['burst', 'Payslips.pdf'])
   * @param timeoutMs command timeout (default: 120 seconds)
   */
  static execCli(
    args: string[],
    timeoutMs: number = 120000,
  ): { exitCode: number; stdout: string; stderr: string } {
    const { execSync } = require('child_process');
    const os = require('os');
    const isWindows = os.platform() === 'win32';

    const absoluteDir = path.resolve(this.PORTABLE_DIR);
    const cmd = isWindows ? 'datapallas.bat' : './datapallas.sh';
    const fullCommand = `cd "${absoluteDir}" && set "PORTABLE_EXECUTABLE_DIR=" && ${cmd} ${args.join(' ')}`;

    try {
      const stdout = execSync(fullCommand, {
        timeout: timeoutMs,
        encoding: 'utf-8',
      });
      return { exitCode: 0, stdout: stdout || '', stderr: '' };
    } catch (error: any) {
      return {
        exitCode: error.status || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
      };
    }
  }

  /**
   * Execute a job via REST API and wait for completion.
   *
   * @param endpoint REST endpoint (e.g., '/api/jobs/burst')
   * @param body request body
   * @param baseUrl backend URL (default: http://localhost:9090)
   * @param timeoutMs wait timeout (default: 120 seconds)
   */
  static async execRest(
    endpoint: string,
    body: any,
    baseUrl: string = 'http://localhost:9090',
    timeoutMs: number = 120000,
  ): Promise<void> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`REST ${endpoint} failed: ${response.status} ${text}`);
    }

    // The job runs async — wait for completion via info.log
    await this.waitForJobCompletion(timeoutMs);
  }
}
