"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Link2,
  MoreHorizontal,
  StarOff,
  Trash2,
  Folder,
  Workflow,
} from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type ProjectFavoriteItem = {
  _id: Id<"favorites">
  projectId: Id<"projects">
  project: {
    _id: Id<"projects">
    name: string
  }
}

type FlowFavoriteItem = {
  _id: Id<"flowFavorites">
  flowId: Id<"flows">
  flow: {
    _id: Id<"flows">
    name: string
    projectId: Id<"projects">
  }
}

interface NavFavoritesProps {
  projectFavorites: ProjectFavoriteItem[]
  flowFavorites: FlowFavoriteItem[]
}

export function NavFavorites({ projectFavorites, flowFavorites }: NavFavoritesProps) {
  const { isMobile } = useSidebar()
  const toggleProjectFavorite = useMutation(api.favorites.toggle)
  const toggleFlowFavorite = useMutation(api.favorites.toggleFlowFavorite)

  const hasItems = projectFavorites.length > 0 || flowFavorites.length > 0

  if (!hasItems) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <SidebarMenu>
        {/* Project favorites */}
        {projectFavorites.map((item) => (
          <SidebarMenuItem key={item._id}>
            <SidebarMenuButton asChild>
              <Link href={`/project/${item.projectId}`} title={item.project.name}>
                <Folder className="size-4" />
                <span>{item.project.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem
                  onClick={() => toggleProjectFavorite({ projectId: item.projectId })}
                >
                  <StarOff className="text-muted-foreground" />
                  <span>Remove from Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/project/${item.projectId}`
                    )
                  }}
                >
                  <Link2 className="text-muted-foreground -rotate-45" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/project/${item.projectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowUpRight className="text-muted-foreground" />
                    <span>Open in New Tab</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}

        {/* Flow favorites */}
        {flowFavorites.map((item) => (
          <SidebarMenuItem key={item._id}>
            <SidebarMenuButton asChild>
              <Link href={`/workflow/${item.flowId}`} title={item.flow.name}>
                <Workflow className="size-4" />
                <span>{item.flow.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem
                  onClick={() => toggleFlowFavorite({ flowId: item.flowId })}
                >
                  <StarOff className="text-muted-foreground" />
                  <span>Remove from Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/workflow/${item.flowId}`
                    )
                  }}
                >
                  <Link2 className="text-muted-foreground -rotate-45" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/workflow/${item.flowId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowUpRight className="text-muted-foreground" />
                    <span>Open in New Tab</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
