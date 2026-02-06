'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, Folder, FolderOpen, Copy, Loader2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { toast } from 'sonner';

type FileNode = {
  path: string;
  type: string;
  content: string;
};

const PREVIEWABLE_EXTENSIONS = new Set(['html', 'htm', 'puml', 'plantuml', 'uml']);

export default function WorkspacesPage() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(20);
  const [rightPanelWidth, setRightPanelWidth] = useState(30);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [mobilePanel, setMobilePanel] = useState<'files' | 'editor' | 'preview'>('editor');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isCodeEditorCollapsed, setIsCodeEditorCollapsed] = useState(false);

  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);

  const showPreview = selectedFile
    ? PREVIEWABLE_EXTENSIONS.has(selectedFile.path.toLowerCase().split('.').pop() || '')
    : false;

  // Reset mobile panel and code editor collapse if preview goes away
  useEffect(() => {
    if (!showPreview) {
      if (mobilePanel === 'preview') setMobilePanel('editor');
      if (isCodeEditorCollapsed) setIsCodeEditorCollapsed(false);
    }
  }, [showPreview, mobilePanel, isCodeEditorCollapsed]);

  // Drag resize handlers
  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const pct = (e.clientX / window.innerWidth) * 100;
        setLeftPanelWidth(Math.max(10, Math.min(40, pct)));
      }
      if (isDraggingRight) {
        const pct = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
        setRightPanelWidth(Math.max(15, Math.min(50, pct)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight]);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        setLoading(true);
        const res = await fetch('/api/workspace');
        if (res.ok) {
          const data = await res.json();
          const wsFiles: FileNode[] = data.files || [];
          setFiles(wsFiles);

          // Auto-expand all top-level folders
          const folders = new Set<string>();
          for (const file of wsFiles) {
            const parts = file.path.split('/');
            if (parts.length > 1) folders.add(parts[0]);
          }
          setExpandedFolders(folders);

          // Auto-select first file
          if (wsFiles.length > 0) {
            setSelectedFile(wsFiles[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaces();
  }, []);

  // Build file tree structure from flat paths (supports nested folders)
  type TreeNode = {
    name: string;
    fullPath: string;
    file?: FileNode;
    children: Map<string, TreeNode>;
  };

  const rootTree = useMemo(() => {
    const root: TreeNode = { name: '', fullPath: '', children: new Map() };
    files.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            fullPath: parts.slice(0, i + 1).join('/'),
            children: new Map(),
          });
        }
        current = current.children.get(part)!;
      }
      current.file = file;
    });
    return root;
  }, [files]);

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);

    // Check if this is an agent folder (path like "Agents/AgentName")
    const isAgentFolder = folder.startsWith('Agents/') && folder.split('/').length === 2;

    if (newExpanded.has(folder)) {
      // Collapsing - just remove it
      newExpanded.delete(folder);
    } else {
      // Expanding
      if (isAgentFolder) {
        // Collapse all other agent folders first (accordion behavior)
        for (const path of newExpanded) {
          if (path.startsWith('Agents/') && path.split('/').length === 2 && path !== folder) {
            newExpanded.delete(path);
          }
        }
      }
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const getLanguage = (type: string): string => {
    const map: { [key: string]: string } = {
      markdown: 'markdown',
      json: 'json',
      text: 'plaintext',
      html: 'markup',
      uml: 'plantuml',
      org: 'orgmode',
      groovy: 'groovy',
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      yaml: 'yaml',
      xml: 'xml',
      css: 'css',
      sql: 'sql',
      bash: 'bash',
    };
    return map[type] || 'plaintext';
  };

  const handleCopyToClipboard = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content).then(() => {
        toast.success('Copied to clipboard');
      });
    }
  };

  // Render a tree node recursively
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    // Pure file leaf
    if (node.file && node.children.size === 0) {
      return (
        <button
          key={node.fullPath}
          onClick={() => setSelectedFile(node.file!)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
            selectedFile?.path === node.file.path ? 'bg-rb-cyan/10 text-rb-cyan' : 'text-foreground'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
      );
    }

    // Folder (or file that also has children — treat as folder)
    const isExpanded = expandedFolders.has(node.fullPath);

    // For "Agents" folder, preserve API order (don't sort alphabetically)
    // For other folders, sort with folders first, then alphabetically
    const isAgentsFolder = node.fullPath === 'Agents';
    const sortedChildren = isAgentsFolder
      ? Array.from(node.children.values()) // Preserve insertion order from API
      : Array.from(node.children.values()).sort((a, b) => {
          const aIsFolder = a.children.size > 0 && !a.file;
          const bIsFolder = b.children.size > 0 && !b.file;
          if (aIsFolder && !bIsFolder) return -1;
          if (!aIsFolder && bIsFolder) return 1;
          return a.name.localeCompare(b.name);
        });

    // Athena is "first among equals" - bold her folder name
    const isAthena = node.name.toLowerCase().startsWith('athena');

    return (
      <div key={node.fullPath}>
        <button
          onClick={() => toggleFolder(node.fullPath)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors text-foreground"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0 text-rb-cyan" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0 text-rb-cyan" />
          )}
          <span className={`whitespace-normal break-words text-left ${isAthena ? 'font-semibold' : 'font-normal'}`}>{node.name}</span>
          <ChevronRight
            className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        {isExpanded && sortedChildren.map((child) => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rb-cyan" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/agents" className="text-rb-cyan hover:underline">
              &larr; Back
            </Link>
            <h1 className="text-xl font-bold">Oracle Output Artifacts</h1>
          </div>

          {/* Mobile Panel Selector */}
          <div className="flex md:hidden gap-1">
            <Button
              variant={mobilePanel === 'files' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMobilePanel('files')}
            >
              Files
            </Button>
            <Button
              variant={mobilePanel === 'editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMobilePanel('editor')}
            >
              Code
            </Button>
            {showPreview && (
              <Button
                variant={mobilePanel === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMobilePanel('preview')}
              >
                Preview
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: File Explorer */}
        <div
          className={`border-r border-border bg-card overflow-y-auto transition-all duration-300 ${
            mobilePanel === 'files' ? 'block' : 'hidden'
          } md:block ${isLeftPanelCollapsed ? 'md:!w-12' : ''}`}
          style={isLeftPanelCollapsed ? undefined : { width: `${leftPanelWidth}%`, minWidth: '200px' }}
        >
          {isLeftPanelCollapsed ? (
            <div className="flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLeftPanelCollapsed(false)}
                className="hover:bg-muted"
                title="Expand file explorer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="mt-4 text-xs text-muted-foreground rotate-90 whitespace-nowrap origin-center">
                FILES
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLeftPanelCollapsed(true)}
                  className="hover:bg-muted"
                  title="Collapse file explorer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">OUTPUT ARTIFACTS</h3>

                {files.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    No output artifacts found. Files will appear here as the oracles work on projects.
                  </p>
                )}

                {/* Render tree */}
                {Array.from(rootTree.children.values())
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((node) => renderTreeNode(node, 0))}
              </div>
            </div>
          )}
        </div>

        {/* Left resize handle */}
        {!isLeftPanelCollapsed && (
          <div
            className="hidden md:block w-1 bg-border hover:bg-rb-cyan cursor-col-resize transition-colors"
            onMouseDown={() => setIsDraggingLeft(true)}
          />
        )}

        {/* CENTER PANEL: Code Editor */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            mobilePanel === 'editor' ? 'block' : 'hidden'
          } md:block ${isCodeEditorCollapsed && showPreview ? 'md:!w-12 md:!min-w-[48px] md:!flex-none' : 'flex-1'}`}
        >
          {isCodeEditorCollapsed && showPreview ? (
            <div className="flex flex-col items-center py-4 h-full border-r border-border bg-card">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCodeEditorCollapsed(false)}
                className="hover:bg-muted"
                title="Show code editor"
              >
                <Code2 className="w-4 h-4" />
              </Button>
              <div className="mt-4 text-xs text-muted-foreground rotate-90 whitespace-nowrap origin-center">
                CODE
              </div>
            </div>
          ) : selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-border px-4 py-2 bg-muted/30 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{selectedFile.path}</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="hover:bg-muted"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {showPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCodeEditorCollapsed(true)}
                      className="hover:bg-muted"
                      title="Hide code editor, expand preview"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <CodeEditor
                  code={selectedFile.content}
                  language={getLanguage(selectedFile.type)}
                  fileName={selectedFile.path}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a file to view its contents
            </div>
          )}
        </div>

        {/* Right resize handle + Preview panel (only for HTML/PlantUML) */}
        {showPreview && selectedFile && (
          <>
            {!isCodeEditorCollapsed && (
              <div
                className="hidden md:block w-1 bg-border hover:bg-rb-cyan cursor-col-resize transition-colors"
                onMouseDown={() => setIsDraggingRight(true)}
              />
            )}
            <div
              className={`border-l border-border bg-card overflow-y-auto ${
                mobilePanel === 'preview' ? 'block' : 'hidden'
              } md:block`}
              style={isCodeEditorCollapsed
                ? { flex: 1 }
                : { width: `${rightPanelWidth}%`, minWidth: '250px' }
              }
            >
              <PreviewPanel
                fileName={selectedFile.path.split('/').pop() || selectedFile.path}
                fileContent={selectedFile.content}
                language={getLanguage(selectedFile.type)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
