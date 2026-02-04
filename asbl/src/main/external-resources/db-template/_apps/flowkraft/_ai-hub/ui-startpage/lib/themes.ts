// Theme configuration for shadcn/ui based color schemes
// Each theme includes light and dark mode with excellent text contrast

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
    name: "reportburster",
    label: "ReportBurster",
    cssVars: {
      light: {
        background: "#fafafa",
        foreground: "#14203a",
        card: "#ffffff",
        "card-foreground": "#14203a",
        popover: "#ffffff",
        "popover-foreground": "#14203a",
        primary: "#22a7c8",
        "primary-foreground": "#ffffff",
        secondary: "#f1f5f9",
        "secondary-foreground": "#14203a",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        accent: "#22a7c8",
        "accent-foreground": "#ffffff",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#22a7c8",
      },
      dark: {
        background: "#0f172a",
        foreground: "#f8fafc",
        card: "#1e293b",
        "card-foreground": "#f8fafc",
        popover: "#1e293b",
        "popover-foreground": "#f8fafc",
        primary: "#22a7c8",
        "primary-foreground": "#ffffff",
        secondary: "#1e293b",
        "secondary-foreground": "#f8fafc",
        muted: "#1e293b",
        "muted-foreground": "#94a3b8",
        accent: "#22a7c8",
        "accent-foreground": "#ffffff",
        destructive: "#7f1d1d",
        "destructive-foreground": "#f8fafc",
        border: "#334155",
        input: "#334155",
        ring: "#22a7c8",
      },
    },
  },
  {
    name: "blue",
    label: "Blue",
    cssVars: {
      light: {
        background: "#ffffff",
        foreground: "#14203a",
        card: "#ffffff",
        "card-foreground": "#14203a",
        popover: "#ffffff",
        "popover-foreground": "#14203a",
        primary: "#3b82f6",
        "primary-foreground": "#ffffff",
        secondary: "#e0f2fe",
        "secondary-foreground": "#14203a",
        muted: "#e0f2fe",
        "muted-foreground": "#64748b",
        accent: "#e0f2fe",
        "accent-foreground": "#14203a",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#cbd5e1",
        input: "#cbd5e1",
        ring: "#3b82f6",
      },
      dark: {
        background: "#0f172a",
        foreground: "#f8fafc",
        card: "#0f172a",
        "card-foreground": "#f8fafc",
        popover: "#0f172a",
        "popover-foreground": "#f8fafc",
        primary: "#60a5fa",
        "primary-foreground": "#0f172a",
        secondary: "#1e3a5f",
        "secondary-foreground": "#f8fafc",
        muted: "#1e3a5f",
        "muted-foreground": "#94a3b8",
        accent: "#1e3a5f",
        "accent-foreground": "#f8fafc",
        destructive: "#7f1d1d",
        "destructive-foreground": "#f8fafc",
        border: "#1e3a5f",
        input: "#1e3a5f",
        ring: "#60a5fa",
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
