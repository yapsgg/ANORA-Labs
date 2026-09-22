import { Id } from "@/convex/_generated/dataModel"

interface Service {
  _id: Id<"consultantServices">
  name: string
  description?: string
  priceInCents: number
}

interface ConsultantServicesListProps {
  services: Service[]
}

export function ConsultantServicesList({ services }: ConsultantServicesListProps) {
  if (services.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Services</h2>
      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service._id}
            className="flex items-start justify-between gap-4 rounded-lg border p-3"
          >
            <div className="space-y-0.5">
              <h3 className="text-sm font-medium">{service.name}</h3>
              {service.description && (
                <p className="text-xs text-muted-foreground">
                  {service.description}
                </p>
              )}
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              ${(service.priceInCents / 100).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
