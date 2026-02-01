"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Sun, Moon } from "lucide-react"
import { ThemeSelector } from "@/components/ThemeSelector"
import { applyTheme } from "@/lib/themes"

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedMode = localStorage.getItem("rb-theme") as "light" | "dark"
    if (savedMode) {
      setMode(savedMode)
    }
  }, [])

  const isActive = (path: string) => pathname === path

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light"
    const currentTheme = localStorage.getItem("rb-color-theme") || "reportburster"

    setMode(newMode)
    document.documentElement.setAttribute("data-theme", newMode)
    localStorage.setItem("rb-theme", newMode)
    applyTheme(currentTheme, newMode)
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/tabulator", label: "Tabulator" },
    { href: "/charts", label: "Charts" },
    { href: "/pivot-tables", label: "Pivot Tables" },
    { href: "/report-parameters", label: "Parameters" },
    { href: "/reports", label: "Reports" },
    { href: "/your-canvas", label: "Your Canvas" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-700">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
              <svg className="w-5 h-5 text-rb-cyan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
              ReportBurster
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

            {/* Theme Selector */}
            <ThemeSelector />

            {/* Light/Dark Mode Toggle */}
            <button
              onClick={toggleMode}
              className="ml-1 p-2 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Toggle light/dark mode"
            >
              {mode === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMode}
              className="mr-2 p-2 text-gray-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Toggle light/dark mode"
            >
              {mode === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
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
