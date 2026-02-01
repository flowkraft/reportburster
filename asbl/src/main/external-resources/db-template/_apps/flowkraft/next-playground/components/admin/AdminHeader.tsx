"use client"

import { Sun, Moon, Bell, Search, User } from "lucide-react"
import { useEffect, useState } from "react"
import { ThemeSelector } from "@/components/ThemeSelector"
import { applyTheme } from "@/lib/themes"
import Link from "next/link"

export function AdminHeader() {
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedMode = localStorage.getItem("rb-theme") as "light" | "dark"
    if (savedMode) {
      setMode(savedMode)
    }
  }, [])

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light"
    const currentTheme = localStorage.getItem("rb-color-theme") || "reportburster"

    setMode(newMode)
    document.documentElement.setAttribute("data-theme", newMode)
    
    // Also add/remove 'dark' class for Tailwind's dark: variant
    if (newMode === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    
    localStorage.setItem("rb-theme", newMode)
    applyTheme(currentTheme, newMode)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Panel</h1>
        
        {/* Search bar */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme Selector */}
        <ThemeSelector />

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* Light/Dark Mode Toggle */}
        <button
          onClick={toggleMode}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {mode === "light" ? (
            <Moon className="h-5 w-5 text-slate-500" />
          ) : (
            <Sun className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {/* Divider */}
        <div className="mx-2 h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* User menu */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-sm font-medium shadow-sm">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">ReportBurster</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
