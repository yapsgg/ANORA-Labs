"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkflowDetailReviews } from "@/components/marketplace/workflow-detail-reviews"
import { WorkflowDownloadButton } from "@/components/marketplace/workflow-download-button"
import { EditListingDialog } from "@/components/marketplace/edit-listing-dialog"
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace-constants"
import {
  ExternalLink,
  Pencil,
  Download,
  Star,
  Tag,
  Clock,
  Globe,
  CheckCircle,
} from "lucide-react"

export default function WorkflowDetailPage() {
  const params = useParams()
  const listingId = params.id as Id<"marketplaceListings">

  const listing = useQuery(api.marketplace.getById, { listingId })
  const currentUser = useQuery(api.users.viewer)
  const [editOpen, setEditOpen] = useState(false)

  const isOwner = currentUser?._id === listing?.publisherId

  if (listing === undefined) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (listing === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Listing not found.</p>
      </div>
    )
  }

  const categoryLabel =
    MARKETPLACE_CATEGORIES.find((c) => c.value === listing.category)?.label ?? listing.category
  const avgRating =
    listing.ratingCount > 0 ? (listing.ratingSum / listing.ratingCount).toFixed(1) : null
  const priceLabel =
    listing.pricingType === "free"
      ? "Free"
      : `$${(listing.priceInCents / 100).toFixed(listing.priceInCents % 100 === 0 ? 0 : 2)}`

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* ─── Hero: Two-column layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: Info */}
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Publisher */}
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={listing.publisherAvatarUrl} alt={listing.publisherName} />
                <AvatarFallback>{listing.publisherName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{listing.publisherName}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight">{listing.name}</h1>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {listing.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <WorkflowDownloadButton
                listingId={listing._id}
                listingName={listing.name}
                pricingType={listing.pricingType}
                priceInCents={listing.priceInCents}
              />
              <Button variant="outline" asChild>
                <Link href={`/workflow/${listing.flowId}`} target="_blank">
                  <ExternalLink className="size-4" />
                  Preview
                </Link>
              </Button>
              {isOwner && (
                <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                </Button>
              )}
            </div>

            {/* Features */}
            {listing.features && listing.features.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Features</h3>
                <ul className="space-y-1.5">
                  {listing.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="size-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cover image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted border">
          {listing.coverUrl ? (
            <Image
              src={listing.coverUrl}
              alt={listing.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <span className="text-7xl font-bold text-muted-foreground/20">
                {listing.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 rounded-lg border bg-card px-5 py-3.5 text-sm">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={listing.publisherAvatarUrl} alt={listing.publisherName} />
            <AvatarFallback>{listing.publisherName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{listing.publisherName}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium leading-none">{categoryLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Category</p>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium leading-none flex items-center justify-center gap-1">
            <Star className={avgRating ? "size-3.5 fill-yellow-400 text-yellow-400" : "size-3.5 text-muted-foreground"} />
            {avgRating ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{listing.ratingCount} ratings</p>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium leading-none flex items-center justify-center gap-1">
            <Download className="size-3.5" />
            {listing.downloadCount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Downloads</p>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium leading-none">
            {formatDistanceToNow(listing.updatedAt, { addSuffix: true })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Version update</p>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium leading-none">v{listing.version}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Version</p>
        </div>
      </div>

      {/* ─── Tags ─────────────────────────────────────────────────── */}
      {listing.tags && listing.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {listing.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}

      {/* ─── About ────────────────────────────────────────────────── */}
      {listing.longDescription && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">About</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {listing.longDescription}
          </p>
        </div>
      )}

      <hr />

      {/* ─── Reviews ──────────────────────────────────────────────── */}
      <WorkflowDetailReviews listingId={listing._id} />

      {/* ─── Edit dialog (owner only) ─────────────────────────────── */}
      {isOwner && (
        <EditListingDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          listing={listing}
        />
      )}
    </div>
  )
}
