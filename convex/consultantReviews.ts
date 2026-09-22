import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List reviews for a consultant, ordered by createdAt desc.
 * Public query.
 */
export const listByConsultant = query({
  args: {
    consultantId: v.id("consultantProfiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const reviews = await ctx.db
      .query("consultantReviews")
      .withIndex("by_consultant", (q) =>
        q.eq("consultantId", args.consultantId)
      )
      .collect();

    // Sort by createdAt desc and limit
    reviews.sort((a, b) => b.createdAt - a.createdAt);
    return reviews.slice(0, limit);
  },
});

/**
 * Get the current user's review for a given consultant (or null).
 */
export const getUserReview = query({
  args: { consultantId: v.id("consultantProfiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    return await ctx.db
      .query("consultantReviews")
      .withIndex("by_user_consultant", (q) =>
        q.eq("userId", userId).eq("consultantId", args.consultantId)
      )
      .first();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a review for a consultant.
 * - Must be authenticated
 * - Cannot review yourself
 * - Cannot already have a review for this consultant
 * - Updates the consultant's ratingSum and ratingCount
 */
export const create = mutation({
  args: {
    consultantId: v.id("consultantProfiles"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Validate rating range
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Get the consultant profile
    const profile = await ctx.db.get(args.consultantId);
    if (!profile) throw new Error("Consultant not found");

    // Cannot review yourself
    if (profile.userId === userId) {
      throw new Error("You cannot review yourself");
    }

    // Check for existing review
    const existingReview = await ctx.db
      .query("consultantReviews")
      .withIndex("by_user_consultant", (q) =>
        q.eq("userId", userId).eq("consultantId", args.consultantId)
      )
      .first();
    if (existingReview) {
      throw new Error("You have already reviewed this consultant");
    }

    // Get user info for the review
    const user = await ctx.db.get(userId);
    const userName = user?.name ?? "Anonymous";

    // Create the review
    const reviewId = await ctx.db.insert("consultantReviews", {
      consultantId: args.consultantId,
      userId,
      userName,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Update consultant ratingSum and ratingCount
    await ctx.db.patch(args.consultantId, {
      ratingSum: profile.ratingSum + args.rating,
      ratingCount: profile.ratingCount + 1,
      updatedAt: Date.now(),
    });

    return reviewId;
  },
});

/**
 * Update an existing review.
 * - Must be the review author
 * - Adjusts the consultant's ratingSum accordingly
 */
export const update = mutation({
  args: {
    reviewId: v.id("consultantReviews"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Validate rating range
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) {
      throw new Error("Not authorized to edit this review");
    }

    // Adjust the consultant's ratingSum
    const profile = await ctx.db.get(review.consultantId);
    if (profile) {
      const ratingDiff = args.rating - review.rating;
      await ctx.db.patch(review.consultantId, {
        ratingSum: profile.ratingSum + ratingDiff,
        updatedAt: Date.now(),
      });
    }

    // Update the review
    await ctx.db.patch(args.reviewId, {
      rating: args.rating,
      comment: args.comment,
    });

    return { success: true };
  },
});

/**
 * Remove a review.
 * - Must be the review author
 * - Adjusts the consultant's ratingSum and ratingCount
 */
export const remove = mutation({
  args: { reviewId: v.id("consultantReviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) {
      throw new Error("Not authorized to delete this review");
    }

    // Adjust the consultant's ratingSum and ratingCount
    const profile = await ctx.db.get(review.consultantId);
    if (profile) {
      await ctx.db.patch(review.consultantId, {
        ratingSum: profile.ratingSum - review.rating,
        ratingCount: profile.ratingCount - 1,
        updatedAt: Date.now(),
      });
    }

    // Delete the review
    await ctx.db.delete(args.reviewId);
    return { success: true };
  },
});
