import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ===================
// Queries
// ===================

/**
 * Get all enterprise inquiries (admin only - for future use)
 */
export const getAll = query({
  args: { status: v.optional(v.union(
    v.literal("new"),
    v.literal("contacted"),
    v.literal("qualified"),
    v.literal("closed")
  )) },
  handler: async (ctx, args) => {
    // TODO: Add admin check when admin system is implemented

    if (args.status) {
      return await ctx.db
        .query("enterpriseInquiries")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("enterpriseInquiries")
      .order("desc")
      .collect();
  },
});

/**
 * Get inquiry by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("enterpriseInquiries")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// ===================
// Mutations
// ===================

/**
 * Submit an enterprise inquiry
 */
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    message: v.optional(v.string()),
    teamSize: v.optional(v.string()),
    useCase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    // Check for existing inquiry from this email
    const existing = await ctx.db
      .query("enterpriseInquiries")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      // Update existing inquiry
      await ctx.db.patch(existing._id, {
        name: args.name,
        company: args.company,
        message: args.message,
        teamSize: args.teamSize,
        useCase: args.useCase,
        userId: userId || existing.userId,
        updatedAt: now,
      });
      return { success: true, isUpdate: true, id: existing._id };
    }

    // Create new inquiry
    const id = await ctx.db.insert("enterpriseInquiries", {
      name: args.name,
      email: args.email,
      company: args.company,
      message: args.message,
      teamSize: args.teamSize,
      useCase: args.useCase,
      status: "new",
      userId: userId || undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, isUpdate: false, id };
  },
});

/**
 * Update inquiry status (admin)
 */
export const updateStatus = internalMutation({
  args: {
    inquiryId: v.id("enterpriseInquiries"),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inquiryId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
