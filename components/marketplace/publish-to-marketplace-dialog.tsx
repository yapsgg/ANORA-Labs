"use client"

import { useState } from "react"
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

interface PublishToMarketplaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flowId: Id<"flows">
  flowName: string
}

export function PublishToMarketplaceDialog({
  open,
  onOpenChange,
  flowId,
  flowName,
}: PublishToMarketplaceDialogProps) {
  const [name, setName] = useState(flowName)
  const [description, setDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [priceInCents, setPriceInCents] = useState(0)
  const [features, setFeatures] = useState("")
  const [version, setVersion] = useState("1.0.0")
  const [isPublishing, setIsPublishing] = useState(false)

  const publishToMarketplace = useMutation(api.marketplace.publish)

  const handlePublish = async () => {
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

    setIsPublishing(true)
    try {
      await publishToMarketplace({
        flowId,
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
        version: version.trim() || "1.0.0",
      })
      toast.success("Listed on marketplace!")
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish"
      )
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List on Marketplace</DialogTitle>
          <DialogDescription>
            Make this workflow available for others to discover and use.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="mp-name">Name</Label>
            <Input
              id="mp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mp-desc">Description</Label>
            <Textarea
              id="mp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of your workflow"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mp-long-desc">About (optional)</Label>
            <Textarea
              id="mp-long-desc"
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
            <Label htmlFor="mp-tags">Tags (comma-separated)</Label>
            <Input
              id="mp-tags"
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
              <Label htmlFor="mp-price">Price (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="mp-price"
                  type="number"
                  min={1}
                  step={1}
                  value={priceInCents ? priceInCents / 100 : ""}
                  onChange={(e) => setPriceInCents(Math.round(Number(e.target.value) * 100))}
                  placeholder="9.99"
                  className="pl-7"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="mp-features">Features (one per line)</Label>
            <Textarea
              id="mp-features"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"Multi-model support\nCustom prompts\nBatch processing"}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mp-version">Version</Label>
            <Input
              id="mp-version"
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
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Publish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
