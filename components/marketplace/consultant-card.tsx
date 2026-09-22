"use client"

import Link from "next/link"
import Image from "next/image"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

// Generate a deterministic muted background color from a string
function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 30%, 25%)`
}

interface ConsultantCardProps {
  consultant: {
    _id: Id<"consultantProfiles">
    displayName: string
    avatarUrl?: string
    bannerUrl?: string
    verified: boolean
    availableForWork: boolean
    specialties: string[]
    ratingSum: number
    ratingCount: number
    completedProjects: number
  }
}

export function ConsultantCard({ consultant }: ConsultantCardProps) {
  const avgRating =
    consultant.ratingCount > 0
      ? (consultant.ratingSum / consultant.ratingCount).toFixed(1)
      : null

  const bgColor = nameToColor(consultant.displayName)

  return (
    <Link
      href={`/marketplace/consultants/${consultant._id}`}
      className="group flex flex-col overflow-hidden rounded-xl transition-all hover:ring-1 hover:ring-border"
    >
      {/* Colored background area with centered avatar */}
      <div
        className="relative flex items-center justify-center aspect-[4/3]"
        style={
          consultant.bannerUrl
            ? undefined
            : { backgroundColor: bgColor }
        }
      >
        {consultant.bannerUrl && (
          <Image
            src={consultant.bannerUrl}
            alt=""
            fill
            className="object-cover"
          />
        )}
        <Avatar className="relative size-16 ring-2 ring-background/20">
          <AvatarImage src={consultant.avatarUrl} alt={consultant.displayName} />
          <AvatarFallback className="text-xl font-semibold">
            {consultant.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name + rating row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-card">
        <span className="truncate text-sm font-medium">
          {consultant.displayName}
        </span>
        {avgRating && (
          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-current" />
            {avgRating} ({consultant.ratingCount})
          </span>
        )}
      </div>
    </Link>
  )
}
