"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ConsultantDetailHeader } from "@/components/marketplace/consultant-detail-header"
import { ConsultantDetailSidebar } from "@/components/marketplace/consultant-detail-sidebar"
import { ConsultantServicesList } from "@/components/marketplace/consultant-services-list"
import { ConsultantBookingButtons } from "@/components/marketplace/consultant-booking-buttons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RatingStars } from "@/components/marketplace/rating-stars"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

export default function ConsultantDetailPage() {
  const params = useParams()
  const consultantId = params.id as Id<"consultantProfiles">

  const consultant = useQuery(api.consultants.getById, { consultantId })
  const services = useQuery(
    api.consultants.getServices,
    consultant ? { consultantId } : "skip"
  )
  const reviews = useQuery(
    api.consultantReviews.listByConsultant,
    consultant ? { consultantId } : "skip"
  )

  if (consultant === undefined) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-20 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (consultant === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Consultant not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <ConsultantDetailHeader
        displayName={consultant.displayName}
        username={consultant.username}
        avatarUrl={consultant.avatarUrl}
        bannerUrl={consultant.bannerUrl}
        bio={consultant.bio}
        verified={consultant.verified}
        availableForWork={consultant.availableForWork}
        specialties={consultant.specialties}
        ratingSum={consultant.ratingSum}
        ratingCount={consultant.ratingCount}
        completedProjects={consultant.completedProjects}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {services && <ConsultantServicesList services={services} />}

          {/* Reviews */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Reviews</h2>
            {!reviews || reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review._id} className="flex gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {review.userName}
                        </span>
                        <RatingStars rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(review.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <ConsultantBookingButtons
            bookingUrl={consultant.bookingUrl}
            contactEmail={consultant.contactEmail}
            displayName={consultant.displayName}
          />
          <ConsultantDetailSidebar
            budgetMin={consultant.budgetMin}
            budgetMax={consultant.budgetMax}
            projectTypes={consultant.projectTypes}
            regions={consultant.regions}
          />
        </div>
      </div>
    </div>
  )
}
