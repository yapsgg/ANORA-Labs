"use client"

import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace-constants"

interface EditListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: {
    _id: Id<"marketplaceListings">
    name: string
    description: string
    longDescription?: string
    category: string
    tags: string[]
    pricingType: "free" | "paid"
    priceInCents: number
    features: string[]
    version: string
  }
}

export function EditListingDialog({
  open,
  onOpenChange,
  listing,
}: EditListingDialogProps) {
  const [name, setName] = useState(listing.name)
  const [description, setDescription] = useState(listing.description)
  const [longDescription, setLongDescription] = useState(listing.longDescription ?? "")
  const [category, setCategory] = useState(listing.category)
  const [tags, setTags] = useState(listing.tags.join(", "))
  const [isPaid, setIsPaid] = useState(listing.pricingType === "paid")
  const [priceInCents, setPriceInCents] = useState(listing.priceInCents)
  const [features, setFeatures] = useState(listing.features.join("\n"))
  const [version, setVersion] = useState(listing.version)
  const [isSaving, setIsSaving] = useState(false)

  const updateListing = useMutation(api.marketplace.update)

  // Reset form when listing changes or dialog reopens
  useEffect(() => {
    if (open) {
      setName(listing.name)
      setDescription(listing.description)
      setLongDescription(listing.longDescription ?? "")
      setCategory(listing.category)
      setTags(listing.tags.join(", "))
      setIsPaid(listing.pricingType === "paid")
      setPriceInCents(listing.priceInCents)
      setFeatures(listing.features.join("\n"))
      setVersion(listing.version)
    }
  }, [open, listing])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }
    if (!category) {
      toast.error("Category is required")
      return
    }

    setIsSaving(true)
    try {
      await updateListing({
        listingId: listing._id,
        name: name.trim(),
        description: description.trim(),
        longDescription: longDescription.trim() || undefined,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        pricingType: isPaid ? "paid" : "free",
        priceInCents: isPaid ? priceInCents : 0,
        features: features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        version: version.trim() || listing.version,
      })
      toast.success("Listing updated!")
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update listing"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
          <DialogDescription>
            Update your marketplace listing details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of your workflow"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-long-desc">About (optional)</Label>
            <Textarea
              id="edit-long-desc"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Detailed description, use cases, etc."
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. ai, image, creative"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Paid workflow</Label>
              <p className="text-xs text-muted-foreground">
                Charge a one-time fee via credit card
              </p>
            </div>
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          {isPaid && (
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="edit-price"
                  type="number"
                  min={1}
                  step={1}
                  value={priceInCents ? priceInCents / 100 : ""}
                  onChange={(e) =>
                    setPriceInCents(Math.round(Number(e.target.value) * 100))
                  }
                  placeholder="9.99"
                  className="pl-7"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="edit-features">Features (one per line)</Label>
            <Textarea
              id="edit-features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"Multi-model support\nCustom prompts\nBatch processing"}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-version">Version</Label>
            <Input
              id="edit-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
