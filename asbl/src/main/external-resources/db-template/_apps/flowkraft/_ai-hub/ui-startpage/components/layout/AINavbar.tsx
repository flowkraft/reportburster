"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Sun, Moon, Settings, Rocket } from "lucide-react"
import { applyTheme } from "@/lib/themes"
import { setSetting, getSetting, SETTING_KEYS } from "@/lib/settings"

export function AINavbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await getSetting(SETTING_KEYS.THEME_MODE) as "light" | "dark" | null
        if (savedMode) {
          setMode(savedMode)
        }
      } catch (error) {
        const localMode = localStorage.getItem("rb-theme") as "light" | "dark"
        if (localMode) {
          setMode(localMode)
        }
      }
    }
    loadTheme()
  }, [])

  const isActive = (path: string) => pathname === path

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

    try {
      await setSetting(SETTING_KEYS.THEME_MODE, newMode, "Theme mode (light/dark)")
    } catch (error) {
      console.error("Failed to save theme to settings:", error)
    }

    localStorage.setItem("rb-theme", newMode)
    applyTheme(currentTheme, newMode)
  }

  const handleUpdateAgents = () => {
    setShowSettings(false)
    window.dispatchEvent(new Event('trigger-update-agents'))
  }

  const navLinks = [
    { href: "/", label: "Agents" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-700">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
              <svg className="w-5 h-5 text-rb-cyan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m23 12-6-6m-6 6-6-6"/>
              </svg>
              FlowKraft&apos;s AI Crew
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? "text-rb-cyan"
                    : "text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Settings gear */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-md"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <>
                  {/* Click-outside overlay */}
                  <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 z-40 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-2">
                    {/* Theme section */}
                    <div className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Appearance</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                    >
                      {mode === "light" ? <Moon className="w-4 h-4 text-gray-500" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                      {mode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                    </button>

                    {/* Divider */}
                    <div className="my-1 border-t border-gray-200 dark:border-slate-700" />

                    {/* Admin section */}
                    <div className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Administration</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUpdateAgents}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                    >
                      <Rocket className="w-4 h-4 text-gray-500" />
                      Update Agents
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="mr-2 p-2 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white rounded-md"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.href)
                    ? "text-rb-cyan bg-gray-50 dark:bg-slate-800"
                    : "text-gray-600 hover:text-slate-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
