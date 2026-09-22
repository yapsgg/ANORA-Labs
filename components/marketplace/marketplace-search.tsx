"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface MarketplaceSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MarketplaceSearch({
  value,
  onChange,
  placeholder = "Search workflows...",
}: MarketplaceSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-9"
      />
    </div>
  )
}
