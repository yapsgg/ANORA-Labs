import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Save asset reference after Bunny upload
export const saveAsset = mutation({
  args: {
    flowId: v.id("flows"),
    nodeId: v.string(),
    url: v.string(),
    storagePath: v.optional(v.string()),
    videoId: v.optional(v.string()),
    type: v.union(v.literal("image"), v.literal("video")),
    filename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const assetId = await ctx.db.insert("workflowAssets", {
      flowId: args.flowId,
      nodeId: args.nodeId,
      userId,
      url: args.url,
      storagePath: args.storagePath,
      videoId: args.videoId,
      type: args.type,
      filename: args.filename,
      mimeType: args.mimeType,
      size: args.size,
      createdAt: Date.now(),
    });

    return { assetId, url: args.url };
  },
});

// Get all assets for a flow
export const listByFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) return [];

    return await ctx.db
      .query("workflowAssets")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();
  },
});

// Get assets for a specific node
export const listByNode = query({
  args: {
    flowId: v.id("flows"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) return [];

    return await ctx.db
      .query("workflowAssets")
      .withIndex("by_node", (q) =>
        q.eq("flowId", args.flowId).eq("nodeId", args.nodeId)
      )
      .collect();
  },
});

// Delete an asset - returns info for client-side Bunny deletion
export const remove = mutation({
  args: { assetId: v.id("workflowAssets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.userId !== userId) {
      throw new Error("Asset not found");
    }

    // Collect deletion info for client-side Bunny cleanup
    const deletionInfo = {
      type: asset.type,
      storagePath: asset.storagePath,
      videoId: asset.videoId,
    };

    // Delete record from database
    await ctx.db.delete(args.assetId);

    return { success: true, deletionInfo };
  },
});

// Delete all assets for a node - returns info for client-side Bunny deletion
export const removeByNode = mutation({
  args: {
    flowId: v.id("flows"),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const assets = await ctx.db
      .query("workflowAssets")
      .withIndex("by_node", (q) =>
        q.eq("flowId", args.flowId).eq("nodeId", args.nodeId)
      )
      .collect();

    // Collect deletion info for client-side Bunny cleanup
    const assetsToDelete = assets.map((asset) => ({
      type: asset.type,
      storagePath: asset.storagePath,
      videoId: asset.videoId,
    }));

    // Delete records from database
    for (const asset of assets) {
      await ctx.db.delete(asset._id);
    }

    return { success: true, count: assets.length, assetsToDelete };
  },
});

// Upload and save in one step (convenience mutation for Bunny uploads)
// Called after the Bunny upload completes to save the reference
export const uploadComplete = mutation({
  args: {
    flowId: v.id("flows"),
    nodeId: v.string(),
    url: v.string(),
    storagePath: v.optional(v.string()),
    videoId: v.optional(v.string()),
    type: v.union(v.literal("image"), v.literal("video")),
    filename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    // Find any existing assets for this node of the same type
    const existingAssets = await ctx.db
      .query("workflowAssets")
      .withIndex("by_node", (q) =>
        q.eq("flowId", args.flowId).eq("nodeId", args.nodeId)
      )
      .filter((q) => q.eq(q.field("type"), args.type))
      .collect();

    // Collect deletion info for client-side Bunny cleanup
    const oldAssetsToDelete = existingAssets.map((asset) => ({
      type: asset.type,
      storagePath: asset.storagePath,
      videoId: asset.videoId,
    }));

    // Delete old records from database
    for (const asset of existingAssets) {
      await ctx.db.delete(asset._id);
    }

    // Save new asset
    const assetId = await ctx.db.insert("workflowAssets", {
      flowId: args.flowId,
      nodeId: args.nodeId,
      userId,
      url: args.url,
      storagePath: args.storagePath,
      videoId: args.videoId,
      type: args.type,
      filename: args.filename,
      mimeType: args.mimeType,
      size: args.size,
      createdAt: Date.now(),
    });

    return { assetId, url: args.url, oldAssetsToDelete };
  },
});
