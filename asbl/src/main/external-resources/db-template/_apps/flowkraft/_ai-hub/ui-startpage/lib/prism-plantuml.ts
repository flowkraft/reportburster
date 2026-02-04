import Prism from 'prismjs';

// Custom PlantUML language definition for Prism.js
// Focuses on WBS (Work Breakdown Structure) diagrams
// Reference: https://plantuml.com/wbs-diagram

Prism.languages.plantuml = {
  // Comments
  'comment': {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:').*)/,
    lookbehind: true,
    greedy: true
  },

  // String literals
  'string': {
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true
  },

  // WBS-specific keywords and directives
  'keyword': [
    // Start/end blocks
    /@startwbs\b/,
    /@endwbs\b/,
    /@startuml\b/,
    /@enduml\b/,

    // Other diagram types
    /@startmindmap\b/,
    /@endmindmap\b/,

    // Common keywords
    /\b(?:title|header|footer|caption|legend|note|skinparam|scale|hide|show|left|right|top|bottom|center)\b/,

    // Styling
    /\b(?:backgroundColor|fontColor|fontSize|fontName|lineColor|lineStyle|lineThickness)\b/,

    // Special markers for WBS
    /\b(?:as|is|of|to)\b/
  ],

  // WBS hierarchy markers (*, **, ***, etc.)
  'operator': {
    pattern: /^\s*(\*+|_+|\++|-+)/m,
    greedy: true
  },

  // Colors and styles
  'color': {
    pattern: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/,
    greedy: true
  },

  // Special characters and symbols
  'punctuation': /[{}[\]();,.<>]/,

  // Arrows and connections
  'arrow': {
    pattern: /(?:-->|<--|->|<-|-|-\[.*?\]->|<-\[.*?\]-)/,
    greedy: true
  },

  // Numbers
  'number': /\b\d+(?:\.\d+)?\b/,

  // Preprocessor directives
  'preprocessor': {
    pattern: /!(?:include|define|undef|ifdef|ifndef|if|else|endif|pragma)\b/,
    greedy: true
  },

  // Actors and participants (for sequence diagrams)
  'class-name': {
    pattern: /\b(?:actor|participant|boundary|control|entity|database|collections)\b/,
    greedy: true
  }
};

// Add alias for 'uml' to use the same definition
Prism.languages.uml = Prism.languages.plantuml;

export default Prism.languages.plantuml;
