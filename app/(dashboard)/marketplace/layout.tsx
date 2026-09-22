"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { MarketplaceTabs } from "@/components/marketplace/marketplace-tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const myProfile = useQuery(api.consultants.getMyProfile)

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <span className="text-sm font-medium">Marketplace</span>
      </header>
      <div className="border-b px-4">
        <div className="flex items-center justify-between mb-3">
          <MarketplaceTabs />
          <Link
            href="/marketplace/profile"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            My profile
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
