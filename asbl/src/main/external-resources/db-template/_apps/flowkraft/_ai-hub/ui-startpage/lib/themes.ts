// Theme configuration for shadcn/ui based color schemes
// Each theme includes light and dark mode with excellent text contrast
// Palette: blue-tinted zinc neutrals, blue primary — matching reportburster.com

export type Theme = {
  name: string;
  label: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const themes: Theme[] = [
  {
    name: "datapallas",
    label: "DataPallas",
    cssVars: {
      light: {
        background: "#ffffff",
        foreground: "#0a0a0f",
        card: "#ffffff",
        "card-foreground": "#0a0a0f",
        popover: "#ffffff",
        "popover-foreground": "#0a0a0f",
        primary: "#3b82f6",
        "primary-foreground": "#fafafa",
        secondary: "#f5f5f6",
        "secondary-foreground": "#18181b",
        muted: "#f5f5f6",
        "muted-foreground": "#6e6e78",
        accent: "#f5f5f6",
        "accent-foreground": "#18181b",
        destructive: "#dc2626",
        "destructive-foreground": "#ffffff",
        border: "#e4e4ea",
        input: "#e4e4ea",
        ring: "#3b82f6",
        // Semantic: chat
        "chat-user-bg": "#3b82f6",
        "chat-user-fg": "#ffffff",
        "chat-assistant-bg": "#f5f5f6",
        "chat-assistant-fg": "#18181b",
        "chat-avatar-bg": "#6d28d9",
        // Semantic: code blocks
        "code-bg": "#1e1e2e",
        "code-fg": "#cdd6f4",
        // Semantic: tags
        "tag-bg": "#f0fdf4",
        "tag-fg": "#15803d",
        "tag-border": "#bbf7d0",
        // Semantic: Athena identity
        "athena-accent": "#6d28d9",
      },
      dark: {
        background: "#0a0a0f",
        foreground: "#fafafa",
        card: "#19191e",
        "card-foreground": "#fafafa",
        popover: "#19191e",
        "popover-foreground": "#fafafa",
        primary: "#3b82f6",
        "primary-foreground": "#18181b",
        secondary: "#282830",
        "secondary-foreground": "#fafafa",
        muted: "#282830",
        "muted-foreground": "#a0a0ac",
        accent: "#282830",
        "accent-foreground": "#fafafa",
        destructive: "#b33b3b",
        "destructive-foreground": "#fafafa",
        border: "#282830",
        input: "#2e2e38",
        ring: "#3b82f6",
        // Semantic: chat
        "chat-user-bg": "#1e40af",
        "chat-user-fg": "#dbeafe",
        "chat-assistant-bg": "#282830",
        "chat-assistant-fg": "#e4e4e7",
        "chat-avatar-bg": "#7c3aed",
        // Semantic: code blocks
        "code-bg": "#1e1e2e",
        "code-fg": "#cdd6f4",
        // Semantic: tags
        "tag-bg": "#052e16",
        "tag-fg": "#4ade80",
        "tag-border": "#14532d",
        // Semantic: Athena identity
        "athena-accent": "#a78bfa",
      },
    },
  },
  {
    name: "blue",
    label: "Blue",
    cssVars: {
      light: {
        background: "#ffffff",
        foreground: "#0a0a0f",
        card: "#ffffff",
        "card-foreground": "#0a0a0f",
        popover: "#ffffff",
        "popover-foreground": "#0a0a0f",
        primary: "#60a5fa",
        "primary-foreground": "#0a0a0f",
        secondary: "#f5f5f6",
        "secondary-foreground": "#18181b",
        muted: "#f5f5f6",
        "muted-foreground": "#6e6e78",
        accent: "#f5f5f6",
        "accent-foreground": "#18181b",
        destructive: "#dc2626",
        "destructive-foreground": "#ffffff",
        border: "#e4e4ea",
        input: "#e4e4ea",
        ring: "#60a5fa",
        // Semantic: chat (lighter blue)
        "chat-user-bg": "#60a5fa",
        "chat-user-fg": "#0a0a0f",
        "chat-assistant-bg": "#f5f5f6",
        "chat-assistant-fg": "#18181b",
        "chat-avatar-bg": "#6d28d9",
        // Semantic: code blocks
        "code-bg": "#1e1e2e",
        "code-fg": "#cdd6f4",
        // Semantic: tags
        "tag-bg": "#f0fdf4",
        "tag-fg": "#15803d",
        "tag-border": "#bbf7d0",
        // Semantic: Athena identity
        "athena-accent": "#6d28d9",
      },
      dark: {
        background: "#0a0a0f",
        foreground: "#fafafa",
        card: "#19191e",
        "card-foreground": "#fafafa",
        popover: "#19191e",
        "popover-foreground": "#fafafa",
        primary: "#60a5fa",
        "primary-foreground": "#0a0a0f",
        secondary: "#282830",
        "secondary-foreground": "#fafafa",
        muted: "#282830",
        "muted-foreground": "#a0a0ac",
        accent: "#282830",
        "accent-foreground": "#fafafa",
        destructive: "#b33b3b",
        "destructive-foreground": "#fafafa",
        border: "#282830",
        input: "#2e2e38",
        ring: "#60a5fa",
        // Semantic: chat (lighter blue)
        "chat-user-bg": "#2563eb",
        "chat-user-fg": "#dbeafe",
        "chat-assistant-bg": "#282830",
        "chat-assistant-fg": "#e4e4e7",
        "chat-avatar-bg": "#7c3aed",
        // Semantic: code blocks
        "code-bg": "#1e1e2e",
        "code-fg": "#cdd6f4",
        // Semantic: tags
        "tag-bg": "#052e16",
        "tag-fg": "#4ade80",
        "tag-border": "#14532d",
        // Semantic: Athena identity
        "athena-accent": "#a78bfa",
      },
    },
  },
]

export function applyTheme(themeName: string, mode: "light" | "dark") {
  const theme = themes.find((t) => t.name === themeName)
  if (!theme) return

  const root = document.documentElement
  const colors = theme.cssVars[mode]

  // Toggle the 'dark' class for Tailwind's dark: variant
  if (mode === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }

  // Also set data-theme attribute
  root.setAttribute("data-theme", mode)

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}
