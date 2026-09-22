"use client"

import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace-constants"
import { cn } from "@/lib/utils"

interface MarketplaceCategoryFilterProps {
  selected: string | null
  onSelect: (category: string | null) => void
}

export function MarketplaceCategoryFilter({
  selected,
  onSelect,
}: MarketplaceCategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          selected === null
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
        )}
      >
        All
      </button>
      {MARKETPLACE_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value === selected ? null : cat.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            selected === cat.value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
