"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { WorkflowCard } from "@/components/marketplace/workflow-card"
import { ConsultantFeaturedCarousel } from "@/components/marketplace/consultant-featured-carousel"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function MarketplaceDiscoverPage() {
  const featuredWorkflows = useQuery(api.marketplace.listFeatured, { limit: 6 })
  const featuredConsultants = useQuery(api.consultants.listFeatured, { limit: 8 })
  const recentWorkflows = useQuery(api.marketplace.listActive, { limit: 6, sort: "newest" })

  return (
    <div className="space-y-10 p-6">
      {/* Featured Consultants */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Featured Consultants</h2>
        {!featuredConsultants ? (
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[170px] w-[180px] shrink-0 rounded-xl" />
            ))}
          </div>
        ) : featuredConsultants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No featured consultants yet.</p>
        ) : (
          <ConsultantFeaturedCarousel consultants={featuredConsultants} />
        )}
      </section>

      {/* Featured Workflows */}
      {featuredWorkflows && featuredWorkflows.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Featured Workflows</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredWorkflows.map((listing) => (
              <WorkflowCard key={listing._id} listing={listing} />
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Link
              href="/marketplace/workflows"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Show all
            </Link>
          </div>
        </section>
      )}

      {/* Recent Workflows */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Workflows</h2>
        {!recentWorkflows ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
            ))}
          </div>
        ) : recentWorkflows.listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflows listed yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentWorkflows.listings.map((listing) => (
                <WorkflowCard key={listing._id} listing={listing} />
              ))}
            </div>
            <div className="flex justify-center pt-2">
              <Link
                href="/marketplace/workflows"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Show all
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
