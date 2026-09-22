"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Plus } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { NavActions } from "@/components/nav-actions"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { ItemCard } from "@/components/item-card"

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list)

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
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <NavActions />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {projects?.map((project) => (
            <ItemCard
              key={project._id}
              type="project"
              id={project._id}
              name={project.name}
              coverUrl={project.image}
              updatedAt={project.updatedAt}
            />
          ))}
          <CreateProjectDialog>
            <button className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors hover:border-foreground/20">
              <Plus className="text-muted-foreground" />
              <span className="text-muted-foreground text-sm">New Project</span>
            </button>
          </CreateProjectDialog>
        </div>
      </div>
    </>
  )
}
