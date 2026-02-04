"use client"

import { useState } from "react"
import { Check, Palette } from "lucide-react"
import { themes } from "@/lib/themes"
import { useThemeSettings } from "@/hooks/useThemeSettings"

export function ThemeSelector() {
  const { colorTheme, setColorTheme, isLoading } = useThemeSettings()
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = async (themeName: string) => {
    await setColorTheme(themeName)
    setIsOpen(false)
  }

  const currentThemeLabel = themes.find((t) => t.name === colorTheme)?.label || "ReportBurster"

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400">
        <Palette className="w-4 h-4 animate-pulse" />
        <span className="hidden md:inline">Loading...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white rounded-md transition-colors"
        aria-label="Select theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden md:inline">{currentThemeLabel}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                Color Theme
              </div>
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeChange(theme.name)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="text-card-foreground">{theme.label}</span>
                  {colorTheme === theme.name && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
