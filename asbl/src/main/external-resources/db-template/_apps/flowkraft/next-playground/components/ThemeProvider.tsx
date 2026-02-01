"use client"

import { useEffect } from "react"
import { applyTheme } from "@/lib/themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved theme and mode immediately on mount
    const savedMode = (localStorage.getItem("rb-theme") as "light" | "dark") || "light"
    const savedTheme = localStorage.getItem("rb-color-theme") || "reportburster"

    document.documentElement.setAttribute("data-theme", savedMode)
    
    // Also add/remove 'dark' class for Tailwind's dark: variant
    if (savedMode === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    
    applyTheme(savedTheme, savedMode)
  }, [])

  return <>{children}</>
}
