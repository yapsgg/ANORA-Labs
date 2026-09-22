"use client"

import Link from "next/link"
import { ChevronRight, MoreHorizontal, Plus, Folder } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { CreateFlowDialog } from "@/components/create-flow-dialog"

export type WorkspaceItem = {
  _id: Id<"projects">
  name: string
  flows: {
    _id: Id<"flows">
    name: string
  }[]
}

export function NavWorkspaces({
  workspaces,
}: {
  workspaces: WorkspaceItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map((workspace) => (
            <Collapsible key={workspace._id}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={`/project/${workspace._id}`}>
                    <Folder className="size-4" />
                    <span>{workspace.name}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction
                    className="bg-sidebar-accent text-sidebar-accent-foreground left-2 data-[state=open]:rotate-90"
                    showOnHover
                  >
                    <ChevronRight />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CreateFlowDialog projectId={workspace._id}>
                  <SidebarMenuAction showOnHover>
                    <Plus />
                  </SidebarMenuAction>
                </CreateFlowDialog>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {workspace.flows.map((flow) => (
                      <SidebarMenuSubItem key={flow._id}>
                        <SidebarMenuSubButton asChild>
                          <Link href={`/project/${workspace._id}`}>
                            <span>{flow.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
          <SidebarMenuItem>
            <CreateProjectDialog>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <Plus />
                <span>New Project</span>
              </SidebarMenuButton>
            </CreateProjectDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
