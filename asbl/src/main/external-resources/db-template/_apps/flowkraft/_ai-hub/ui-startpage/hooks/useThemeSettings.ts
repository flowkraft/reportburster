"use client"

import { useState, useEffect, useCallback } from "react"
import { applyTheme } from "@/lib/themes"

// Settings keys for theme (matches Grails Setting domain pattern)
const THEME_COLOR_KEY = "theme.color"
const THEME_MODE_KEY = "theme.mode"

// Default values
const DEFAULT_THEME = "reportburster"
const DEFAULT_MODE = "light" as const

type ThemeMode = "light" | "dark"

interface ThemeSettings {
  colorTheme: string
  mode: ThemeMode
  isLoading: boolean
  setColorTheme: (theme: string) => Promise<void>
  setMode: (mode: ThemeMode) => Promise<void>
  toggleMode: () => Promise<void>
}

// Helper to save setting to API (like Grails Setting.setValue())
async function saveSetting(key: string, value: string): Promise<void> {
  try {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, description: `Theme setting: ${key}` }),
    })
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error)
  }
}

// Helper to load setting from API (like Grails Setting.getValue())
async function loadSetting(key: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/config?key=${encodeURIComponent(key)}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.config?.value || null
  } catch (error) {
    console.error(`Failed to load setting ${key}:`, error)
    return null
  }
}

export function useThemeSettings(): ThemeSettings {
  const [colorTheme, setColorThemeState] = useState(DEFAULT_THEME)
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from API on mount
  useEffect(() => {
    async function loadThemeSettings() {
      setIsLoading(true)
      try {
        const [savedTheme, savedMode] = await Promise.all([
          loadSetting(THEME_COLOR_KEY),
          loadSetting(THEME_MODE_KEY),
        ])

        const theme = savedTheme || DEFAULT_THEME
        const themeMode = (savedMode as ThemeMode) || DEFAULT_MODE

        setColorThemeState(theme)
        setModeState(themeMode)

        // Apply theme immediately
        document.documentElement.setAttribute("data-theme", themeMode)
        if (themeMode === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
        applyTheme(theme, themeMode)
      } catch (error) {
        console.error("Failed to load theme settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadThemeSettings()
  }, [])

  // Save color theme
  const setColorTheme = useCallback(async (theme: string) => {
    setColorThemeState(theme)
    applyTheme(theme, mode)
    await saveSetting(THEME_COLOR_KEY, theme)
  }, [mode])

  // Save mode
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode)
    document.documentElement.setAttribute("data-theme", newMode)
    if (newMode === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    applyTheme(colorTheme, newMode)
    await saveSetting(THEME_MODE_KEY, newMode)
  }, [colorTheme])

  // Toggle between light and dark
  const toggleMode = useCallback(async () => {
    const newMode = mode === "light" ? "dark" : "light"
    await setMode(newMode)
  }, [mode, setMode])

  return {
    colorTheme,
    mode,
    isLoading,
    setColorTheme,
    setMode,
    toggleMode,
  }
}
