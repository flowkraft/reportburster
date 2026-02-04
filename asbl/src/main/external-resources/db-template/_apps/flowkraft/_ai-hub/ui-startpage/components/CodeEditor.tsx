'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';

// Import Prism core languages
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-groovy';

// Import our custom language definitions
import '../lib/prism-plantuml';
import '../lib/prism-orgmode';

// Import Prism theme
import 'prismjs/themes/prism-tomorrow.css';

interface CodeEditorProps {
  code: string;
  language: string;
  fileName: string;
}

export function CodeEditor({ code, language, fileName }: CodeEditorProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // Highlight the code
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <div className="h-full overflow-auto bg-[#2d2d2d]">
      <pre className="m-0 p-4 text-sm" style={{ background: 'transparent' }}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
