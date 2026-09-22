import { DollarSign, Briefcase, Globe } from "lucide-react"

interface ConsultantDetailSidebarProps {
  budgetMin?: number
  budgetMax?: number
  projectTypes: string[]
  regions: string[]
}

export function ConsultantDetailSidebar({
  budgetMin,
  budgetMax,
  projectTypes,
  regions,
}: ConsultantDetailSidebarProps) {
  const hasBudget = budgetMin != null || budgetMax != null
  const hasAnyInfo = hasBudget || projectTypes.length > 0 || regions.length > 0

  if (!hasAnyInfo) return null

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {hasBudget && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <DollarSign className="size-4" />
            Budget Range
          </div>
          <p className="text-sm text-muted-foreground">
            {budgetMin != null && budgetMax != null
              ? `$${budgetMin.toLocaleString()} – $${budgetMax.toLocaleString()}`
              : budgetMin != null
                ? `From $${budgetMin.toLocaleString()}`
                : `Up to $${budgetMax?.toLocaleString()}`}
          </p>
        </div>
      )}

      {projectTypes.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Briefcase className="size-4" />
            Project Types
          </div>
          <div className="flex flex-wrap gap-1">
            {projectTypes.map((t) => (
              <span key={t} className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {regions.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Globe className="size-4" />
            Regions
          </div>
          <div className="flex flex-wrap gap-1">
            {regions.map((r) => (
              <span key={r} className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
