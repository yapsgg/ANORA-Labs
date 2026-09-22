"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { FileText, Folder, CornerDownLeft, Clock } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)

  // Get recent items for default view
  const recentData = useQuery(api.search.getRecent)
  // Get all items for search
  const allData = useQuery(api.search.search)

  const isSearching = search.trim().length > 0

  // Filter items based on search
  const filteredFlows = React.useMemo(() => {
    if (!isSearching) return []
    if (!allData?.flows) return []
    const searchLower = search.toLowerCase()
    return allData.flows.filter(
      (flow) =>
        flow.name.toLowerCase().includes(searchLower) ||
        flow.projectName.toLowerCase().includes(searchLower)
    )
  }, [allData?.flows, search, isSearching])

  const filteredProjects = React.useMemo(() => {
    if (!isSearching) return []
    if (!allData?.projects) return []
    const searchLower = search.toLowerCase()
    return allData.projects.filter((project) =>
      project.name.toLowerCase().includes(searchLower)
    )
  }, [allData?.projects, search, isSearching])

  const handleSelect = (type: "flow" | "project", id: string, projectId?: string) => {
    if (type === "flow" && projectId) {
      router.push(`/workflow/${id}`)
    } else if (type === "project") {
      router.push(`/project/${id}`)
    }
    onOpenChange(false)
    setSearch("")
  }

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setHoveredItem(null)
    }
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search flows and projects..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {isSearching ? (
          // Search results
          <>
            {filteredFlows.length > 0 && (
              <CommandGroup heading="Flows">
                {filteredFlows.map((flow) => (
                  <CommandItem
                    key={flow._id}
                    value={`flow-${flow._id}`}
                    onSelect={() => handleSelect("flow", flow._id, flow.projectId)}
                    onMouseEnter={() => setHoveredItem(`flow-${flow._id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{flow.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {flow.projectName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(flow.updatedAt)}
                    </span>
                    {hoveredItem === `flow-${flow._id}` && (
                      <CornerDownLeft className="text-muted-foreground shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredProjects.length > 0 && (
              <CommandGroup heading="Projects">
                {filteredProjects.map((project) => (
                  <CommandItem
                    key={project._id}
                    value={`project-${project._id}`}
                    onSelect={() => handleSelect("project", project._id)}
                    onMouseEnter={() => setHoveredItem(`project-${project._id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Folder className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{project.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                    {hoveredItem === `project-${project._id}` && (
                      <CornerDownLeft className="text-muted-foreground shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        ) : (
          // Default view: recent items
          <>
            {recentData?.flowsToday && recentData.flowsToday.length > 0 && (
              <CommandGroup heading="Today">
                {recentData.flowsToday.map((flow) => (
                  <CommandItem
                    key={flow._id}
                    value={`flow-${flow._id}`}
                    onSelect={() => handleSelect("flow", flow._id, flow.projectId)}
                    onMouseEnter={() => setHoveredItem(`flow-${flow._id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{flow.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {flow.projectName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(flow.updatedAt)}
                    </span>
                    {hoveredItem === `flow-${flow._id}` && (
                      <CornerDownLeft className="text-muted-foreground shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recentData?.projectsThisWeek && recentData.projectsThisWeek.length > 0 && (
              <CommandGroup heading="This Week">
                {recentData.projectsThisWeek.map((project) => (
                  <CommandItem
                    key={project._id}
                    value={`project-${project._id}`}
                    onSelect={() => handleSelect("project", project._id)}
                    onMouseEnter={() => setHoveredItem(`project-${project._id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Folder className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{project.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                    {hoveredItem === `project-${project._id}` && (
                      <CornerDownLeft className="text-muted-foreground shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(!recentData?.flowsToday?.length && !recentData?.projectsThisWeek?.length) && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No recent activity. Start by creating a project.
              </div>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
