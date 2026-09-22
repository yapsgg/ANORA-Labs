"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Discover", href: "/marketplace" },
  { label: "Workflows", href: "/marketplace/workflows" },
  { label: "Consultants", href: "/marketplace/consultants" },
]

export function MarketplaceTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-4">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/marketplace"
            ? pathname === "/marketplace"
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
