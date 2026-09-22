"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Mail } from "lucide-react"

interface ConsultantBookingButtonsProps {
  bookingUrl?: string
  contactEmail?: string
  displayName: string
}

export function ConsultantBookingButtons({
  bookingUrl,
  contactEmail,
  displayName,
}: ConsultantBookingButtonsProps) {
  const hasAny = bookingUrl || contactEmail
  if (!hasAny) return null

  return (
    <div className="flex flex-col gap-2">
      {bookingUrl && (
        <Button asChild>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="size-4" />
            Book a Session
          </a>
        </Button>
      )}
      {contactEmail && (
        <Button variant="outline" asChild>
          <a href={`mailto:${contactEmail}?subject=Project inquiry for ${displayName}`}>
            <Mail className="size-4" />
            Contact
          </a>
        </Button>
      )}
    </div>
  )
}
