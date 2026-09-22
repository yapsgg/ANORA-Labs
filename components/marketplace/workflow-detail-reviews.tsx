"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RatingStars } from "./rating-stars"
import { Loader2, Trash2, Pencil } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface WorkflowDetailReviewsProps {
  listingId: Id<"marketplaceListings">
}

export function WorkflowDetailReviews({
  listingId,
}: WorkflowDetailReviewsProps) {
  const reviews = useQuery(api.marketplaceReviews.listByListing, { listingId })
  const userReview = useQuery(api.marketplaceReviews.getUserReview, { listingId })
  const hasDownloaded = useQuery(api.marketplace.hasUserDownloaded, { listingId })
  const createReview = useMutation(api.marketplaceReviews.create)
  const updateReview = useMutation(api.marketplaceReviews.update)
  const removeReview = useMutation(api.marketplaceReviews.remove)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<Id<"marketplaceReviews"> | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState("")

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }
    setIsSubmitting(true)
    try {
      await createReview({
        listingId,
        rating,
        comment: comment.trim() || undefined,
      })
      setRating(0)
      setComment("")
      toast.success("Review submitted!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || editRating === 0) return
    setIsSubmitting(true)
    try {
      await updateReview({
        reviewId: editingId,
        rating: editRating,
        comment: editComment.trim() || undefined,
      })
      setEditingId(null)
      toast.success("Review updated!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: Id<"marketplaceReviews">) => {
    try {
      await removeReview({ reviewId })
      toast.success("Review deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Reviews</h2>

      {hasDownloaded && !userReview && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Leave a review</p>
          <RatingStars rating={rating} interactive onRate={setRating} size="md" />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience... (optional)"
            rows={3}
          />
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} size="sm">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Review"}
          </Button>
        </div>
      )}

      {!reviews || reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="flex gap-3 group">
              <Avatar size="sm">
                <AvatarImage src={review.userAvatarUrl} />
                <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{review.userName}</span>
                    <RatingStars rating={review.rating} size="sm" />
                  </div>
                  {userReview?._id === review._id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setEditingId(review._id)
                          setEditRating(review.rating)
                          setEditComment(review.comment ?? "")
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(review._id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {editingId === review._id ? (
                  <div className="space-y-2">
                    <RatingStars rating={editRating} interactive onRate={setEditRating} size="md" />
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
