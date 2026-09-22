"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { WorkflowCard } from "@/components/marketplace/workflow-card"
import { MarketplaceSearch } from "@/components/marketplace/marketplace-search"
import { MarketplaceCategoryFilter } from "@/components/marketplace/marketplace-category-filter"
import { MarketplaceSortSelect } from "@/components/marketplace/marketplace-sort-select"
import { Skeleton } from "@/components/ui/skeleton"
import type { SortOption } from "@/lib/marketplace-constants"

export default function MarketplaceWorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>("newest")

  const searchResults = useQuery(
    api.marketplace.search,
    searchQuery.trim()
      ? { query: searchQuery.trim(), category: category ?? undefined, limit: 40 }
      : "skip"
  )

  const listResults = useQuery(
    api.marketplace.listActive,
    !searchQuery.trim()
      ? {
          category: category ?? undefined,
          sort,
          limit: 40,
        }
      : "skip"
  )

  const listings = searchQuery.trim()
    ? searchResults
    : listResults?.listings

  const isLoading = listings === undefined

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <MarketplaceSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search workflows..."
          />
        </div>
        <MarketplaceSortSelect value={sort} onChange={setSort} />
      </div>

      <MarketplaceCategoryFilter selected={category} onSelect={setCategory} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            {searchQuery.trim()
              ? "No workflows found for your search."
              : "No workflows listed yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <WorkflowCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
