import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===================
// Queries
// ===================

/**
 * List reviews for a marketplace listing, most recent first.
 */
export const listByListing = query({
  args: {
    listingId: v.id("marketplaceListings"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const reviews = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .collect();

    // Sort by createdAt descending (most recent first)
    reviews.sort((a, b) => b.createdAt - a.createdAt);

    return reviews.slice(0, limit);
  },
});

/**
 * Get the current user's review for a specific listing.
 */
export const getUserReview = query({
  args: { listingId: v.id("marketplaceListings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const review = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("listingId", args.listingId)
      )
      .first();

    return review ?? null;
  },
});

// ===================
// Mutations
// ===================

/**
 * Create a review for a marketplace listing.
 * User must have downloaded the listing and not already reviewed it.
 */
export const create = mutation({
  args: {
    listingId: v.id("marketplaceListings"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Validate rating
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    // Check listing exists
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Check user has downloaded the listing
    const download = await ctx.db
      .query("marketplaceDownloads")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("listingId", args.listingId)
      )
      .first();

    if (!download) {
      throw new Error("You must download this listing before reviewing it");
    }

    // Check user hasn't already reviewed
    const existingReview = await ctx.db
      .query("marketplaceReviews")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("listingId", args.listingId)
      )
      .first();

    if (existingReview) {
      throw new Error("You have already reviewed this listing");
    }

    // Get user info
    const user = await ctx.db.get(userId);
    const userName = user?.name ?? "Anonymous";
    const userAvatarUrl = user?.image ?? undefined;

    const now = Date.now();

    // Create the review
    const reviewId = await ctx.db.insert("marketplaceReviews", {
      listingId: args.listingId,
      userId,
      userName,
      userAvatarUrl,
      rating: args.rating,
      comment: args.comment,
      createdAt: now,
      updatedAt: now,
    });

    // Update listing rating stats
    await ctx.db.patch(args.listingId, {
      ratingSum: listing.ratingSum + args.rating,
      ratingCount: listing.ratingCount + 1,
      updatedAt: now,
    });

    // Notify publisher (don't notify if reviewing own listing)
    if (listing.publisherId !== userId) {
      const actorName = userName;
      await ctx.db.insert("notifications", {
        recipientId: listing.publisherId,
        actorId: userId,
        type: "marketplace_review",
        title: `${actorName} reviewed your listing "${listing.name}" (${args.rating}/5)`,
        read: false,
        marketplaceListingId: args.listingId,
        createdAt: now,
      });
    }

    return { success: true, reviewId };
  },
});

/**
 * Update an existing review.
 * Only the review author can update their review.
 */
export const update = mutation({
  args: {
    reviewId: v.id("marketplaceReviews"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Validate rating
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or not authorized");
    }

    // Get the listing to adjust rating stats
    const listing = await ctx.db.get(review.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const now = Date.now();
    const oldRating = review.rating;

    // Update the review
    await ctx.db.patch(args.reviewId, {
      rating: args.rating,
      comment: args.comment,
      updatedAt: now,
    });

    // Adjust listing ratingSum: subtract old, add new
    await ctx.db.patch(review.listingId, {
      ratingSum: listing.ratingSum - oldRating + args.rating,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Remove a review.
 * Only the review author can remove their review.
 */
export const remove = mutation({
  args: { reviewId: v.id("marketplaceReviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const review = await ctx.db.get(args.reviewId);
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or not authorized");
    }

    // Get the listing to adjust rating stats
    const listing = await ctx.db.get(review.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const now = Date.now();

    // Subtract rating from listing stats
    await ctx.db.patch(review.listingId, {
      ratingSum: listing.ratingSum - review.rating,
      ratingCount: listing.ratingCount - 1,
      updatedAt: now,
    });

    // Delete the review
    await ctx.db.delete(args.reviewId);

    return { success: true };
  },
});
