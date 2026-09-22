import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Node data validators for different node types
const nodeConfigValidator = v.object({
  model: v.optional(v.string()),
  temperature: v.optional(v.number()),
  size: v.optional(v.string()),
  duration: v.optional(v.number()),
  ratio: v.optional(v.string()),
  resolution: v.optional(v.string()),
  // When true, the node delegates model selection (OpenRouter Auto Router
  // for text, local resolver for image) instead of using `model` directly.
  auto: v.optional(v.boolean()),
  // LEGACY (TEMPORARY): older rows persisted these fields. The
  // stripLegacyNodeFields migration clears them; once that returns
  // remainingTotal: 0 for each, drop the field and re-push.
  klingV3: v.optional(v.any()),
  action: v.optional(v.string()),
  falParams: v.optional(v.any()),
});

const nodeDataValidator = v.object({
  title: v.optional(v.string()),
  label: v.optional(v.string()),
  icon: v.optional(v.string()),
  status: v.optional(v.union(
    v.literal("loading"),
    v.literal("success"),
    v.literal("error"),
    v.literal("initial")
  )),
  error: v.optional(v.string()),
  config: v.optional(nodeConfigValidator),
  // Content fields
  text: v.optional(v.string()),
  prompt: v.optional(v.string()),
  image: v.optional(v.string()),
  video: v.optional(v.string()),
  // Original image URL retained when the user crops, so they can revert.
  originalImage: v.optional(v.string()),
  // Comment node fields
  author: v.optional(v.string()),
  createdAt: v.optional(v.string()),
  resolved: v.optional(v.boolean()),
  // Resizable node dimensions
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  // Whether image was uploaded (not generated)
  isUploaded: v.optional(v.boolean()),
  // LEGACY (TEMPORARY): old Topaz Labs settings on existing rows. The
  // stripLegacyNodeFields migration removes them; delete this field after
  // it reports remainingTotal: 0.
  topazConfig: v.optional(v.any()),
});

const positionValidator = v.object({
  x: v.number(),
  y: v.number(),
});

const schema = defineSchema({
  ...authTables,

  // Projects - top level organization
  projects: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    imageStoragePath: v.optional(v.string()), // For deletion from Bunny
    userId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // Flows - each flow contains a workflow (nodes + edges)
  flows: defineTable({
    name: v.string(),
    projectId: v.id("projects"),
    userId: v.id("users"),
    updatedAt: v.number(),
    // Viewport state for restoring position
    viewport: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      zoom: v.number(),
    })),
    // Cover image for dashboard preview (Bunny CDN)
    coverUrl: v.optional(v.string()),
    coverStoragePath: v.optional(v.string()), // For deletion from Bunny
    coverStorageId: v.optional(v.string()), // Legacy field for backward compatibility
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  // Workflow nodes - individual nodes in a flow
  workflowNodes: defineTable({
    flowId: v.id("flows"),
    userId: v.id("users"),
    // Node identification
    nodeId: v.string(), // nanoid used in React Flow
    type: v.union(
      v.literal("generate-text-node"),
      v.literal("generate-image-node"),
      v.literal("generate-video-node"),
      v.literal("comment-node")
    ),
    // Position on canvas
    position: positionValidator,
    // Node data (type-specific fields)
    data: nodeDataValidator,
    // React Flow metadata
    measured: v.optional(v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
    })),
    selected: v.optional(v.boolean()),
    dragging: v.optional(v.boolean()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_flow", ["flowId"])
    .index("by_flow_nodeId", ["flowId", "nodeId"])
    .index("by_user", ["userId"]),

  // Workflow edges - connections between nodes
  workflowEdges: defineTable({
    flowId: v.id("flows"),
    userId: v.id("users"),
    // Edge identification
    edgeId: v.string(), // nanoid used in React Flow
    // Connection info
    source: v.string(), // source node nodeId
    target: v.string(), // target node nodeId
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    // Edge type
    type: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_flow", ["flowId"])
    .index("by_flow_edgeId", ["flowId", "edgeId"])
    .index("by_source", ["flowId", "source"])
    .index("by_target", ["flowId", "target"])
    .index("by_user", ["userId"]),

  // Workflow assets - stored files (images, videos) via Bunny CDN
  workflowAssets: defineTable({
    flowId: v.id("flows"),
    nodeId: v.string(), // Reference to the node that owns this asset
    userId: v.id("users"),
    // File info - Bunny CDN
    url: v.string(), // Required Bunny CDN URL
    storagePath: v.optional(v.string()), // For deletion from Bunny Storage
    storageId: v.optional(v.string()), // Legacy field for backward compatibility
    videoId: v.optional(v.string()), // For deletion from Bunny Stream
    type: v.union(v.literal("image"), v.literal("video")),
    filename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_flow", ["flowId"])
    .index("by_node", ["flowId", "nodeId"])
    .index("by_user", ["userId"]),

  // Favorites (for projects)
  favorites: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"]),

  // Flow favorites
  flowFavorites: defineTable({
    userId: v.id("users"),
    flowId: v.id("flows"),
  })
    .index("by_user", ["userId"])
    .index("by_user_flow", ["userId", "flowId"]),

  // ===================
  // Marketplace
  // ===================

  // Marketplace listings — workflows listed on the marketplace
  marketplaceListings: defineTable({
    flowId: v.id("flows"),
    publisherId: v.id("users"),
    publisherName: v.string(),
    publisherAvatarUrl: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    pricingType: v.union(v.literal("free"), v.literal("paid")),
    priceInCents: v.number(),
    downloadCount: v.number(),
    ratingSum: v.number(),
    ratingCount: v.number(),
    version: v.string(),
    lastVersionAt: v.number(),
    features: v.array(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("draft"),
      v.literal("under_review"),
      v.literal("rejected"),
      v.literal("archived")
    ),
    featured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_flow", ["flowId"])
    .index("by_publisher", ["publisherId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_status_category", ["status", "category"])
    .index("by_featured", ["featured"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["status", "category"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["status", "category"],
    }),

  // Marketplace downloads — tracks who acquired which listing
  marketplaceDownloads: defineTable({
    listingId: v.id("marketplaceListings"),
    userId: v.id("users"),
    flowId: v.id("flows"),
    pricePaidInCents: v.number(),
    polarCheckoutId: v.optional(v.string()),
    downloadedAt: v.number(),
  })
    .index("by_listing", ["listingId"])
    .index("by_user", ["userId"])
    .index("by_user_listing", ["userId", "listingId"])
    .index("by_polar_checkout", ["polarCheckoutId"]),

  // Marketplace reviews — ratings/reviews for listings
  marketplaceReviews: defineTable({
    listingId: v.id("marketplaceListings"),
    userId: v.id("users"),
    userName: v.string(),
    userAvatarUrl: v.optional(v.string()),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_listing", ["listingId"])
    .index("by_user", ["userId"])
    .index("by_user_listing", ["userId", "listingId"]),

  // Consultant profiles
  consultantProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    verified: v.boolean(),
    availableForWork: v.boolean(),
    specialties: v.array(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    projectTypes: v.array(v.string()),
    regions: v.array(v.string()),
    contactEmail: v.optional(v.string()),
    bookingUrl: v.optional(v.string()),
    ratingSum: v.number(),
    ratingCount: v.number(),
    completedProjects: v.number(),
    featured: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("under_review")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"]),

  // Consultant services — service offerings
  consultantServices: defineTable({
    consultantId: v.id("consultantProfiles"),
    name: v.string(),
    description: v.optional(v.string()),
    priceInCents: v.number(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_consultant", ["consultantId"]),

  // Consultant reviews
  consultantReviews: defineTable({
    consultantId: v.id("consultantProfiles"),
    userId: v.id("users"),
    userName: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_consultant", ["consultantId"])
    .index("by_user_consultant", ["userId", "consultantId"]),

  // ===================
  // Public Workflows
  // ===================

  // Public flows - published workflows that can be forked by other users
  publicFlows: defineTable({
    flowId: v.id("flows"),
    publisherId: v.id("users"),
    publisherName: v.optional(v.string()),
    // Flow metadata snapshot (in case original is deleted)
    name: v.string(),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    // Stats
    forkCount: v.number(),
    viewCount: v.number(),
    // Timestamps
    publishedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_flow", ["flowId"])
    .index("by_publisher", ["publisherId"])
    .index("by_published", ["publishedAt"])
    .index("by_forks", ["forkCount"]),

  // Track forks - who forked which public flow
  flowForks: defineTable({
    publicFlowId: v.id("publicFlows"),
    originalFlowId: v.id("flows"),
    forkedFlowId: v.id("flows"),
    userId: v.id("users"),
    forkedAt: v.number(),
  })
    .index("by_public_flow", ["publicFlowId"])
    .index("by_user", ["userId"])
    .index("by_original", ["originalFlowId"]),

  // ===================
  // Notifications
  // ===================

  notifications: defineTable({
    recipientId: v.id("users"),
    actorId: v.id("users"),
    type: v.union(
      v.literal("flow_forked"),
      v.literal("marketplace_download"),
      v.literal("marketplace_review"),
      v.literal("marketplace_purchase"),
      v.literal("consultant_booking"),
    ),
    title: v.string(),
    message: v.optional(v.string()),
    read: v.boolean(),
    // References
    publicFlowId: v.optional(v.id("publicFlows")),
    flowId: v.optional(v.id("flows")),
    marketplaceListingId: v.optional(v.id("marketplaceListings")),
    consultantProfileId: v.optional(v.id("consultantProfiles")),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_read", ["recipientId", "read"])
    .index("by_recipient_created", ["recipientId", "createdAt"]),

  // ===================
  // Pay-as-you-go billing
  // ===================
  //
  // Balance is stored in micro-USD (1 USD = 1_000_000 micros) as integers.
  // Display layer formats as USD; never exposes the unit to users.

  balances: defineTable({
    userId: v.id("users"),
    balanceMicros: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Append-only ledger of every credit/debit. The running balance is denormalized
  // onto each row for cheap history rendering and audit; the canonical source of
  // truth is `balances.balanceMicros`.
  balanceTransactions: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("topup"),
      v.literal("usage"),
      v.literal("refund"),
      v.literal("adjustment"),
    ),
    // Positive for credit, negative for debit. In micro-USD.
    deltaMicros: v.number(),
    runningBalanceMicros: v.number(),
    // Usage-only context
    generationType: v.optional(
      v.union(v.literal("image"), v.literal("video"), v.literal("text")),
    ),
    model: v.optional(v.string()),
    flowId: v.optional(v.id("flows")),
    nodeId: v.optional(v.string()),
    // Top-up context
    polarCheckoutId: v.optional(v.string()),
    polarOrderId: v.optional(v.string()),
    // Free-form note (admin adjustments, refunds, etc.)
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_polar_checkout", ["polarCheckoutId"]),

  // ─── Legacy tables (TEMPORARY) ────────────────────────────────────────────
  //
  // These tables held credit/subscription/affiliate state from the old billing
  // model. They are kept here as permissive `v.any()` shells ONLY so the
  // wipeLegacyTables migration in convex/migrations.ts can iterate and delete
  // the rows. After running that migration, delete this whole block — schema
  // validation will then drop the (now empty) tables.

  subscriptions: defineTable(v.any()),
  creditBalances: defineTable(v.any()),
  creditPurchases: defineTable(v.any()),
  creditUsage: defineTable(v.any()),
  couponCodes: defineTable(v.any()),
  couponRedemptions: defineTable(v.any()),
  affiliates: defineTable(v.any()),
  affiliateReferrals: defineTable(v.any()),
  affiliatePayouts: defineTable(v.any()),

  // Enterprise inquiries
  enterpriseInquiries: defineTable({
    // Contact info
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    // Inquiry details
    message: v.optional(v.string()),
    teamSize: v.optional(v.string()),
    useCase: v.optional(v.string()),
    // Status
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("closed")
    ),
    // Optional user reference (if logged in)
    userId: v.optional(v.id("users")),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"]),
});

export default schema;
