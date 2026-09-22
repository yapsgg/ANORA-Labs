import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const listWithFlows = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return await Promise.all(
      projects.map(async (project) => {
        const flows = await ctx.db
          .query("flows")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        return { ...project, flows };
      })
    );
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.db.insert("projects", {
      name: args.name,
      userId,
      updatedAt: Date.now(),
    });
  },
});

// Update project name
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch(args.projectId, updates);

    return { success: true };
  },
});

// Remove a project and all its flows
// Returns info for client-side Bunny cleanup
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    // Collect all flow IDs for Bunny cleanup
    const flowsToDelete: Array<{ userId: string; flowId: string }> = [];

    // Delete all flows in the project (and their associated data)
    const flows = await ctx.db
      .query("flows")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const flow of flows) {
      // Collect flow info for Bunny cleanup
      flowsToDelete.push({
        userId: userId.toString(),
        flowId: flow._id,
      });

      // Delete all workflow nodes for this flow
      const nodes = await ctx.db
        .query("workflowNodes")
        .withIndex("by_flow", (q) => q.eq("flowId", flow._id))
        .collect();
      for (const node of nodes) {
        await ctx.db.delete(node._id);
      }

      // Delete all workflow edges for this flow
      const edges = await ctx.db
        .query("workflowEdges")
        .withIndex("by_flow", (q) => q.eq("flowId", flow._id))
        .collect();
      for (const edge of edges) {
        await ctx.db.delete(edge._id);
      }

      // Delete all assets for this flow
      const assets = await ctx.db
        .query("workflowAssets")
        .withIndex("by_flow", (q) => q.eq("flowId", flow._id))
        .collect();
      for (const asset of assets) {
        await ctx.db.delete(asset._id);
      }

      // Delete the flow
      await ctx.db.delete(flow._id);
    }

    // Delete all favorites for this project
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .collect();
    for (const fav of favorites) {
      await ctx.db.delete(fav._id);
    }

    await ctx.db.delete(args.projectId);

    // Return flow info for client-side Bunny cleanup
    return { success: true, flowsToDelete };
  },
});

// Update project cover image (Bunny CDN)
// Returns old image info for client-side Bunny deletion
export const updateCover = mutation({
  args: {
    projectId: v.id("projects"),
    imageUrl: v.string(),
    imageStoragePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    // Collect old image info for client-side Bunny deletion
    const oldImageInfo = project.imageStoragePath
      ? { storagePath: project.imageStoragePath }
      : null;

    await ctx.db.patch(args.projectId, {
      image: args.imageUrl,
      imageStoragePath: args.imageStoragePath,
      updatedAt: Date.now(),
    });

    return { success: true, imageUrl: args.imageUrl, oldImageInfo };
  },
});
