"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Payslips",
    href: "/admin/payslips",
    icon: Receipt,
  },
  {
    title: "Invoices",
    href: "/admin/invoices",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        "bg-slate-900 border-r border-slate-800",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight">Admin</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25 mx-auto">
            <Zap className="h-4.5 w-4.5 text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-slate-800">
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Expand sidebar"
          >
            <Menu className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-2">
        <div className={cn("mb-2", collapsed && "hidden")}>
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </span>
        </div>
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || 
            (link.href !== "/admin" && pathname.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-l-2 border-cyan-500 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
              )}
              title={collapsed ? link.title : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {!collapsed && <span>{link.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Back to main app */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <Link
          href="/"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            "text-slate-400 hover:bg-slate-800/70 hover:text-white transition-all duration-200",
          )}
          title={collapsed ? "Back to App" : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-white" />
          </div>
          {!collapsed && <span>Back to App</span>}
        </Link>
      </div>
    </aside>
  )
}
