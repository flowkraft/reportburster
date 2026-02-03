"use client"

import { useState, useEffect, useCallback } from "react"

interface Setting {
  id?: number
  key: string
  value: string | null
  category?: string
  description?: string
}

// Hook to manage settings with SQLite persistence
export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Load all settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data: Setting[] = await res.json()
        const settingsMap: Record<string, string> = {}
        data.forEach((s) => {
          if (s.value !== null) {
            settingsMap[s.key] = s.value
          }
        })
        setSettings(settingsMap)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSetting = useCallback((key: string, defaultValue: string = ""): string => {
    return settings[key] ?? defaultValue
  }, [settings])

  const setSetting = useCallback(async (key: string, value: string, category: string = "general"): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, category }),
      })
      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }))
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to save setting:", error)
      return false
    }
  }, [])

  const bulkSetSettings = useCallback(async (settingsData: { key: string; value: string; category?: string }[]): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsData }),
      })
      if (res.ok) {
        const updates: Record<string, string> = {}
        settingsData.forEach((s) => {
          updates[s.key] = s.value
        })
        setSettings((prev) => ({ ...prev, ...updates }))
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to bulk save settings:", error)
      return false
    }
  }, [])

  return {
    settings,
    loading,
    getSetting,
    setSetting,
    bulkSetSettings,
    refresh: loadSettings,
  }
}

// Simple hook for theme specifically
export function useThemeSetting() {
  const [theme, setThemeState] = useState<"light" | "dark">("light")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      // First check localStorage for immediate display
      const localTheme = localStorage.getItem("rb-theme") as "light" | "dark" | null
      if (localTheme) {
        setThemeState(localTheme)
        document.documentElement.setAttribute("data-theme", localTheme)
      }

      // Then sync from server
      const res = await fetch("/api/settings?key=preferences.theme")
      if (res.ok) {
        const data = await res.json()
        if (data.value) {
          const serverTheme = data.value as "light" | "dark"
          setThemeState(serverTheme)
          localStorage.setItem("rb-theme", serverTheme)
          document.documentElement.setAttribute("data-theme", serverTheme)
        }
      }
    } catch (error) {
      console.error("Failed to load theme:", error)
    } finally {
      setLoaded(true)
    }
  }

  const setTheme = async (newTheme: "light" | "dark") => {
    setThemeState(newTheme)
    localStorage.setItem("rb-theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)

    // Persist to SQLite
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "preferences.theme",
          value: newTheme,
          category: "preferences",
        }),
      })
    } catch (error) {
      console.error("Failed to save theme:", error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  return { theme, setTheme, toggleTheme, loaded }
}
