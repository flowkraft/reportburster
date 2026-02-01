'use client';

import { useEffect, useState } from 'react';
import { parse } from 'orga';

interface OrgRendererProps {
  content: string;
}

// Org-mode node types
interface OrgNode {
  type: string;
  children?: OrgNode[];
  value?: string;
  level?: number;
  todo?: string;
  priority?: string;
  tags?: string[];
  marker?: string;
  key?: string;
  title?: OrgNode;
  name?: string;
  keyword?: string;
  [key: string]: any;
}

export function OrgRenderer({ content }: OrgRendererProps) {
  const [ast, setAst] = useState<OrgNode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      const parsedAst = parse(content);
      setAst(parsedAst as OrgNode);
      setError('');
    } catch (err) {
      setError('Failed to parse Org-mode content');
      console.error('Org parsing error:', err);
    }
  }, [content]);

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-lg">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!ast) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading Org-mode content...
      </div>
    );
  }

  return (
    <div className="org-mode-content p-6 max-w-4xl">
      <style jsx>{`
        .org-mode-content {
          font-family: 'Courier New', monospace;
          line-height: 1.6;
        }

        /* Headings - Emacs org-mode style */
        .org-headline {
          margin: 1.5em 0 0.5em 0;
          font-weight: bold;
        }

        .org-headline-1 {
          font-size: 1.5em;
          color: #4169E1; /* Royal Blue */
        }

        .org-headline-2 {
          font-size: 1.3em;
          color: #B8860B; /* Dark Goldenrod */
        }

        .org-headline-3 {
          font-size: 1.15em;
          color: #8B4789; /* Purple */
        }

        .org-headline-4 {
          font-size: 1.05em;
          color: #CD5C5C; /* Indian Red */
        }

        .org-headline-5 {
          font-size: 1em;
          color: #20B2AA; /* Light Sea Green */
        }

        .org-headline-6 {
          font-size: 1em;
          color: #8B4513; /* Saddle Brown */
        }

        /* TODO Keywords - Emacs org-mode style */
        .org-todo {
          font-weight: bold;
          padding: 2px 6px;
          margin-right: 8px;
          border-radius: 3px;
          font-size: 0.9em;
        }

        .org-todo-TODO {
          color: #FF0000;
          background-color: rgba(255, 0, 0, 0.1);
        }

        .org-todo-DONE {
          color: #228B22;
          background-color: rgba(34, 139, 34, 0.1);
        }

        .org-todo-NEXT {
          color: #FF8C00;
          background-color: rgba(255, 140, 0, 0.1);
        }

        .org-todo-WAITING {
          color: #4169E1;
          background-color: rgba(65, 105, 225, 0.1);
        }

        .org-todo-HOLD {
          color: #8B4789;
          background-color: rgba(139, 71, 137, 0.1);
        }

        .org-todo-CANCELLED {
          color: #808080;
          background-color: rgba(128, 128, 128, 0.1);
          text-decoration: line-through;
        }

        .org-todo-STARTED,
        .org-todo-IN-PROGRESS {
          color: #FF8C00;
          background-color: rgba(255, 140, 0, 0.1);
        }

        /* Priority - Emacs style */
        .org-priority {
          color: #FF0000;
          font-weight: bold;
          margin-right: 8px;
        }

        /* Tags - Emacs style */
        .org-tags {
          float: right;
          color: #20B2AA;
          font-size: 0.85em;
        }

        .org-tag {
          margin-left: 4px;
        }

        /* Emphasis */
        .org-italic {
          font-style: italic;
          color: #4169E1;
        }

        .org-bold {
          font-weight: bold;
        }

        .org-code {
          font-family: 'Courier New', monospace;
          background-color: rgba(128, 128, 128, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
          color: #8B4513;
        }

        .org-verbatim {
          font-family: 'Courier New', monospace;
          background-color: rgba(128, 128, 128, 0.15);
          padding: 2px 4px;
          border-radius: 3px;
        }

        .org-strikethrough {
          text-decoration: line-through;
          color: #808080;
        }

        .org-underline {
          text-decoration: underline;
        }

        /* Lists */
        .org-list {
          margin: 0.5em 0;
          padding-left: 2em;
        }

        .org-list-item {
          margin: 0.25em 0;
        }

        /* Checkboxes - Emacs style */
        .org-checkbox {
          margin-right: 6px;
          font-weight: bold;
        }

        .org-checkbox-unchecked {
          color: #FF0000;
        }

        .org-checkbox-checked {
          color: #228B22;
        }

        .org-checkbox-partial {
          color: #FF8C00;
        }

        /* Links */
        .org-link {
          color: #4169E1;
          text-decoration: underline;
          cursor: pointer;
        }

        .org-link:hover {
          color: #1E90FF;
        }

        /* Source blocks */
        .org-src-block {
          background-color: rgba(128, 128, 128, 0.1);
          border: 1px solid rgba(128, 128, 128, 0.3);
          border-radius: 4px;
          padding: 1em;
          margin: 1em 0;
          overflow-x: auto;
        }

        .org-src-block-header {
          color: #808080;
          font-size: 0.85em;
          margin-bottom: 0.5em;
        }

        /* Drawers */
        .org-drawer {
          background-color: rgba(128, 128, 128, 0.05);
          border-left: 3px solid rgba(128, 128, 128, 0.3);
          padding: 0.5em 1em;
          margin: 0.5em 0;
          font-size: 0.9em;
          color: #808080;
        }

        /* Timestamps */
        .org-timestamp {
          color: #8B4789;
          font-family: 'Courier New', monospace;
          background-color: rgba(139, 71, 137, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
        }

        /* Paragraphs */
        .org-paragraph {
          margin: 0.5em 0;
        }

        /* Sections */
        .org-section {
          margin-bottom: 1em;
        }
      `}</style>
      {renderNode(ast)}
    </div>
  );
}

function renderNode(node: OrgNode, key?: string): React.ReactNode {
  if (!node) return null;

  const nodeKey = key || node.key || Math.random().toString(36);

  switch (node.type) {
    case 'root':
      return (
        <div key={nodeKey} className="org-root">
          {node.children?.map((child, i) => renderNode(child, `root-${i}`))}
        </div>
      );

    case 'headline':
      return (
        <div key={nodeKey} className="org-section">
          <div className={`org-headline org-headline-${node.level || 1}`}>
            {/* Stars (not shown in visual output, but represents hierarchy) */}
            <span className="org-stars" style={{ marginRight: '8px' }}>
              {'*'.repeat(node.level || 1)}
            </span>

            {/* TODO keyword */}
            {node.todo && (
              <span className={`org-todo org-todo-${node.todo.replace(/\s+/g, '-')}`}>
                {node.todo}
              </span>
            )}

            {/* Priority */}
            {node.priority && (
              <span className="org-priority">[#{node.priority}]</span>
            )}

            {/* Title */}
            <span className="org-title">
              {node.title ? renderNode(node.title, `${nodeKey}-title`) : ''}
            </span>

            {/* Tags */}
            {node.tags && node.tags.length > 0 && (
              <span className="org-tags">
                :{node.tags.map((tag, i) => (
                  <span key={i} className="org-tag">{tag}:</span>
                ))}
              </span>
            )}
          </div>

          {/* Children content */}
          {node.children && (
            <div className="org-headline-content" style={{ marginLeft: `${(node.level || 1) * 1}em` }}>
              {node.children.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
            </div>
          )}
        </div>
      );

    case 'section':
      return (
        <div key={nodeKey} className="org-section">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </div>
      );

    case 'paragraph':
      return (
        <p key={nodeKey} className="org-paragraph">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </p>
      );

    case 'text':
      return <span key={nodeKey}>{node.value}</span>;

    case 'emphasis':
      return (
        <span key={nodeKey} className="org-italic">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </span>
      );

    case 'bold':
      return (
        <strong key={nodeKey} className="org-bold">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </strong>
      );

    case 'code':
      return (
        <code key={nodeKey} className="org-code">
          {node.value}
        </code>
      );

    case 'verbatim':
      return (
        <code key={nodeKey} className="org-verbatim">
          {node.value}
        </code>
      );

    case 'strikethrough':
      return (
        <span key={nodeKey} className="org-strikethrough">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </span>
      );

    case 'underline':
      return (
        <span key={nodeKey} className="org-underline">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </span>
      );

    case 'list':
      const ListTag = node.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={nodeKey} className="org-list">
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </ListTag>
      );

    case 'list.item':
      // Parse checkbox from content if present
      let checkbox = null;
      let itemChildren = node.children;

      if (itemChildren && itemChildren.length > 0) {
        const firstChild = itemChildren[0];
        if (firstChild.type === 'text' && firstChild.value) {
          const checkboxMatch = firstChild.value.match(/^\s*\[([ X-])\]\s*/);
          if (checkboxMatch) {
            const checkState = checkboxMatch[1];
            checkbox = (
              <span className={`org-checkbox org-checkbox-${
                checkState === 'X' ? 'checked' :
                checkState === '-' ? 'partial' :
                'unchecked'
              }`}>
                [{checkState}]
              </span>
            );
            // Remove checkbox from text
            const newValue = firstChild.value.replace(/^\s*\[[ X-]\]\s*/, '');
            itemChildren = [
              { ...firstChild, value: newValue },
              ...itemChildren.slice(1)
            ];
          }
        }
      }

      return (
        <li key={nodeKey} className="org-list-item">
          {checkbox}
          {itemChildren?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </li>
      );

    case 'link':
      return (
        <a
          key={nodeKey}
          href={node.uri || '#'}
          className="org-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`)) || node.uri}
        </a>
      );

    case 'src_block':
    case 'src.block':
      return (
        <div key={nodeKey} className="org-src-block">
          {node.language && (
            <div className="org-src-block-header">
              {node.language}
            </div>
          )}
          <pre><code>{node.value}</code></pre>
        </div>
      );

    case 'drawer':
      return (
        <div key={nodeKey} className="org-drawer">
          <div className="org-drawer-name">:{node.name}:</div>
          {node.children?.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
        </div>
      );

    case 'timestamp':
      return (
        <span key={nodeKey} className="org-timestamp">
          {node.value || node.raw}
        </span>
      );

    case 'keyword':
      // Skip keywords like #+TITLE:, #+AUTHOR:, etc. in display
      return null;

    case 'block':
      // Generic block (quote, example, etc.)
      return (
        <div key={nodeKey} className="org-block">
          <pre>{node.value}</pre>
        </div>
      );

    case 'newline':
      return <br key={nodeKey} />;

    default:
      // For unhandled node types, try to render children
      if (node.children) {
        return (
          <div key={nodeKey} data-org-type={node.type}>
            {node.children.map((child, i) => renderNode(child, `${nodeKey}-${i}`))}
          </div>
        );
      }
      // Fallback for text content
      if (node.value) {
        return <span key={nodeKey}>{node.value}</span>;
      }
      return null;
  }
}
