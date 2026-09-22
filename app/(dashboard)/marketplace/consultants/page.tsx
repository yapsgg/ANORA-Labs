"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ConsultantCard } from "@/components/marketplace/consultant-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CONSULTANT_SPECIALTIES } from "@/lib/marketplace-constants"
import { cn } from "@/lib/utils"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export default function MarketplaceConsultantsPage() {
  const [specialty, setSpecialty] = useState<string | null>(null)

  const consultants = useQuery(api.consultants.listActive, {
    specialty: specialty ?? undefined,
    limit: 40,
  })

  const myProfile = useQuery(api.consultants.getMyProfile)
  const hasProfile = myProfile !== null && myProfile !== undefined

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between gap-3">
        {/* Specialty filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSpecialty(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              specialty === null
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
            )}
          >
            All
          </button>
          {CONSULTANT_SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s === specialty ? null : s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                specialty === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {!hasProfile && (
          <Button size="sm" asChild>
            <Link href="/marketplace/profile">
              <UserPlus className="size-4 mr-1.5" />
              Become a Consultant
            </Link>
          </Button>
        )}
      </div>

      {consultants === undefined ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : consultants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            {specialty
              ? "No consultants found for this specialty."
              : "No consultants available yet."}
          </p>
          {!hasProfile && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/marketplace/profile">
                <UserPlus className="size-4 mr-1.5" />
                Be the first consultant
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {consultants.map((consultant) => (
            <ConsultantCard key={consultant._id} consultant={consultant} />
          ))}
        </div>
      )}
    </div>
  )
}
