"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Check, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface WorkflowDownloadButtonProps {
  listingId: Id<"marketplaceListings">
  listingName: string
  pricingType: "free" | "paid"
  priceInCents: number
}

export function WorkflowDownloadButton({
  listingId,
  listingName,
  pricingType,
  priceInCents,
}: WorkflowDownloadButtonProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const hasDownloaded = useQuery(api.marketplace.hasUserDownloaded, { listingId })
  const projects = useQuery(api.projects.list)
  const viewer = useQuery(api.users.viewer)
  const download = useMutation(api.marketplace.download)

  if (hasDownloaded) {
    return (
      <Button variant="secondary" disabled>
        <Check className="size-4" />
        Already Added
      </Button>
    )
  }

  const handleFreeDownload = async () => {
    if (!selectedProject) {
      toast.error("Please select a project")
      return
    }

    setIsProcessing(true)
    try {
      const result = await download({
        listingId,
        targetProjectId: selectedProject as Id<"projects">,
      })
      toast.success("Workflow added to your project!")
      setShowDialog(false)
      if (result.forkedFlowId) {
        router.push(`/workflow/${result.forkedFlowId}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add workflow"
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaidPurchase = async () => {
    if (!selectedProject) {
      toast.error("Please select a project")
      return
    }

    if (!viewer?.email) {
      toast.error("Please add an email to your account first")
      return
    }

    setIsProcessing(true)
    try {
      // Store purchase context in sessionStorage for the success page
      sessionStorage.setItem("marketplace_listing_id", listingId)
      sessionStorage.setItem("marketplace_target_project_id", selectedProject)

      // Create Polar checkout session
      const response = await fetch("/api/polar/checkout/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          listingName,
          priceInCents,
          customerEmail: viewer.email,
          customerExternalId: viewer._id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout")
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      // Clean up sessionStorage on error
      sessionStorage.removeItem("marketplace_listing_id")
      sessionStorage.removeItem("marketplace_target_project_id")
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      )
      setIsProcessing(false)
    }
  }

  const priceDisplay = (priceInCents / 100).toFixed(priceInCents % 100 === 0 ? 0 : 2)

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        {pricingType === "free" ? (
          <>
            <Plus className="size-4" />
            Add
          </>
        ) : (
          <>
            <CreditCard className="size-4" />
            Purchase (${priceDisplay})
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pricingType === "free" ? "Add Workflow" : "Purchase Workflow"}
            </DialogTitle>
            <DialogDescription>
              {pricingType === "free"
                ? "Choose a project to add this workflow to."
                : `This workflow costs $${priceDisplay}. Choose a project, then you'll be taken to checkout.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Select destination project
            </label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={pricingType === "free" ? handleFreeDownload : handlePaidPurchase}
              disabled={isProcessing || !selectedProject}
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : pricingType === "free" ? (
                <>
                  <Plus className="size-4" />
                  Add to Project
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  Proceed to Checkout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
