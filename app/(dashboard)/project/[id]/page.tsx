"use client"

import { use } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { NavActions } from "@/components/nav-actions"
import { CreateFlowDialog } from "@/components/create-flow-dialog"
import { ItemCard } from "@/components/item-card"

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const projectId = id as Id<"projects">
  const project = useQuery(api.projects.get, { projectId })
  const flows = useQuery(api.flows.listByProject, { projectId })
  const isFavorited = useQuery(api.favorites.isFavorited, { projectId })
  const toggleFavorite = useMutation(api.favorites.toggle)

  if (project === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-xs">Loading...</p>
      </div>
    )
  }

  if (project === null) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button asChild variant="outline">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <NavActions
            onStar={() => toggleFavorite({ projectId })}
            starred={isFavorited ?? false}
          />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {flows?.map((flow) => (
            <ItemCard
              key={flow._id}
              type="flow"
              id={flow._id}
              name={flow.name}
              coverUrl={flow.coverUrl}
              updatedAt={flow.updatedAt}
              projectId={projectId}
            />
          ))}
          <CreateFlowDialog projectId={projectId}>
            <button className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors hover:border-foreground/20">
              <Plus className="text-muted-foreground" />
              <span className="text-muted-foreground text-sm">New Flow</span>
            </button>
          </CreateFlowDialog>
        </div>
      </div>
    </>
  )
}
