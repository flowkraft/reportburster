'use client';

import { useEffect, useState } from 'react';
import { FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  fileName: string;
  fileContent: string;
  language: string;
}

// Opens rendered content in a new browser tab (full-screen preview)
function openInBrowser(html: string, title: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function PreviewPanel({ fileName, fileContent, language }: PreviewPanelProps) {
  const [previewType, setPreviewType] = useState<'html' | 'plantuml' | 'none'>('none');
  const [processedContent, setProcessedContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const ext = fileName.toLowerCase().split('.').pop() || '';

    if (ext === 'html' || ext === 'htm') {
      setPreviewType('html');
      setProcessedContent(fileContent);
    } else if (ext === 'puml' || ext === 'plantuml' || ext === 'uml') {
      setPreviewType('plantuml');
      renderPlantUML(fileContent);
    } else {
      setPreviewType('none');
      setProcessedContent('');
    }
  }, [fileName, fileContent]);

  const renderPlantUML = async (content: string) => {
    try {
      const pako = await import('pako');

      const textEncoder = new TextEncoder();
      const bytes = textEncoder.encode(content);
      const deflated = pako.deflate(bytes);

      const binaryString = Array.from(deflated)
        .map((byte) => String.fromCharCode(byte))
        .join('');

      const base64 = btoa(binaryString);
      const urlSafe = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

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
          <p className="text-sm mt-2">Supported: HTML, PlantUML</p>
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
        <HtmlPreview content={processedContent} fileName={fileName} />
      )}
      {previewType === 'plantuml' && (
        <PlantUMLPreview url={processedContent} />
      )}
    </div>
  );
}

// Shared preview header bar with "View in Browser" button
function PreviewHeader({ label, onViewInBrowser }: { label: string; onViewInBrowser: () => void }) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50 sticky top-0 z-10">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewInBrowser}
      >
        <ExternalLink className="w-4 h-4 mr-1.5" />
        View in Browser
      </Button>
    </div>
  );
}

// HTML Preview Component
function HtmlPreview({ content, fileName }: { content: string; fileName: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      <PreviewHeader
        label="HTML Preview"
        onViewInBrowser={() => openInBrowser(content, fileName)}
      />
      <div className="flex-1 p-4 overflow-auto">
        <iframe
          srcDoc={content}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border border-border rounded-lg"
          title="HTML Preview"
        />
      </div>
    </div>
  );
}

// PlantUML Preview Component (iframe with kroki.io)
function PlantUMLPreview({ url }: { url: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      <PreviewHeader
        label="PlantUML Diagram"
        onViewInBrowser={() => window.open(url, '_blank')}
      />
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
