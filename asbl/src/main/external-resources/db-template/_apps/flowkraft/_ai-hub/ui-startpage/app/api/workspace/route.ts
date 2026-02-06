import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEXT_EXTENSIONS: Record<string, string> = {
  '.md': 'markdown',
  '.json': 'json',
  '.txt': 'text',
  '.html': 'html',
  '.htm': 'html',
  '.puml': 'uml',
  '.uml': 'uml',
  '.org': 'org',
  '.groovy': 'groovy',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
  '.css': 'css',
  '.sql': 'sql',
  '.sh': 'bash',
  '.bat': 'text',
  '.csv': 'text',
  '.properties': 'text',
  '.cfg': 'text',
  '.conf': 'text',
  '.ini': 'text',
  '.log': 'text',
  '.toml': 'text',
  '.gradle': 'groovy',
  '.gsp': 'html',
  '.ftl': 'html',
};

const MAX_FILE_SIZE = 256 * 1024; // 256KB

// Ordered list of agents - this controls the display order in the file explorer
const AGENT_ORDER = ['athena', 'hephaestus', 'hermes', 'apollo', 'pythia'];

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'athena': 'Athena (ReportBurster Guru & Data Modeling & Business Analysis Expert)',
  'hephaestus': 'Hephaestus (Backend Jobs & ETL & Automation Advisor)',
  'hermes': 'Hermes (Grails Guru & Self-Service Portal Advisor)',
  'apollo': 'Apollo (Next.js Guru & Modern Web Advisor)',
  'pythia': 'Pythia (WordPress CMS Portal Advisor)',
};

function getWorkspaceRoot(): string | null {
  // Docker: mounted at /app/workspace
  if (fs.existsSync('/app/workspace/agents-output-artifacts')) return '/app/workspace';
  // Local dev: parent of ui-startpage (the _ai-hub directory)
  const parent = path.resolve(process.cwd(), '..');
  if (fs.existsSync(path.join(parent, 'agents-output-artifacts'))) return parent;
  return null;
}

function readDirectoryRecursive(
  dirPath: string,
  prefix: string,
  files: Array<{ path: string; type: string; content: string }>,
  maxDepth: number = 5,
  depth: number = 0
): void {
  if (depth > maxDepth) return;
  if (!fs.existsSync(dirPath)) return;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      readDirectoryRecursive(fullPath, relativePath, files, maxDepth, depth + 1);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const fileType = TEXT_EXTENSIONS[ext];
      if (!fileType) continue;

      try {
        const stats = fs.statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) continue;
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ path: relativePath, type: fileType, content });
      } catch {
        // Skip unreadable files
      }
    }
  }
}

export async function GET() {
  try {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      return NextResponse.json({
        files: [],
        message: 'Workspace directory not available',
      });
    }

    const files: Array<{ path: string; type: string; content: string }> = [];

    // Scan agents-output-artifacts/{agentName}/ — each subdirectory is an agent
    const artifactsDir = path.join(workspaceRoot, 'agents-output-artifacts');
    if (fs.existsSync(artifactsDir)) {
      try {
        const entries = fs.readdirSync(artifactsDir, { withFileTypes: true });

        // Process agents in the specified order (AGENT_ORDER), then any remaining agents alphabetically
        const agentDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
        const orderedAgents = [
          ...AGENT_ORDER.filter(name => agentDirs.some(d => d.name.toLowerCase() === name)),
          ...agentDirs
            .map(d => d.name.toLowerCase())
            .filter(name => !AGENT_ORDER.includes(name))
            .sort()
        ];

        for (const agentName of orderedAgents) {
          const entry = agentDirs.find(d => d.name.toLowerCase() === agentName);
          if (!entry) continue;
          // Use full display name with description, or fallback to capitalized name
          const displayName = AGENT_DISPLAY_NAMES[entry.name.toLowerCase()]
            || entry.name.charAt(0).toUpperCase() + entry.name.slice(1);
          const fullPath = path.join(artifactsDir, entry.name);
          readDirectoryRecursive(fullPath, `Agents/${displayName}`, files);
        }

        // Top-level files in agents-output-artifacts/ (e.g., README.md)
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const ext = path.extname(entry.name).toLowerCase();
          const fileType = TEXT_EXTENSIONS[ext];
          if (!fileType) continue;
          const fullPath = path.join(artifactsDir, entry.name);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.size > MAX_FILE_SIZE) continue;
            const content = fs.readFileSync(fullPath, 'utf-8');
            files.push({ path: `Agents/${entry.name}`, type: fileType, content });
          } catch {}
        }
      } catch {}
    }

    return NextResponse.json({ files });
  } catch (err: any) {
    console.error('Workspace API error:', err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
