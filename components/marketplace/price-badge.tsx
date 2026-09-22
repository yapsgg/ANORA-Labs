interface PriceBadgeProps {
  pricingType: "free" | "paid"
  priceInCents: number
}

export function PriceBadge({ pricingType, priceInCents }: PriceBadgeProps) {
  if (pricingType === "free") {
    return <span className="text-sm font-medium text-muted-foreground">Free</span>
  }

  const dollars = (priceInCents / 100).toFixed(priceInCents % 100 === 0 ? 0 : 2)
  return (
    <span className="text-sm font-medium text-foreground">
      ${dollars}
    </span>
  )
}
