import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Check if a flow is published
export const isPublished = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const publicFlow = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    return !!publicFlow;
  },
});

// Get public flow info for a flow
export const getPublicFlowInfo = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const flow = await ctx.db.get(args.flowId);
    if (!flow) return null;

    const publicFlow = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    const isOwner = userId !== null && flow.userId === userId;

    return {
      flow: {
        _id: flow._id,
        name: flow.name,
        userId: flow.userId,
      },
      isPublished: !!publicFlow,
      isOwner,
      publicFlow: publicFlow
        ? {
            _id: publicFlow._id,
            forkCount: publicFlow.forkCount,
            viewCount: publicFlow.viewCount,
            publishedAt: publicFlow.publishedAt,
          }
        : null,
    };
  },
});

// Get a public flow by ID (for viewing/forking)
export const getPublicFlow = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const publicFlow = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    if (!publicFlow) return null;

    // Get the original flow
    const flow = await ctx.db.get(args.flowId);
    if (!flow) return null;

    // Get nodes and edges
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    const edges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    return {
      publicFlow,
      flow,
      nodes,
      edges,
    };
  },
});

// List all public flows (for discovery)
export const listPublicFlows = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const publicFlows = await ctx.db
      .query("publicFlows")
      .withIndex("by_published")
      .order("desc")
      .take(limit);

    return publicFlows;
  },
});

// Publish a flow (make it public)
export const publish = mutation({
  args: {
    flowId: v.id("flows"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Check if user owns the flow
    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found or not authorized");
    }

    // Check if already published
    const existing = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    if (existing) {
      throw new Error("Flow is already published");
    }

    // Get publisher info
    const user = await ctx.db.get(userId);
    const publisherName = user?.name ?? "Anonymous";

    // Create public flow entry
    const publicFlowId = await ctx.db.insert("publicFlows", {
      flowId: args.flowId,
      publisherId: userId,
      publisherName,
      name: flow.name,
      description: args.description,
      coverUrl: flow.coverUrl,
      forkCount: 0,
      viewCount: 0,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, publicFlowId };
  },
});

// Unpublish a flow (make it private)
export const unpublish = mutation({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Check if user owns the flow
    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found or not authorized");
    }

    // Find and delete the public flow entry
    const publicFlow = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    if (!publicFlow) {
      throw new Error("Flow is not published");
    }

    await ctx.db.delete(publicFlow._id);

    return { success: true };
  },
});

// Fork a public flow (duplicate to user's account)
export const fork = mutation({
  args: {
    flowId: v.id("flows"),
    targetProjectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // Check if flow is published
    const publicFlow = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    if (!publicFlow) {
      throw new Error("Flow is not published or does not exist");
    }

    // Check if target project exists and belongs to user
    const targetProject = await ctx.db.get(args.targetProjectId);
    if (!targetProject || targetProject.userId !== userId) {
      throw new Error("Target project not found or not authorized");
    }

    // Get the original flow
    const originalFlow = await ctx.db.get(args.flowId);
    if (!originalFlow) {
      throw new Error("Original flow not found");
    }

    const now = Date.now();

    // Create new flow
    const newFlowId = await ctx.db.insert("flows", {
      name: `${originalFlow.name} (forked)`,
      projectId: args.targetProjectId,
      userId,
      updatedAt: now,
      viewport: originalFlow.viewport,
      coverUrl: originalFlow.coverUrl,
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

    // Record the fork
    await ctx.db.insert("flowForks", {
      publicFlowId: publicFlow._id,
      originalFlowId: args.flowId,
      forkedFlowId: newFlowId,
      userId,
      forkedAt: now,
    });

    // Increment fork count
    await ctx.db.patch(publicFlow._id, {
      forkCount: publicFlow.forkCount + 1,
      updatedAt: now,
    });

    // Notify the publisher (don't notify if user forks their own flow)
    if (publicFlow.publisherId !== userId) {
      const actor = await ctx.db.get(userId);
      const actorName = actor?.name ?? "Someone";
      await ctx.db.insert("notifications", {
        recipientId: publicFlow.publisherId,
        actorId: userId,
        type: "flow_forked",
        title: `${actorName} remixed your flow "${publicFlow.name}"`,
        read: false,
        publicFlowId: publicFlow._id,
        flowId: args.flowId,
        createdAt: now,
      });
    }

    // Update target project timestamp
    await ctx.db.patch(args.targetProjectId, { updatedAt: now });

    return { success: true, forkedFlowId: newFlowId };
  },
});

// Increment view count for a public flow
export const incrementViewCount = mutation({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const publicFlow = await ctx.db
      .query("publicFlows")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .first();

    if (!publicFlow) return { success: false };

    await ctx.db.patch(publicFlow._id, {
      viewCount: publicFlow.viewCount + 1,
    });

    return { success: true };
  },
});
