"use client"

import * as React from "react"
import { Home, MessageCircleQuestion, Search, Send, Shapes } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { NavMain } from "@/components/nav-main"
import { NavFavorites } from "@/components/nav-favorites"
import { NavWorkspaces } from "@/components/nav-workspaces"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavSecondary } from "@/components/nav-secondary"
import { SearchDialog } from "@/components/search-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { matchesShortcut, SHORTCUT_SPOTLIGHT_SEARCH } from "@/lib/shortcuts"

const navSecondary = [
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: Shapes,
  },
  {
    title: "Feedback",
    url: "https://x.com/yapsgg",
    icon: Send,
  },
  {
    title: "Help",
    url: "https://x.com/yapsgg",
    icon: MessageCircleQuestion,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchOpen, setSearchOpen] = React.useState(false)

  const viewer = useQuery(api.users.viewer)
  const projectsWithFlows = useQuery(api.projects.listWithFlows)
  const projectFavorites = useQuery(api.favorites.list)
  const flowFavorites = useQuery(api.favorites.listFlowFavorites)

  const user = {
    name: viewer?.name ?? "User",
    email: viewer?.email ?? "",
    avatar: viewer?.image ?? "",
  }

  const teamName = viewer?.name ? `${viewer.name}'s Team` : "Personal"

  const navMain = [
    {
      title: "Search",
      url: "#",
      icon: Search,
      onClick: () => setSearchOpen(true),
    },
    {
      title: "Home",
      url: "/projects",
      icon: Home,
      isActive: true,
    },
  ]

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_SPOTLIGHT_SEARCH)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <Sidebar className="border-r-0" {...props}>
        <SidebarHeader>
          <TeamSwitcher name={teamName} />
          <NavMain items={navMain} />
        </SidebarHeader>
        <SidebarContent>
          <NavFavorites
            projectFavorites={projectFavorites ?? []}
            flowFavorites={flowFavorites ?? []}
          />
          <NavWorkspaces workspaces={projectsWithFlows ?? []} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
