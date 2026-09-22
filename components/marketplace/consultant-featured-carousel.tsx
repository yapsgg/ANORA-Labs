"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ConsultantCard } from "./consultant-card"
import { Id } from "@/convex/_generated/dataModel"

interface FeaturedConsultant {
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

interface ConsultantFeaturedCarouselProps {
  consultants: FeaturedConsultant[]
}

export function ConsultantFeaturedCarousel({
  consultants,
}: ConsultantFeaturedCarouselProps) {
  if (consultants.length === 0) return null

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {consultants.map((consultant) => (
          <div key={consultant._id} className="w-[180px] shrink-0">
            <ConsultantCard consultant={consultant} />
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
