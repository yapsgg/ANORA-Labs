"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md"
  interactive?: boolean
  onRate?: (rating: number) => void
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = "sm",
  interactive = false,
  onRate,
}: RatingStarsProps) {
  const sizeClass = size === "sm" ? "size-3.5" : "size-4"

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.round(rating)
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(i + 1)}
            className={cn(
              "p-0 border-none bg-transparent",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClass,
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-muted-foreground/40"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
