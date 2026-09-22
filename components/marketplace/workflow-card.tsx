"use client"

import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface WorkflowCardProps {
  listing: {
    _id: Id<"marketplaceListings">
    name: string
    description: string
    coverUrl?: string
    publisherName: string
    publisherAvatarUrl?: string
    category: string
    pricingType: "free" | "paid"
    priceInCents: number
    downloadCount: number
    ratingSum: number
    ratingCount: number
  }
}

export function WorkflowCard({ listing }: WorkflowCardProps) {
  const avgRating =
    listing.ratingCount > 0 ? listing.ratingSum / listing.ratingCount : 0

  const priceLabel =
    listing.pricingType === "free"
      ? "Free"
      : `$${(listing.priceInCents / 100).toFixed(listing.priceInCents % 100 === 0 ? 0 : 2)}`

  return (
    <Link
      href={`/marketplace/workflows/${listing._id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card transition-all hover:ring-1 hover:ring-border"
    >
      {/* Cover image — dominant area */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {listing.coverUrl ? (
          <Image
            src={listing.coverUrl}
            alt={listing.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <span className="text-5xl font-bold text-muted-foreground/20">
              {listing.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info row: avatar + name + price */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        <Avatar size="sm">
          <AvatarImage
            src={listing.publisherAvatarUrl}
            alt={listing.publisherName}
          />
          <AvatarFallback>
            {listing.publisherName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-sm font-medium">
          {listing.name}
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">
          {priceLabel}
        </span>
      </div>

      {/* Rating row */}
      <div className="flex items-center gap-1 px-3 pb-3 pt-0.5">
        <Star
          className={
            avgRating > 0
              ? "size-3.5 fill-yellow-400 text-yellow-400"
              : "size-3.5 fill-none text-muted-foreground/40"
          }
        />
        <span className="text-xs text-muted-foreground">
          {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"}
        </span>
      </div>
    </Link>
  )
}
