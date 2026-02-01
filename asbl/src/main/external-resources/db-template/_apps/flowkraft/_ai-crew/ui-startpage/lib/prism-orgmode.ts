import Prism from 'prismjs';

// Custom Org-mode language definition for Prism.js
// Reference: https://orgmode.org/manual/

Prism.languages.orgmode = {
  // Comments
  'comment': {
    pattern: /^#.*/m,
    greedy: true
  },

  // Headings (*, **, ***, etc.)
  'heading': {
    pattern: /^\*+\s+.+$/m,
    inside: {
      'punctuation': /^\*+/,
      'keyword': /\b(?:TODO|DONE|NEXT|WAITING|HOLD|CANCELLED|STARTED|IN PROGRESS)\b/
    }
  },

  // TODO keywords
  'keyword': [
    /\b(?:TODO|DONE|NEXT|WAITING|HOLD|CANCELLED|STARTED|IN PROGRESS)\b/,
    /\b(?:SCHEDULED|DEADLINE|CLOSED)\b/
  ],

  // Properties and drawers
  'property': {
    pattern: /^:(?:PROPERTIES|END|LOGBOOK|DRAWER):|^\s*:[A-Z_]+:.*$/m,
    greedy: true
  },

  // Tags
  'tag': {
    pattern: /:\w+:/,
    greedy: true
  },

  // Links
  'url': {
    pattern: /\[\[.*?\]\]|\[\[.*?\]\[.*?\]\]/,
    inside: {
      'punctuation': /\[\[|\]\]|\]\[/
    }
  },

  // Code blocks
  'code-block': {
    pattern: /^#\+BEGIN_SRC[\s\S]*?^#\+END_SRC/m,
    inside: {
      'keyword': /^#\+(?:BEGIN_SRC|END_SRC)\b/,
      'language': /\w+/
    }
  },

  // Inline code
  'code': {
    pattern: /=.*?=|~.*?~/,
    greedy: true
  },

  // Bold, italic, underline
  'bold': {
    pattern: /\*\*?(?!\s)(?:[^\*\n]|\*\*?)*?\*\*?/,
    greedy: true
  },
  'italic': {
    pattern: /\/(?!\s)(?:[^\/\n]|\/\/)*?\//,
    greedy: true
  },
  'underline': {
    pattern: /_(?!\s)(?:[^_\n]|__)*?_/,
    greedy: true
  },

  // Lists (-, +, *, numbers)
  'list': {
    pattern: /^\s*(?:[-+*]|\d+[.)])\s+/m,
    greedy: true
  },

  // Timestamps
  'timestamp': {
    pattern: /<\d{4}-\d{2}-\d{2}(?:\s+\w+)?(?:\s+\d{2}:\d{2})?(?:-\d{2}:\d{2})?>/,
    greedy: true
  },

  // Checkboxes
  'checkbox': {
    pattern: /\[[ X-]\]/,
    greedy: true
  },

  // Special blocks
  'block-keyword': {
    pattern: /^#\+(?:BEGIN|END)_\w+/m,
    greedy: true
  },

  // Punctuation
  'punctuation': /[[\](){}]/
};

// Add alias for 'org' to use the same definition
Prism.languages.org = Prism.languages.orgmode;

export default Prism.languages.orgmode;
