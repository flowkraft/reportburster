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

function getWorkspaceRoot(): string | null {
  // Docker: mounted at /app/workspace
  if (fs.existsSync('/app/workspace/agents')) return '/app/workspace';
  // Local dev: parent of ui-startpage (the _ai-hub directory)
  const parent = path.resolve(process.cwd(), '..');
  if (fs.existsSync(path.join(parent, 'agents'))) return parent;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentKey: string }> }
) {
  try {
    const { agentKey } = await params;

    // Validate agentKey to prevent path traversal
    if (!agentKey || !/^[a-z0-9_-]+$/i.test(agentKey)) {
      return NextResponse.json({ error: 'Invalid agent key' }, { status: 400 });
    }

    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      return NextResponse.json({
        agentKey,
        files: [],
        message: 'Workspace directory not available',
      });
    }

    const files: Array<{ path: string; type: string; content: string }> = [];

    // 1. Agent's personal workspace: agents/workspace-{key}/
    const wsPath = path.join(workspaceRoot, 'agents', `workspace-${agentKey}`);
    readDirectoryRecursive(wsPath, 'My Workspace', files);

    // 2. Shared agents directory — top-level files only (README, etc.)
    const agentsDir = path.join(workspaceRoot, 'agents');
    if (fs.existsSync(agentsDir)) {
      try {
        const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const ext = path.extname(entry.name).toLowerCase();
          const fileType = TEXT_EXTENSIONS[ext];
          if (!fileType) continue;
          const fullPath = path.join(agentsDir, entry.name);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.size > MAX_FILE_SIZE) continue;
            const content = fs.readFileSync(fullPath, 'utf-8');
            files.push({ path: `Team Workspaces/${entry.name}`, type: fileType, content });
          } catch {}
        }
      } catch {}
    }

    // 3. PRD Documents: docs/product/
    const docsPath = path.join(workspaceRoot, 'docs', 'product');
    readDirectoryRecursive(docsPath, 'PRD Documents', files);

    return NextResponse.json({ agentKey, files });
  } catch (err: any) {
    console.error('Workspace API error:', err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
