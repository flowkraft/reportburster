"use client"

import { useEffect, useState } from "react"
import { applyTheme } from "@/lib/themes"

// Settings keys for theme (must match useThemeSettings.ts)
const THEME_COLOR_KEY = "theme.color"
const THEME_MODE_KEY = "theme.mode"
const DEFAULT_THEME = "reportburster"
const DEFAULT_MODE = "light"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function loadThemeFromDB() {
      try {
        // Fetch both theme settings in parallel
        const [colorRes, modeRes] = await Promise.all([
          fetch(`/api/settings?key=${encodeURIComponent(THEME_COLOR_KEY)}`),
          fetch(`/api/settings?key=${encodeURIComponent(THEME_MODE_KEY)}`),
        ])

        const colorData = colorRes.ok ? await colorRes.json() : null
        const modeData = modeRes.ok ? await modeRes.json() : null

        const savedTheme = colorData?.value || DEFAULT_THEME
        const savedMode = modeData?.value || DEFAULT_MODE

        // Apply theme immediately
        document.documentElement.setAttribute("data-theme", savedMode)
        if (savedMode === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
        applyTheme(savedTheme, savedMode)
      } catch (error) {
        console.error("Failed to load theme from database:", error)
        // Fall back to defaults
        document.documentElement.setAttribute("data-theme", DEFAULT_MODE)
        applyTheme(DEFAULT_THEME, DEFAULT_MODE)
      } finally {
        setIsLoaded(true)
      }
    }

    loadThemeFromDB()
  }, [])

  // Show nothing until theme is loaded to prevent flash
  if (!isLoaded) {
    return null
  }

  return <>{children}</>
}
