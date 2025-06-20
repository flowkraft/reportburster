"use client"

import * as React from "react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"

import { MainNavItem } from "types" // Ensure this type is correctly defined
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"
import { MobileNav } from "@/components/mobile-nav"

interface MainNavProps {
  items?: MainNavItem[]
  children?: React.ReactNode
}

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment()
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false)

  const isFormPage = (href: string | undefined): href is string =>
    typeof href === "string" && (href === "/contact" || href === "/partners")

  return (
    <div className="flex gap-6 md:gap-10">
      {" "}
      {/* Main outer container - UNCHANGED */}
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        {" "}
        {/* Logo and Site Name - UNCHANGED */}
        <Icons.logo />
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden items-center gap-6 md:flex">
          {" "}
          {/* Desktop Nav container - items-center added for vertical alignment of split button */}
          {items.map((item, index) => {
            const commonLinkClassName = cn(
              // Renamed for clarity, used for the link part
              "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
              item.href && item.href.startsWith(`/${segment}`)
                ? "text-foreground"
                : "text-foreground/60",
              item.disabled && "cursor-not-allowed opacity-80"
            )

            // Check if item has sub-items for split button dropdown
            if (item.items && item.items.length > 0) {
              return (
                <div key={index} className="flex items-center">
                  {" "}
                  {/* Wrapper for link and trigger */}
                  {/* Main Link Part */}
                  {item.href ? ( // Parent item must have an href to be a link
                    isFormPage(item.href) ? (
                      <a
                        href={item.disabled ? "#" : item.href}
                        className={commonLinkClassName}
                      >
                        {item.title}
                      </a>
                    ) : (
                      <Link
                        href={item.disabled ? "#" : item.href}
                        className={commonLinkClassName}
                      >
                        {item.title}
                      </Link>
                    )
                  ) : (
                    // Fallback if parent has no href (less common for split button)
                    // but still needs to be part of the flex layout
                    <span className={commonLinkClassName}>{item.title}</span>
                  )}
                  {/* Dropdown Trigger Part (Icon Only) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={item.disabled}>
                      <button
                        className={cn(
                          "ml-1 flex items-center justify-center rounded-sm p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          item.disabled && "cursor-not-allowed opacity-60"
                        )}
                        aria-label={`Open ${item.title} submenu`}
                      >
                        <ChevronDownIcon className="h-4 w-4" />{" "}
                        {/* Removed opacity-70 to make it more prominent */}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {" "}
                      {/* Adjust width as needed */}
                      {item.items.map((subItem) => (
                        <DropdownMenuItem
                          key={subItem.title}
                          asChild
                          disabled={subItem.disabled}
                          className={cn(!subItem.disabled && "cursor-pointer")}
                        >
                          {subItem.href ? (
                            <Link
                              href={subItem.href}
                              target={subItem.target} // Assumes NavItem has target
                              rel={
                                subItem.external && subItem.target === "_blank"
                                  ? "noopener noreferrer"
                                  : undefined
                              } // Assumes NavItem has external & target
                            >
                              {subItem.title}
                            </Link>
                          ) : (
                            <span>{subItem.title}</span> // Fallback if subItem has no href
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            } else {
              // RENDER AS REGULAR LINK (Original Logic)
              if (isFormPage(item.href)) {
                return (
                  <a
                    key={index}
                    href={item.disabled || !item.href ? "#" : item.href}
                    className={commonLinkClassName} // Use the renamed common class
                  >
                    {item.title}
                  </a>
                )
              }
              return (
                <Link
                  key={index}
                  href={item.disabled || !item.href ? "#" : item.href}
                  className={commonLinkClassName} // Use the renamed common class
                >
                  {item.title}
                </Link>
              )
            }
          })}
        </nav>
      ) : null}
      {/* Mobile Menu Button and Component - UNCHANGED */}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <Icons.close /> : <Icons.logo />}
        <span className="font-bold">Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items}>{children}</MobileNav>
      )}
    </div>
  )
}
