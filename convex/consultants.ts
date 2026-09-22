import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List active consultant profiles with optional specialty filter.
 * Public query — does not require authentication.
 */
export const listActive = query({
  args: {
    specialty: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const profiles = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter by specialty in JS if provided
    let filtered = profiles;
    if (args.specialty) {
      filtered = profiles.filter((p) =>
        p.specialties.includes(args.specialty!)
      );
    }

    // Sort by createdAt desc and limit
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    return filtered.slice(0, limit);
  },
});

/**
 * List featured + active consultant profiles.
 * Public query.
 */
export const listFeatured = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    const profiles = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();

    // Only return those that are also active
    const active = profiles.filter((p) => p.status === "active");

    // Sort by createdAt desc and limit
    active.sort((a, b) => b.createdAt - a.createdAt);
    return active.slice(0, limit);
  },
});

/**
 * Get a single consultant profile by its ID.
 * Public query.
 */
export const getById = query({
  args: { consultantId: v.id("consultantProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.consultantId);
  },
});

/**
 * Get the current authenticated user's consultant profile (or null).
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const profiles = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return profiles[0] ?? null;
  },
});

/**
 * Get services for a consultant, ordered by sortOrder.
 * Public query.
 */
export const getServices = query({
  args: { consultantId: v.id("consultantProfiles") },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query("consultantServices")
      .withIndex("by_consultant", (q) =>
        q.eq("consultantId", args.consultantId)
      )
      .collect();

    services.sort((a, b) => a.sortOrder - b.sortOrder);
    return services;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Register as a consultant. Creates a new consultant profile.
 */
export const createProfile = mutation({
  args: {
    displayName: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    specialties: v.array(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    projectTypes: v.optional(v.array(v.string())),
    regions: v.optional(v.array(v.string())),
    contactEmail: v.optional(v.string()),
    bookingUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Check no existing profile for this user
    const existing = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      throw new Error("You already have a consultant profile");
    }

    // Check username uniqueness
    const usernameTaken = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (usernameTaken) {
      throw new Error("Username is already taken");
    }

    const now = Date.now();
    return await ctx.db.insert("consultantProfiles", {
      userId,
      displayName: args.displayName,
      username: args.username,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      bannerUrl: args.bannerUrl,
      specialties: args.specialties,
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      projectTypes: args.projectTypes ?? [],
      regions: args.regions ?? [],
      contactEmail: args.contactEmail,
      bookingUrl: args.bookingUrl,
      verified: false,
      availableForWork: true,
      ratingSum: 0,
      ratingCount: 0,
      completedProjects: 0,
      featured: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing consultant profile. Only the profile owner can edit.
 */
export const updateProfile = mutation({
  args: {
    consultantId: v.id("consultantProfiles"),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    projectTypes: v.optional(v.array(v.string())),
    regions: v.optional(v.array(v.string())),
    contactEmail: v.optional(v.string()),
    bookingUrl: v.optional(v.string()),
    availableForWork: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const profile = await ctx.db.get(args.consultantId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Consultant profile not found");
    }

    // If username is changing, check uniqueness
    if (args.username !== undefined && args.username !== profile.username) {
      const usernameTaken = await ctx.db
        .query("consultantProfiles")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .first();
      if (usernameTaken) {
        throw new Error("Username is already taken");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.username !== undefined) updates.username = args.username;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.bannerUrl !== undefined) updates.bannerUrl = args.bannerUrl;
    if (args.specialties !== undefined) updates.specialties = args.specialties;
    if (args.budgetMin !== undefined) updates.budgetMin = args.budgetMin;
    if (args.budgetMax !== undefined) updates.budgetMax = args.budgetMax;
    if (args.projectTypes !== undefined) updates.projectTypes = args.projectTypes;
    if (args.regions !== undefined) updates.regions = args.regions;
    if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail;
    if (args.bookingUrl !== undefined) updates.bookingUrl = args.bookingUrl;
    if (args.availableForWork !== undefined) updates.availableForWork = args.availableForWork;

    await ctx.db.patch(args.consultantId, updates);
    return { success: true };
  },
});

/**
 * Add a service to a consultant profile. Only the profile owner can add.
 */
export const addService = mutation({
  args: {
    consultantId: v.id("consultantProfiles"),
    name: v.string(),
    description: v.optional(v.string()),
    priceInCents: v.number(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const profile = await ctx.db.get(args.consultantId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Consultant profile not found");
    }

    const now = Date.now();
    return await ctx.db.insert("consultantServices", {
      consultantId: args.consultantId,
      name: args.name,
      description: args.description,
      priceInCents: args.priceInCents,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing service. Only the owning consultant can edit.
 */
export const updateService = mutation({
  args: {
    serviceId: v.id("consultantServices"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    priceInCents: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error("Service not found");

    const profile = await ctx.db.get(service.consultantId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Not authorized to edit this service");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priceInCents !== undefined) updates.priceInCents = args.priceInCents;
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;

    await ctx.db.patch(args.serviceId, updates);
    return { success: true };
  },
});

/**
 * Remove a service. Only the owning consultant can delete.
 */
export const removeService = mutation({
  args: { serviceId: v.id("consultantServices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error("Service not found");

    const profile = await ctx.db.get(service.consultantId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Not authorized to delete this service");
    }

    await ctx.db.delete(args.serviceId);
    return { success: true };
  },
});
