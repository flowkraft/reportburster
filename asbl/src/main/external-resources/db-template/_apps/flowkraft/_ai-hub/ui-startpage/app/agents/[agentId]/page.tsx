'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, Folder, FolderOpen, File, Bug, Copy, Loader2 } from 'lucide-react';
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

export default function AgentDetailsPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(20);
  const [rightPanelWidth, setRightPanelWidth] = useState(30);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [mobilePanel, setMobilePanel] = useState<'files' | 'editor' | 'preview'>('editor');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  const [agentName, setAgentName] = useState<string>('');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showPreview = selectedFile
    ? PREVIEWABLE_EXTENSIONS.has(selectedFile.path.toLowerCase().split('.').pop() || '')
    : false;

  // Reset mobile panel if preview goes away
  useEffect(() => {
    if (!showPreview && mobilePanel === 'preview') {
      setMobilePanel('editor');
    }
  }, [showPreview, mobilePanel]);

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
    async function loadWorkspace() {
      try {
        setLoading(true);

        // Step 1: Fetch agent info to get name/key
        const agentRes = await fetch(`/api/agents/${agentId}`);
        if (!agentRes.ok) {
          setError('Agent not found');
          return;
        }
        const agent = await agentRes.json();
        const name = agent.name || 'Unknown Agent';
        const key = agent.metadata?.agentKey || name.toLowerCase();
        setAgentName(name);

        // Step 2: Fetch workspace files
        const wsRes = await fetch(`/api/workspace/${encodeURIComponent(key)}`);
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          const wsFiles: FileNode[] = wsData.files || [];
          setFiles(wsFiles);

          // Auto-expand all top-level folders
          const folders = new Set<string>();
          for (const file of wsFiles) {
            const parts = file.path.split('/');
            if (parts.length > 1) folders.add(parts[0]);
          }
          setExpandedFolders(folders);

          // Auto-select first file if available
          if (wsFiles.length > 0) {
            setSelectedFile(wsFiles[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load workspace:', err);
        setError('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [agentId]);

  // Build file tree structure from flat paths
  const fileTree: { [key: string]: FileNode[] } = {};
  files.forEach((file: FileNode) => {
    const parts = file.path.split('/');
    if (parts.length === 1) {
      if (!fileTree['_root']) fileTree['_root'] = [];
      fileTree['_root'].push(file);
    } else {
      const folder = parts[0];
      if (!fileTree[folder]) fileTree[folder] = [];
      fileTree[folder].push(file);
    }
  });

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
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

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rb-cyan" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/agents" className="text-rb-cyan hover:underline mb-4 inline-block">
            &larr; Back to Agents
          </Link>
          <p className="text-muted-foreground">{error}</p>
        </div>
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
            <h1 className="text-xl font-bold">{agentName}&apos;s Workspace</h1>
            <Link
              href={`/agents/${agentId}/debug`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Debug agent"
            >
              <Bug className="w-4 h-4" />
              Debug
            </Link>
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
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">WORKSPACE</h3>

                {files.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Workspace is empty. Files will appear here as {agentName} works on projects.
                  </p>
                )}

                {/* Root files */}
                {fileTree['_root']?.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                      selectedFile?.path === file.path ? 'bg-rb-cyan/10 text-rb-cyan' : 'text-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}

                {/* Folders */}
                {Object.keys(fileTree).filter(k => k !== '_root').sort().map((folder) => (
                  <div key={folder} className="mt-2">
                    <button
                      onClick={() => toggleFolder(folder)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors text-foreground"
                    >
                      {expandedFolders.has(folder) ? (
                        <FolderOpen className="w-4 h-4 flex-shrink-0 text-rb-cyan" />
                      ) : (
                        <Folder className="w-4 h-4 flex-shrink-0 text-rb-cyan" />
                      )}
                      <span className="truncate font-medium">{folder}</span>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto transition-transform ${
                          expandedFolders.has(folder) ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {expandedFolders.has(folder) && (
                      <div className="ml-4 mt-1">
                        {fileTree[folder].map((file) => {
                          const fileName = file.path.split('/').pop();
                          return (
                            <button
                              key={file.path}
                              onClick={() => setSelectedFile(file)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                                selectedFile?.path === file.path ? 'bg-rb-cyan/10 text-rb-cyan' : 'text-foreground'
                              }`}
                            >
                              <File className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{fileName}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
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

        {/* CENTER PANEL: Code Editor (takes all remaining space) */}
        <div
          className={`flex-1 overflow-hidden ${
            mobilePanel === 'editor' ? 'block' : 'hidden'
          } md:block`}
        >
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-border px-4 py-2 bg-muted/30 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{selectedFile.path}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="hover:bg-muted"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </Button>
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
            <div
              className="hidden md:block w-1 bg-border hover:bg-rb-cyan cursor-col-resize transition-colors"
              onMouseDown={() => setIsDraggingRight(true)}
            />
            <div
              className={`border-l border-border bg-card overflow-y-auto ${
                mobilePanel === 'preview' ? 'block' : 'hidden'
              } md:block`}
              style={{ width: `${rightPanelWidth}%`, minWidth: '250px' }}
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
