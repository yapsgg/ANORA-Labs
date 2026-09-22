import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";


// ===================
// Queries
// ===================

/**
 * List active marketplace listings with optional filtering and sorting.
 * Supports category filter, pricing type filter, and sort order.
 */
export const listActive = query({
  args: {
    category: v.optional(v.string()),
    pricingType: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    sort: v.optional(
      v.union(v.literal("newest"), v.literal("popular"), v.literal("top-rated"))
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Query active listings using the status index
    let listings = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter by category if provided
    if (args.category) {
      listings = listings.filter((l) => l.category === args.category);
    }

    // Filter by pricing type if provided
    if (args.pricingType) {
      listings = listings.filter((l) => l.pricingType === args.pricingType);
    }

    // Sort results
    const sort = args.sort ?? "newest";
    if (sort === "newest") {
      listings.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "popular") {
      listings.sort((a, b) => b.downloadCount - a.downloadCount);
    } else if (sort === "top-rated") {
      listings.sort((a, b) => {
        const avgA = a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0;
        const avgB = b.ratingCount > 0 ? b.ratingSum / b.ratingCount : 0;
        return avgB - avgA;
      });
    }

    // Cursor-based pagination: skip items up to cursor
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = listings.findIndex((l) => l._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const page = listings.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < listings.length
        ? page[page.length - 1]?._id
        : undefined;

    return {
      listings: page,
      nextCursor,
    };
  },
});

/**
 * List featured active marketplace listings.
 */
export const listFeatured = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    const listings = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();

    // Only return active featured listings
    const active = listings.filter((l) => l.status === "active");

    return active.slice(0, limit);
  },
});

/**
 * Get a marketplace listing by its ID.
 */
export const getById = query({
  args: { listingId: v.id("marketplaceListings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.listingId);
  },
});

/**
 * Check if a flow has a marketplace listing.
 */
export const getByFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    return listing ?? null;
  },
});

/**
 * Check if the current user has already downloaded a listing.
 */
export const hasUserDownloaded = query({
  args: { listingId: v.id("marketplaceListings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;

    const download = await ctx.db
      .query("marketplaceDownloads")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("listingId", args.listingId)
      )
      .first();

    return !!download;
  },
});

/**
 * Search marketplace listings by name.
 * Uses the Convex search index for full-text search.
 */
export const search = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const searchQuery = ctx.db
      .query("marketplaceListings")
      .withSearchIndex("search_name", (q) => {
        let sq = q.search("name", args.query).eq("status", "active");
        if (args.category) {
          sq = sq.eq("category", args.category);
        }
        return sq;
      });

    const results = await searchQuery.take(limit);

    return results;
  },
});

// ===================
// Mutations
// ===================

/**
 * Publish a flow to the marketplace.
 * Creates a new listing from an existing flow.
 */
export const publish = mutation({
  args: {
    flowId: v.id("flows"),
    name: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    pricingType: v.union(v.literal("free"), v.literal("paid")),
    priceInCents: v.optional(v.number()),
    features: v.array(v.string()),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Check if user owns the flow
    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found or not authorized");
    }

    // Check if listing already exists for this flow
    const existing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    if (existing) {
      throw new Error("A marketplace listing already exists for this flow");
    }

    // Get publisher info
    const user = await ctx.db.get(userId);
    const publisherName = user?.name ?? "Anonymous";
    const publisherAvatarUrl = user?.image ?? undefined;

    const now = Date.now();

    const listingId = await ctx.db.insert("marketplaceListings", {
      flowId: args.flowId,
      publisherId: userId,
      publisherName,
      publisherAvatarUrl,
      name: args.name,
      description: args.description,
      longDescription: args.longDescription,
      coverUrl: flow.coverUrl,
      category: args.category,
      tags: args.tags,
      pricingType: args.pricingType,
      priceInCents: args.priceInCents ?? 0,
      downloadCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      version: args.version ?? "1.0.0",
      lastVersionAt: now,
      features: args.features,
      status: "active",
      featured: false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, listingId };
  },
});

/**
 * Update an existing marketplace listing.
 * Only the publisher can update their listing.
 */
export const update = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    longDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pricingType: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    priceInCents: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    version: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("draft"),
        v.literal("under_review"),
        v.literal("rejected"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.publisherId !== userId) {
      throw new Error("Listing not found or not authorized");
    }

    const now = Date.now();

    // Build patch object with only provided fields
    const patch: Record<string, unknown> = { updatedAt: now };

    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.longDescription !== undefined)
      patch.longDescription = args.longDescription;
    if (args.category !== undefined) patch.category = args.category;
    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.pricingType !== undefined) patch.pricingType = args.pricingType;
    if (args.priceInCents !== undefined) patch.priceInCents = args.priceInCents;
    if (args.features !== undefined) patch.features = args.features;
    if (args.version !== undefined) {
      patch.version = args.version;
      patch.lastVersionAt = now;
    }
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.listingId, patch);

    return { success: true };
  },
});

/**
 * Archive (unpublish) a marketplace listing.
 * Only the publisher can archive their listing.
 */
export const unpublish = mutation({
  args: { listingId: v.id("marketplaceListings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.publisherId !== userId) {
      throw new Error("Listing not found or not authorized");
    }

    await ctx.db.patch(args.listingId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Download a free marketplace listing.
 * Forks the flow into the user's project and records the download.
 */
export const download = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    targetProjectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Get the listing
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not found or not active");
    }

    if (listing.pricingType !== "free") {
      throw new Error("This listing is not free. Use purchase instead.");
    }

    // Check if already downloaded
    const existingDownload = await ctx.db
      .query("marketplaceDownloads")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("listingId", args.listingId)
      )
      .first();

    if (existingDownload) {
      throw new Error("You have already downloaded this listing");
    }

    // Check target project belongs to user
    const targetProject = await ctx.db.get(args.targetProjectId);
    if (!targetProject || targetProject.userId !== userId) {
      throw new Error("Target project not found or not authorized");
    }

    // Fork the flow into the user's project
    const newFlowId: Id<"flows"> = await ctx.runMutation(
      internal.helpers.forkFlowToProject,
      {
        sourceFlowId: listing.flowId,
        targetProjectId: args.targetProjectId,
        userId,
        nameSuffix: "(marketplace)",
      }
    );

    const now = Date.now();

    // Record the download
    await ctx.db.insert("marketplaceDownloads", {
      listingId: args.listingId,
      userId,
      flowId: newFlowId,
      pricePaidInCents: 0,
      downloadedAt: now,
    });

    // Increment download count
    await ctx.db.patch(args.listingId, {
      downloadCount: listing.downloadCount + 1,
      updatedAt: now,
    });

    // Notify publisher (don't notify if downloading own listing)
    if (listing.publisherId !== userId) {
      const actor = await ctx.db.get(userId);
      const actorName = actor?.name ?? "Someone";
      await ctx.db.insert("notifications", {
        recipientId: listing.publisherId,
        actorId: userId,
        type: "marketplace_download",
        title: `${actorName} downloaded your listing "${listing.name}"`,
        read: false,
        marketplaceListingId: args.listingId,
        createdAt: now,
      });
    }

    return { success: true, forkedFlowId: newFlowId };
  },
});

/**
 * Fulfill a paid marketplace purchase after Polar payment succeeds.
 * Called from the checkout success page — forks the flow and records the download.
 */
export const fulfillPurchase = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    targetProjectId: v.id("projects"),
    polarCheckoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Idempotency: check if this checkout was already fulfilled
    const existingByCheckout = await ctx.db
      .query("marketplaceDownloads")
      .withIndex("by_polar_checkout", (q) =>
        q.eq("polarCheckoutId", args.polarCheckoutId)
      )
      .first();

    if (existingByCheckout) {
      return { success: true, alreadyFulfilled: true, forkedFlowId: existingByCheckout.flowId };
    }

    // Get the listing
    const listing = await ctx.db.get(args.listingId);
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not found or not active");
    }

    // Check if already downloaded/purchased by other means
    const existingDownload = await ctx.db
      .query("marketplaceDownloads")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("listingId", args.listingId)
      )
      .first();

    if (existingDownload) {
      return { success: true, alreadyFulfilled: true, forkedFlowId: existingDownload.flowId };
    }

    // Check target project belongs to user
    const targetProject = await ctx.db.get(args.targetProjectId);
    if (!targetProject || targetProject.userId !== userId) {
      throw new Error("Target project not found or not authorized");
    }

    // Fork the flow into the user's project
    const newFlowId: Id<"flows"> = await ctx.runMutation(
      internal.helpers.forkFlowToProject,
      {
        sourceFlowId: listing.flowId,
        targetProjectId: args.targetProjectId,
        userId,
        nameSuffix: "(marketplace)",
      }
    );

    const now = Date.now();

    // Record the purchase
    await ctx.db.insert("marketplaceDownloads", {
      listingId: args.listingId,
      userId,
      flowId: newFlowId,
      pricePaidInCents: listing.priceInCents,
      polarCheckoutId: args.polarCheckoutId,
      downloadedAt: now,
    });

    // Increment download count
    await ctx.db.patch(args.listingId, {
      downloadCount: listing.downloadCount + 1,
      updatedAt: now,
    });

    // Notify publisher (don't notify if purchasing own listing)
    if (listing.publisherId !== userId) {
      const actor = await ctx.db.get(userId);
      const actorName = actor?.name ?? "Someone";
      await ctx.db.insert("notifications", {
        recipientId: listing.publisherId,
        actorId: userId,
        type: "marketplace_purchase",
        title: `${actorName} purchased your listing "${listing.name}"`,
        read: false,
        marketplaceListingId: args.listingId,
        createdAt: now,
      });
    }

    return { success: true, alreadyFulfilled: false, forkedFlowId: newFlowId };
  },
});

