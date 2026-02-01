'use client';

import { useEffect, useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  fileName: string;
  fileContent: string;
  language: string;
}

export function PreviewPanel({ fileName, fileContent, language }: PreviewPanelProps) {
  const [previewType, setPreviewType] = useState<'html' | 'markdown' | 'plantuml' | 'orgmode' | 'none'>('none');
  const [processedContent, setProcessedContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Determine preview type based on file extension
    const ext = fileName.toLowerCase().split('.').pop() || '';

    if (ext === 'html' || ext === 'htm') {
      setPreviewType('html');
      setProcessedContent(fileContent);
    } else if (ext === 'md' || ext === 'markdown') {
      setPreviewType('markdown');
      renderMarkdown(fileContent);
    } else if (ext === 'puml' || ext === 'plantuml' || ext === 'uml') {
      setPreviewType('plantuml');
      renderPlantUML(fileContent);
    } else if (ext === 'org') {
      setPreviewType('orgmode');
      setProcessedContent(fileContent);
    } else {
      setPreviewType('none');
      setProcessedContent('');
    }
  }, [fileName, fileContent]);

  const renderMarkdown = async (content: string) => {
    try {
      // Use marked library to render markdown (similar to Angular app)
      const marked = (await import('marked')).marked;
      const html = await marked.parse(content);
      setProcessedContent(html as string);
      setError('');
    } catch (err) {
      setError('Failed to render markdown');
      console.error('Markdown rendering error:', err);
    }
  };

  const renderPlantUML = async (content: string) => {
    try {
      // Encode PlantUML using same pattern as Angular app:
      // 1. UTF-8 encode
      // 2. Deflate using pako
      // 3. Base64 encode
      // 4. Make URL-safe
      const pako = await import('pako');

      const textEncoder = new TextEncoder();
      const bytes = textEncoder.encode(content);

      // Deflate the bytes
      const deflated = pako.deflate(bytes);

      // Convert to binary string
      const binaryString = Array.from(deflated)
        .map((byte) => String.fromCharCode(byte))
        .join('');

      // Base64 encode
      const base64 = btoa(binaryString);

      // Make URL safe
      const urlSafe = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Use kroki.io service (same as Angular app)
      setProcessedContent(`https://kroki.io/plantuml/svg/${urlSafe}`);
      setError('');
    } catch (err) {
      setError('Failed to encode PlantUML diagram');
      console.error('PlantUML encoding error:', err);
    }
  };

  if (previewType === 'none') {
    return (
      <div className="flex items-center justify-center h-full bg-muted/10">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No preview available for this file type</p>
          <p className="text-sm mt-2">Supported: HTML, Markdown, PlantUML, Org-mode</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-destructive/10">
        <div className="text-center text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background">
      {previewType === 'html' && (
        <HtmlPreview content={processedContent} />
      )}
      {previewType === 'markdown' && (
        <MarkdownPreview content={processedContent} />
      )}
      {previewType === 'plantuml' && (
        <PlantUMLPreview url={processedContent} />
      )}
      {previewType === 'orgmode' && (
        <OrganicePreview content={processedContent} fileName={fileName} />
      )}
    </div>
  );
}

// HTML Preview Component (sandboxed iframe)
function HtmlPreview({ content }: { content: string }) {
  return (
    <div className="w-full h-full p-4">
      <iframe
        srcDoc={content}
        sandbox="allow-same-origin"
        className="w-full h-full border border-border rounded-lg"
        title="HTML Preview"
      />
    </div>
  );
}

// Markdown Preview Component (rendered HTML)
function MarkdownPreview({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none p-6 dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// PlantUML Preview Component (iframe with kroki.io)
function PlantUMLPreview({ url }: { url: string }) {
  const [showExternal, setShowExternal] = useState(false);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <span className="text-sm text-muted-foreground">PlantUML Diagram</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank')}
        >
          View in Browser
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <iframe
          src={url}
          className="w-full h-full border border-border rounded-lg"
          title="PlantUML Diagram"
        />
      </div>
    </div>
  );
}

// Org-mode Preview Component (using orga parser)
function OrganicePreview({ content, fileName }: { content: string; fileName: string }) {
  // Dynamic import to avoid SSR issues
  const [OrgRenderer, setOrgRenderer] = useState<any>(null);

  useEffect(() => {
    import('@/components/OrgRenderer').then(mod => {
      setOrgRenderer(() => mod.OrgRenderer);
    });
  }, []);

  if (!OrgRenderer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading Org-mode renderer...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50 sticky top-0 z-10">
        <span className="text-sm font-semibold">Org-mode File: {fileName}</span>
      </div>
      <div className="flex-1 overflow-auto">
        <OrgRenderer content={content} />
      </div>
    </div>
  );
}
