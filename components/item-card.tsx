"use client"

import { useRef, useState, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { formatDistanceToNow } from "date-fns"
import {
  ImageIcon,
  MoreHorizontal,
  Link2,
  Trash2,
  ArrowUpRight,
  RefreshCw,
  Upload,
  PenLine,
  StarOff,
  Star,
} from "lucide-react"
import { matchesShortcut, SHORTCUT_ENTER, SHORTCUT_ESCAPE } from "@/lib/shortcuts"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { uploadToBunny, deleteFromBunny, deleteFlowFromBunny } from "@/app/workflow/services/bunny-upload-service"
import { toast } from "sonner"

interface ItemCardProps {
  type: "project" | "flow"
  id: Id<"projects"> | Id<"flows">
  name: string
  coverUrl?: string
  updatedAt: number
  projectId?: Id<"projects"> // Required for flows
}

export function ItemCard({ type, id, name, coverUrl, updatedAt, projectId }: ItemCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Blocks card navigation briefly after a command action fires
  // (prevents the click that triggered onSelect from bubbling to the card)
  const blockNavigationRef = useRef(false)

  const currentUser = useQuery(api.users.viewer)

  // Project mutations and queries
  const updateProject = useMutation(api.projects.update)
  const updateProjectCover = useMutation(api.projects.updateCover)
  const removeProject = useMutation(api.projects.remove)
  const toggleProjectFavorite = useMutation(api.favorites.toggle)
  const isProjectFavorited = useQuery(
    api.favorites.isFavorited,
    type === "project" ? { projectId: id as Id<"projects"> } : "skip"
  )

  // Flow mutations and queries
  const updateFlow = useMutation(api.flows.update)
  const updateFlowCover = useMutation(api.flows.updateCover)
  const removeFlow = useMutation(api.flows.remove)
  const toggleFlowFavorite = useMutation(api.favorites.toggleFlowFavorite)
  const isFlowFavorited = useQuery(
    api.favorites.isFlowFavorited,
    type === "flow" ? { flowId: id as Id<"flows"> } : "skip"
  )

  const isFavorited = type === "project" ? isProjectFavorited : isFlowFavorited
  const hasCover = !!coverUrl

  const handleCardClick = useCallback(() => {
    if (isEditing || blockNavigationRef.current) return
    if (type === "project") {
      router.push(`/project/${id}`)
    } else {
      router.push(`/workflow/${id}`)
    }
  }, [type, id, router, isEditing])

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditName(name)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }, [name])

  const handleEditBlur = useCallback(async () => {
    setIsEditing(false)
    const trimmedName = editName.trim()
    if (trimmedName && trimmedName !== name) {
      if (type === "project") {
        await updateProject({ projectId: id as Id<"projects">, name: trimmedName })
      } else {
        await updateFlow({ flowId: id as Id<"flows">, name: trimmedName })
      }
    } else {
      setEditName(name)
    }
  }, [editName, name, type, id, updateProject, updateFlow])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (matchesShortcut(e, SHORTCUT_ENTER)) {
      e.preventDefault()
      inputRef.current?.blur()
    } else if (matchesShortcut(e, SHORTCUT_ESCAPE)) {
      setEditName(name)
      setIsEditing(false)
    }
  }, [name])

  const blockNavigation = useCallback(() => {
    blockNavigationRef.current = true
    requestAnimationFrame(() => { blockNavigationRef.current = false })
  }, [])

  const handleUploadClick = useCallback(() => {
    blockNavigation()
    setCommandOpen(false)
    fileInputRef.current?.click()
  }, [blockNavigation])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?._id) return

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please select an image.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.")
      return
    }

    setIsUploading(true)

    try {
      const uploadResult = await uploadToBunny(file, {
        userId: currentUser._id,
        flowId: id as string,
        type: "cover",
      })

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "Failed to upload cover")
      }

      if (type === "project") {
        const updateResult = await updateProjectCover({
          projectId: id as Id<"projects">,
          imageUrl: uploadResult.url,
          imageStoragePath: uploadResult.storagePath,
        })

        if (updateResult.oldImageInfo?.storagePath) {
          await deleteFromBunny({
            type: "storage",
            storagePath: updateResult.oldImageInfo.storagePath,
          })
        }
      } else {
        const updateResult = await updateFlowCover({
          flowId: id as Id<"flows">,
          coverUrl: uploadResult.url,
          coverStoragePath: uploadResult.storagePath,
        })

        if (updateResult.oldCoverInfo?.storagePath) {
          await deleteFromBunny({
            type: "storage",
            storagePath: updateResult.oldCoverInfo.storagePath,
          })
        }
      }

      toast.success("Cover updated successfully")
    } catch (error) {
      console.error("Failed to upload cover:", error)
      toast.error("Failed to upload cover")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [currentUser, id, type, updateProjectCover, updateFlowCover])

  const handleCopyLink = useCallback(async () => {
    blockNavigation()
    setCommandOpen(false)
    const url = type === "project"
      ? `${window.location.origin}/project/${id}`
      : `${window.location.origin}/workflow/${id}`
    await navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }, [type, id, blockNavigation])

  const handleToggleFavorite = useCallback(async () => {
    blockNavigation()
    setCommandOpen(false)
    if (type === "project") {
      await toggleProjectFavorite({ projectId: id as Id<"projects"> })
    } else {
      await toggleFlowFavorite({ flowId: id as Id<"flows"> })
    }
  }, [type, id, toggleProjectFavorite, toggleFlowFavorite, blockNavigation])

  const handleOpenInNewTab = useCallback(() => {
    blockNavigation()
    setCommandOpen(false)
    const url = type === "project" ? `/project/${id}` : `/workflow/${id}`
    window.open(url, "_blank")
  }, [type, id, blockNavigation])

  const handleDeleteClick = useCallback(() => {
    blockNavigation()
    setCommandOpen(false)
    setShowDeleteDialog(true)
  }, [blockNavigation])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      if (type === "project") {
        const result = await removeProject({ projectId: id as Id<"projects"> })
        // Clean up Bunny assets for all flows
        if (result.flowsToDelete) {
          for (const flow of result.flowsToDelete) {
            await deleteFlowFromBunny({ userId: flow.userId, flowId: flow.flowId })
          }
        }
        toast.success("Project deleted")
        router.push("/projects")
      } else {
        const result = await removeFlow({ flowId: id as Id<"flows"> })
        // Clean up Bunny assets
        if (result.assetsToDelete) {
          for (const asset of result.assetsToDelete) {
            if (asset.storagePath) {
              await deleteFromBunny({ type: "storage", storagePath: asset.storagePath })
            }
            if (asset.videoId) {
              await deleteFromBunny({ type: "video", videoId: asset.videoId })
            }
          }
        }
        if (result.coverToDelete?.storagePath) {
          await deleteFromBunny({ type: "storage", storagePath: result.coverToDelete.storagePath })
        }
        toast.success("Flow deleted")
      }
    } catch (error) {
      console.error("Failed to delete:", error)
      toast.error(`Failed to delete ${type}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }, [type, id, removeProject, removeFlow, router])

  return (
    <>
      <div
        className="group rounded-xl border transition-colors hover:border-foreground/20 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Cover image area */}
        <div className="bg-muted aspect-video rounded-t-xl overflow-hidden relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {hasCover ? (
            <img
              src={coverUrl}
              alt={`${name} cover`}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="text-muted-foreground/50" />
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="size-5 text-muted-foreground animate-spin" />
            </div>
          )}

          {/* Action buttons on top-right corner */}
          <div
            className={`absolute top-2 right-2 transition-opacity ${
              isHovered || commandOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center bg-background/90 backdrop-blur-sm rounded-md border shadow-sm">
              <button
                onClick={handleEditClick}
                className="p-1.5 hover:bg-accent rounded-l-md transition-colors"
                title="Edit title"
              >
                <PenLine className="size-3.5 text-muted-foreground" />
              </button>

              <Separator orientation="vertical" className="h-5" />

              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-accent rounded-r-md transition-colors"
                    title="More actions"
                  >
                    <MoreHorizontal className="size-3.5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-0"
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Command>
                    <CommandInput placeholder="Search actions..." />
                    <CommandList>
                      <CommandEmpty>No actions found.</CommandEmpty>
                      <CommandGroup heading="Cover">
                        <CommandItem onSelect={handleUploadClick}>
                          {hasCover ? (
                            <>
                              <RefreshCw className="size-4" />
                              <span>Replace cover</span>
                            </>
                          ) : (
                            <>
                              <Upload className="size-4" />
                              <span>Upload cover</span>
                            </>
                          )}
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup heading="Actions">
                        <CommandItem onSelect={handleCopyLink}>
                          <Link2 className="size-4 -rotate-45" />
                          <span>Copy link</span>
                        </CommandItem>
                        <CommandItem onSelect={handleOpenInNewTab}>
                          <ArrowUpRight className="size-4" />
                          <span>Open in new tab</span>
                        </CommandItem>
                        <CommandItem onSelect={handleToggleFavorite}>
                          {isFavorited ? (
                            <StarOff className="size-4 fill-primary text-primary" />
                          ) : (
                            <Star className="size-4" />
                          )}
                          <span>{isFavorited ? "Remove from favorites" : "Add to favorites"}</span>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup heading="Danger">
                        <CommandItem
                          onSelect={handleDeleteClick}
                        >
                          <Trash2 className="size-4" />
                          <span>Delete {type}</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Bottom section with title */}
        <div 
          className="p-4"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleEditBlur}
              onKeyDown={handleEditKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="font-medium bg-transparent outline-none w-full"
            />
          ) : (
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
          )}
          <p className="text-muted-foreground text-xs">
            edited {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {type}?</AlertDialogTitle>
            <AlertDialogDescription>
              {type === "project"
                ? "This will permanently delete the project and all its flows. This action cannot be undone."
                : "This will permanently delete the flow and all its contents. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
