import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ==================
// Project Favorites
// ==================

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const results = await Promise.all(
      favorites.map(async (fav) => {
        const project = await ctx.db.get(fav.projectId);
        if (!project) return null;
        return { ...fav, project };
      })
    );
    return results.filter((r) => r !== null);
  },
});

export const toggle = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("favorites", {
        userId,
        projectId: args.projectId,
      });
      return true;
    }
  },
});

export const isFavorited = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .unique();
    return existing !== null;
  },
});

// ==================
// Flow Favorites
// ==================

export const listFlowFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const favorites = await ctx.db
      .query("flowFavorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const results = await Promise.all(
      favorites.map(async (fav) => {
        const flow = await ctx.db.get(fav.flowId);
        if (!flow) return null;
        return { ...fav, flow };
      })
    );
    return results.filter((r) => r !== null);
  },
});

export const toggleFlowFavorite = mutation({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("flowFavorites")
      .withIndex("by_user_flow", (q) =>
        q.eq("userId", userId).eq("flowId", args.flowId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("flowFavorites", {
        userId,
        flowId: args.flowId,
      });
      return true;
    }
  },
});

export const isFlowFavorited = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const existing = await ctx.db
      .query("flowFavorites")
      .withIndex("by_user_flow", (q) =>
        q.eq("userId", userId).eq("flowId", args.flowId)
      )
      .unique();
    return existing !== null;
  },
});
