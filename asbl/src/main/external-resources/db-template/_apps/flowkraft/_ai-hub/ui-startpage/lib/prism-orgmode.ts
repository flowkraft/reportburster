import Prism from 'prismjs';

// Custom Org-mode language definition for Prism.js
// Colors defined in prism-orgmode.css (Emacs-inspired on dark background)

Prism.languages.orgmode = {
  // Comments (lines starting with # but NOT #+)
  'comment': {
    pattern: /^#(?!\+).*/m,
    greedy: true
  },

  // Metadata lines (#+TITLE:, #+AUTHOR:, #+DATE:, #+STARTUP:, etc.)
  'org-meta': {
    pattern: /^#\+\w+:.*$/m,
    greedy: true,
    inside: {
      'org-meta-key': /^#\+\w+:/,
    }
  },

  // Source blocks (#+BEGIN_SRC ... #+END_SRC)
  'org-block': {
    pattern: /^#\+BEGIN_SRC[\s\S]*?^#\+END_SRC/m,
    greedy: true,
    inside: {
      'org-block-keyword': /^#\+(?:BEGIN_SRC|END_SRC)\b.*/m,
    }
  },

  // Other blocks (#+BEGIN_QUOTE, #+BEGIN_EXAMPLE, etc.)
  'org-block-keyword': {
    pattern: /^#\+(?:BEGIN|END)_\w+.*$/m,
    greedy: true
  },

  // Headings (*, **, ***, etc.)
  'org-heading': {
    pattern: /^\*+\s+.+$/m,
    greedy: true,
    inside: {
      'org-heading-star': /^\*+/,
      'org-todo': /\b(?:TODO|NEXT|STARTED|IN PROGRESS|WAITING|HOLD)\b/,
      'org-done': /\b(?:DONE|CANCELLED)\b/,
      'org-heading-tag': /:\w+:(?=\s*$)/,
      'org-priority': /\[#[A-Z]\]/,
    }
  },

  // Schedule/deadline keywords
  'keyword': [
    /\b(?:SCHEDULED|DEADLINE|CLOSED)\b/
  ],

  // Properties and drawers
  'org-drawer': {
    pattern: /^:(?:PROPERTIES|END|LOGBOOK|DRAWER):|^\s*:[A-Z_]+:.*$/m,
    greedy: true
  },

  // Links [[url][text]]
  'org-link': {
    pattern: /\[\[.*?\]\]|\[\[.*?\]\[.*?\]\]/,
    greedy: true,
    inside: {
      'punctuation': /\[\[|\]\]|\]\[/,
    }
  },

  // Inline code (=code= or ~code~)
  'org-code': {
    pattern: /=(?!\s)[^=\n]*?(?!\s)=|~(?!\s)[^~\n]*?(?!\s)~/,
    greedy: true
  },

  // Bold
  'org-bold': {
    pattern: /\*(?!\s)(?:[^*\n])*?(?!\s)\*/,
    greedy: true
  },

  // Italic
  'org-italic': {
    pattern: /\/(?!\s)(?:[^\/\n]|\/\/)*?(?!\s)\//,
    greedy: true
  },

  // Underline
  'org-underline': {
    pattern: /_(?!\s)(?:[^_\n]|__)*?(?!\s)_/,
    greedy: true
  },

  // List markers (-, +, numbers)
  'org-list-marker': {
    pattern: /^\s*(?:[-+]|\d+[.)])\s/m,
    greedy: true
  },

  // Timestamps
  'org-timestamp': {
    pattern: /<\d{4}-\d{2}-\d{2}(?:\s+\w+)?(?:\s+\d{2}:\d{2})?(?:-\d{2}:\d{2})?>/,
    greedy: true
  },

  // Checkboxes
  'org-checkbox': {
    pattern: /\[[ X-]\]/,
    greedy: true
  },

  // Table separators
  'org-table-sep': {
    pattern: /^\s*\|[-+]+\|/m,
    greedy: true
  },

  // Horizontal rules
  'org-hr': {
    pattern: /^-{5,}$/m,
    greedy: true
  },

  // Tags :tag:
  'org-tag': {
    pattern: /:\w+:/,
    greedy: true
  },

  // Punctuation
  'punctuation': /[[\](){}|]/
};

// Add alias
Prism.languages.org = Prism.languages.orgmode;

export default Prism.languages.orgmode;
