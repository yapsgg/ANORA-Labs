"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RatingStars } from "./rating-stars"
import { CheckCircle } from "lucide-react"

interface ConsultantDetailHeaderProps {
  displayName: string
  username: string
  avatarUrl?: string
  bannerUrl?: string
  bio?: string
  verified: boolean
  availableForWork: boolean
  specialties: string[]
  ratingSum: number
  ratingCount: number
  completedProjects: number
}

export function ConsultantDetailHeader({
  displayName,
  avatarUrl,
  bannerUrl,
  bio,
  verified,
  availableForWork,
  specialties,
  ratingSum,
  ratingCount,
  completedProjects,
}: ConsultantDetailHeaderProps) {
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="relative h-32 w-full rounded-lg bg-muted overflow-hidden">
        {bannerUrl && (
          <Image src={bannerUrl} alt="" fill className="object-cover" />
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-end gap-4 -mt-10 px-2">
        <Avatar className="size-20 border-4 border-background">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="text-xl">{displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 pb-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-semibold">{displayName}</h1>
            {verified && (
              <CheckCircle className="size-4 text-blue-500 fill-blue-500" />
            )}
            {availableForWork && (
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                Available
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {ratingCount > 0 && (
              <div className="flex items-center gap-1">
                <RatingStars rating={avgRating} size="sm" />
                <span>({ratingCount})</span>
              </div>
            )}
            {completedProjects > 0 && (
              <span>{completedProjects} projects completed</span>
            )}
          </div>
        </div>
      </div>

      {bio && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bio}</p>
      )}

      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}
