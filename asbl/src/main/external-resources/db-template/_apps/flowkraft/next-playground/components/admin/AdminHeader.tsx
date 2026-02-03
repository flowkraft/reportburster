"use client"

import { Sun, Moon, User } from "lucide-react"
import { useEffect, useState } from "react"
import { ThemeSelector } from "@/components/ThemeSelector"
import { applyTheme } from "@/lib/themes"
import { setSetting, SETTING_KEYS } from "@/lib/settings"
import Link from "next/link"

export function AdminHeader() {
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Read from DOM (already set by ThemeProvider from SQLite)
    const currentMode = document.documentElement.classList.contains("dark") ? "dark" : "light"
    setMode(currentMode)
  }, [])

  const toggleMode = async () => {
    const newMode = mode === "light" ? "dark" : "light"
    const currentTheme = localStorage.getItem("rb-color-theme") || "reportburster"

    setMode(newMode)
    document.documentElement.setAttribute("data-theme", newMode)
    
    if (newMode === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    
    // Save to SQLite (primary storage)
    await setSetting(SETTING_KEYS.THEME_MODE, newMode, "theme", "Light or dark mode")
    
    // Also update localStorage for immediate reads
    localStorage.setItem("rb-theme", newMode)
    applyTheme(currentTheme, newMode)
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4">
      <h1 className="text-sm font-medium text-slate-700 dark:text-slate-200">Admin</h1>

      <div className="flex items-center gap-1">
        <ThemeSelector />

        <button
          onClick={toggleMode}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {mode === "light" ? (
            <Moon className="h-4 w-4 text-slate-500" />
          ) : (
            <Sun className="h-4 w-4 text-slate-400" />
          )}
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-600" />

        <Link
          href="/"
          className="flex items-center gap-2 rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-white text-xs">
            <User className="h-3 w-3" />
          </div>
          <span className="hidden sm:block text-xs text-slate-600 dark:text-slate-300">Exit</span>
        </Link>
      </div>
    </header>
  )
}
