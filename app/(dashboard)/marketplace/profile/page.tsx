"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Save, Plus, Trash2, Upload, Camera } from "lucide-react"
import { toast } from "sonner"
import { CONSULTANT_SPECIALTIES } from "@/lib/marketplace-constants"
import { cn } from "@/lib/utils"
import { Id } from "@/convex/_generated/dataModel"

type SidebarSection = "profile" | "services"

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadProfileImage(
  file: File,
  userId: string,
  profileType: "avatar" | "banner"
): Promise<string | null> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("userId", userId)
  formData.append("type", "profile")
  formData.append("profileType", profileType)

  const res = await fetch("/api/bunny/upload", { method: "POST", body: formData })
  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || "Upload failed")
  }
  return data.url as string
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function MarketplaceProfilePage() {
  const myProfile = useQuery(api.consultants.getMyProfile)
  const currentUser = useQuery(api.users.viewer)
  const services = useQuery(
    api.consultants.getServices,
    myProfile ? { consultantId: myProfile._id } : "skip"
  )

  const createProfile = useMutation(api.consultants.createProfile)
  const updateProfile = useMutation(api.consultants.updateProfile)
  const addService = useMutation(api.consultants.addService)
  const removeService = useMutation(api.consultants.removeService)

  const [section, setSection] = useState<SidebarSection>("profile")

  // Profile form state
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [contactEmail, setContactEmail] = useState("")
  const [bookingUrl, setBookingUrl] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [availableForWork, setAvailableForWork] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [saving, setSaving] = useState(false)

  // New service form
  const [newServiceName, setNewServiceName] = useState("")
  const [newServiceDesc, setNewServiceDesc] = useState("")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [addingService, setAddingService] = useState(false)

  // Populate form when profile loads
  useEffect(() => {
    if (myProfile) {
      setDisplayName(myProfile.displayName)
      setUsername(myProfile.username)
      setBio(myProfile.bio || "")
      setSpecialties(myProfile.specialties)
      setContactEmail(myProfile.contactEmail || "")
      setBookingUrl(myProfile.bookingUrl || "")
      setBudgetMin(myProfile.budgetMin?.toString() || "")
      setBudgetMax(myProfile.budgetMax?.toString() || "")
      setAvailableForWork(myProfile.availableForWork)
      setAvatarUrl(myProfile.avatarUrl || "")
      setBannerUrl(myProfile.bannerUrl || "")
    } else if (myProfile === null && currentUser) {
      setDisplayName(currentUser.name || "")
      setContactEmail(currentUser.email || "")
      setAvatarUrl(currentUser.image || "")
    }
  }, [myProfile, currentUser])

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required")
      return
    }
    if (!username.trim()) {
      toast.error("Username is required")
      return
    }
    if (specialties.length === 0) {
      toast.error("Select at least one specialty")
      return
    }

    setSaving(true)
    try {
      if (myProfile) {
        await updateProfile({
          consultantId: myProfile._id,
          displayName: displayName.trim(),
          username: username.trim().toLowerCase().replace(/\s+/g, "-"),
          bio: bio.trim() || undefined,
          specialties,
          contactEmail: contactEmail.trim() || undefined,
          bookingUrl: bookingUrl.trim() || undefined,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          availableForWork,
          avatarUrl: avatarUrl || undefined,
          bannerUrl: bannerUrl || undefined,
        })
        toast.success("Profile updated")
      } else {
        await createProfile({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase().replace(/\s+/g, "-"),
          bio: bio.trim() || undefined,
          specialties,
          contactEmail: contactEmail.trim() || undefined,
          bookingUrl: bookingUrl.trim() || undefined,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          avatarUrl: avatarUrl || undefined,
          bannerUrl: bannerUrl || undefined,
        })
        toast.success("Profile created!")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile"
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAddService = async () => {
    if (!myProfile) return
    if (!newServiceName.trim()) {
      toast.error("Service name is required")
      return
    }
    if (!newServicePrice || Number(newServicePrice) <= 0) {
      toast.error("Valid price is required")
      return
    }

    setAddingService(true)
    try {
      await addService({
        consultantId: myProfile._id,
        name: newServiceName.trim(),
        description: newServiceDesc.trim() || undefined,
        priceInCents: Math.round(Number(newServicePrice) * 100),
      })
      setNewServiceName("")
      setNewServiceDesc("")
      setNewServicePrice("")
      toast.success("Service added")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add service"
      )
    } finally {
      setAddingService(false)
    }
  }

  const handleRemoveService = async (serviceId: Id<"consultantServices">) => {
    try {
      await removeService({ serviceId })
      toast.success("Service removed")
    } catch (error) {
      toast.error("Failed to remove service")
    }
  }

  // Loading state
  if (myProfile === undefined) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  const userId = currentUser?._id

  return (
    <div className="flex min-h-0 flex-1">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r p-4 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            General
          </p>
          <button
            onClick={() => setSection("profile")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              section === "profile"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Profile
          </button>
        </div>
        {myProfile && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Listings
            </p>
            <button
              onClick={() => setSection("services")}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                section === "services"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              Services
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-8">
          {section === "profile" && (
            <ProfileSection
              isNew={myProfile === null}
              userId={userId}
              displayName={displayName}
              setDisplayName={setDisplayName}
              username={username}
              setUsername={setUsername}
              bio={bio}
              setBio={setBio}
              specialties={specialties}
              toggleSpecialty={toggleSpecialty}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              bookingUrl={bookingUrl}
              setBookingUrl={setBookingUrl}
              budgetMin={budgetMin}
              setBudgetMin={setBudgetMin}
              budgetMax={budgetMax}
              setBudgetMax={setBudgetMax}
              availableForWork={availableForWork}
              setAvailableForWork={setAvailableForWork}
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl}
              bannerUrl={bannerUrl}
              setBannerUrl={setBannerUrl}
              hasProfile={!!myProfile}
              saving={saving}
              onSave={handleSaveProfile}
            />
          )}

          {section === "services" && myProfile && (
            <ServicesSection
              services={services ?? []}
              newServiceName={newServiceName}
              setNewServiceName={setNewServiceName}
              newServiceDesc={newServiceDesc}
              setNewServiceDesc={setNewServiceDesc}
              newServicePrice={newServicePrice}
              setNewServicePrice={setNewServicePrice}
              addingService={addingService}
              onAddService={handleAddService}
              onRemoveService={handleRemoveService}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Profile Section ────────────────────────────────────────────────────────

interface ProfileSectionProps {
  isNew: boolean
  userId?: string
  displayName: string
  setDisplayName: (v: string) => void
  username: string
  setUsername: (v: string) => void
  bio: string
  setBio: (v: string) => void
  specialties: string[]
  toggleSpecialty: (s: string) => void
  contactEmail: string
  setContactEmail: (v: string) => void
  bookingUrl: string
  setBookingUrl: (v: string) => void
  budgetMin: string
  setBudgetMin: (v: string) => void
  budgetMax: string
  setBudgetMax: (v: string) => void
  availableForWork: boolean
  setAvailableForWork: (v: boolean) => void
  avatarUrl: string
  setAvatarUrl: (v: string) => void
  bannerUrl: string
  setBannerUrl: (v: string) => void
  hasProfile: boolean
  saving: boolean
  onSave: () => void
}

function ProfileSection({
  isNew,
  userId,
  displayName,
  setDisplayName,
  username,
  setUsername,
  bio,
  setBio,
  specialties,
  toggleSpecialty,
  contactEmail,
  setContactEmail,
  bookingUrl,
  setBookingUrl,
  budgetMin,
  setBudgetMin,
  budgetMax,
  setBudgetMax,
  availableForWork,
  setAvailableForWork,
  avatarUrl,
  setAvatarUrl,
  bannerUrl,
  setBannerUrl,
  hasProfile,
  saving,
  onSave,
}: ProfileSectionProps) {
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploadingBanner(true)
    try {
      const url = await uploadProfileImage(file, userId, "banner")
      if (url) setBannerUrl(url)
      toast.success("Header image uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ""
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploadingAvatar(true)
    try {
      const url = await uploadProfileImage(file, userId, "avatar")
      if (url) setAvatarUrl(url)
      toast.success("Profile picture uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Marketplace Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isNew
            ? "Create your public consultant profile."
            : "Your public profile on the marketplace."}
        </p>
      </div>

      <div className="space-y-6">
        {/* Banner / Header Image */}
        <div className="space-y-2">
          <div
            className="relative h-40 w-full rounded-xl bg-muted overflow-hidden cursor-pointer group"
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt="Header image"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground/50">
                <Upload className="size-6" />
                <span className="text-xs">Upload Header Image</span>
                <span className="text-[10px]">1920 x 480 recommended</span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingBanner ? (
                <Loader2 className="size-6 animate-spin text-white" />
              ) : (
                <span className="text-sm font-medium text-white">
                  {bannerUrl ? "Change header image" : "Upload header image"}
                </span>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>
        </div>

        {/* Avatar / Profile Picture */}
        <div className="flex items-center gap-4">
          <div
            className="relative cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Avatar className="size-20 border-2 border-border">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xl">
                {displayName ? displayName.charAt(0).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <button
              type="button"
              className="text-sm font-medium hover:underline"
              onClick={() => avatarInputRef.current?.click()}
            >
              Upload profile picture
            </button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP. Max 10MB.
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="profile-name">
            Display name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="profile-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name or company"
          />
          <p className="text-xs text-muted-foreground">
            This is the name that will be associated on your listings.
          </p>
        </div>

        {/* Handle */}
        <div className="space-y-2">
          <Label htmlFor="profile-handle">
            Handle <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="profile-handle"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                )
              }
              placeholder="your-handle"
              className="pl-7"
            />
          </div>
        </div>

        {/* Available for Work */}
        {hasProfile && (
          <div className="flex items-center justify-between">
            <div>
              <Label>Available for work</Label>
              <p className="text-xs text-muted-foreground">
                Show an &quot;Available&quot; badge on your profile.
              </p>
            </div>
            <Switch
              checked={availableForWork}
              onCheckedChange={setAvailableForWork}
            />
          </div>
        )}

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="profile-bio">A short description of yourself</Label>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="Tell clients about your experience..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {bio.length} / 280 characters
          </p>
        </div>

        {/* Specialties */}
        <div className="space-y-2">
          <Label>
            Specialties <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {CONSULTANT_SPECIALTIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  specialties.includes(s)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-2">
          <Label>Budget range</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Min"
                className="pl-7"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Max"
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="profile-email">Contact email</Label>
          <Input
            id="profile-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Clients can reach you at this email.
          </p>
        </div>

        {/* Booking URL */}
        <div className="space-y-2">
          <Label htmlFor="profile-booking">Booking URL</Label>
          <Input
            id="profile-booking"
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
            placeholder="https://cal.com/you"
          />
        </div>

        {/* Save */}
        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          {hasProfile ? "Save changes" : "Create profile"}
        </Button>
      </div>
    </div>
  )
}

// ─── Services Section ───────────────────────────────────────────────────────

interface ServiceItem {
  _id: Id<"consultantServices">
  name: string
  description?: string
  priceInCents: number
}

interface ServicesSectionProps {
  services: ServiceItem[]
  newServiceName: string
  setNewServiceName: (v: string) => void
  newServiceDesc: string
  setNewServiceDesc: (v: string) => void
  newServicePrice: string
  setNewServicePrice: (v: string) => void
  addingService: boolean
  onAddService: () => void
  onRemoveService: (id: Id<"consultantServices">) => void
}

function ServicesSection({
  services,
  newServiceName,
  setNewServiceName,
  newServiceDesc,
  setNewServiceDesc,
  newServicePrice,
  setNewServicePrice,
  addingService,
  onAddService,
  onRemoveService,
}: ServicesSectionProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the services you offer to clients.
        </p>
      </div>

      {/* Existing services */}
      {services.length > 0 && (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service._id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <h3 className="text-sm font-medium">{service.name}</h3>
                {service.description && (
                  <p className="text-xs text-muted-foreground">
                    {service.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium">
                  ${(service.priceInCents / 100).toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveService(service._id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new service */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-sm font-medium">Add a service</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Name</Label>
            <Input
              id="svc-name"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g. Workflow Setup"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">Description (optional)</Label>
            <Textarea
              id="svc-desc"
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="What's included..."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-price">Price (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="svc-price"
                type="number"
                min={1}
                step={1}
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="99"
                className="pl-7"
              />
            </div>
          </div>
          <Button
            onClick={onAddService}
            disabled={addingService}
            size="sm"
          >
            {addingService ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Plus className="size-4 mr-1.5" />
            )}
            Add service
          </Button>
        </div>
      </div>
    </div>
  )
}
