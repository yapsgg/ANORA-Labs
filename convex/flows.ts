import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get a single flow by ID
export const get = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) return null;

    return flow;
  },
});

// Get flow with project info
// Returns data if user is owner OR if flow is published
export const getWithProject = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const flow = await ctx.db.get(args.flowId);
    if (!flow) return null;

    const isOwner = userId !== null && flow.userId === userId;

    // Check if flow is published or listed on marketplace (for non-owners)
    let isPublished = false;
    if (!isOwner) {
      const publicFlow = await ctx.db
        .query("publicFlows")
        .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
        .first();
      isPublished = !!publicFlow;

      // Also check marketplace listings
      if (!isPublished) {
        const marketplaceListing = await ctx.db
          .query("marketplaceListings")
          .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
          .first();
        if (marketplaceListing && marketplaceListing.status === "active") {
          isPublished = true;
        }
      }

      // If not owner and not published/listed, deny access
      if (!isPublished) return null;
    }

    const project = await ctx.db.get(flow.projectId);
    if (!project) return null;

    return {
      flow,
      project,
      isOwner,
      isPublished: isOwner ? undefined : isPublished,
    };
  },
});

// List all flows for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return [];

    return await ctx.db
      .query("flows")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Create a new flow
export const create = mutation({
  args: { name: v.string(), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const flowId = await ctx.db.insert("flows", {
      name: args.name,
      projectId: args.projectId,
      userId,
      updatedAt: Date.now(),
    });

    // Touch parent project's updatedAt
    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });

    return flowId;
  },
});

// Update flow name
export const update = mutation({
  args: {
    flowId: v.id("flows"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch(args.flowId, updates);

    return { success: true };
  },
});

// Remove a flow and all its data
// Returns info for client-side Bunny cleanup
export const remove = mutation({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    // Delete all workflow nodes
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    // Delete all workflow edges
    const edges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const edge of edges) {
      await ctx.db.delete(edge._id);
    }

    // Collect asset info for client-side Bunny cleanup
    const assets = await ctx.db
      .query("workflowAssets")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    const assetsToDelete = assets.map((asset) => ({
      type: asset.type,
      storagePath: asset.storagePath,
      videoId: asset.videoId,
    }));

    // Delete asset records from database
    for (const asset of assets) {
      await ctx.db.delete(asset._id);
    }

    // Collect cover info for client-side Bunny cleanup
    const coverToDelete = flow.coverStoragePath
      ? { storagePath: flow.coverStoragePath }
      : null;

    // Delete the flow
    await ctx.db.delete(args.flowId);

    // Return userId and flowId for client-side Bunny flow deletion
    return {
      success: true,
      userId: userId.toString(),
      flowId: args.flowId,
      assetsToDelete,
      coverToDelete,
    };
  },
});

// Update flow cover image (Bunny CDN)
// Returns old cover info for client-side Bunny deletion
export const updateCover = mutation({
  args: {
    flowId: v.id("flows"),
    coverUrl: v.string(),
    coverStoragePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    // Collect old cover info for client-side Bunny deletion
    const oldCoverInfo = flow.coverStoragePath
      ? { storagePath: flow.coverStoragePath }
      : null;

    await ctx.db.patch(args.flowId, {
      coverUrl: args.coverUrl,
      coverStoragePath: args.coverStoragePath,
      updatedAt: Date.now(),
    });

    // Sync cover to marketplace listing if one exists for this flow
    const listing = await ctx.db
      .query("marketplaceListings")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();
    if (listing) {
      await ctx.db.patch(listing._id, {
        coverUrl: args.coverUrl,
        updatedAt: Date.now(),
      });
    }

    return { success: true, coverUrl: args.coverUrl, oldCoverInfo };
  },
});

// Duplicate a flow
export const duplicate = mutation({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const now = Date.now();

    // Create new flow
    const newFlowId = await ctx.db.insert("flows", {
      name: `${flow.name} (copy)`,
      projectId: flow.projectId,
      userId,
      updatedAt: now,
      viewport: flow.viewport,
    });

    // Copy all nodes
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const node of nodes) {
      await ctx.db.insert("workflowNodes", {
        flowId: newFlowId,
        userId,
        nodeId: node.nodeId,
        type: node.type,
        position: node.position,
        data: node.data,
        measured: node.measured,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Copy all edges
    const edges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const edge of edges) {
      await ctx.db.insert("workflowEdges", {
        flowId: newFlowId,
        userId,
        edgeId: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update parent project timestamp
    await ctx.db.patch(flow.projectId, { updatedAt: now });

    return newFlowId;
  },
});
