import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Shared fork logic — copies a flow's nodes and edges into a new flow
 * under the given user and project. Used by both publicFlows.fork and
 * marketplace.download / marketplace.purchase.
 */
export const forkFlowToProject = internalMutation({
  args: {
    sourceFlowId: v.id("flows"),
    targetProjectId: v.id("projects"),
    userId: v.id("users"),
    nameSuffix: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const suffix = args.nameSuffix ?? "(forked)";
    const originalFlow = await ctx.db.get(args.sourceFlowId);
    if (!originalFlow) {
      throw new Error("Original flow not found");
    }

    const now = Date.now();

    // Create new flow
    const newFlowId = await ctx.db.insert("flows", {
      name: `${originalFlow.name} ${suffix}`,
      projectId: args.targetProjectId,
      userId: args.userId,
      updatedAt: now,
      viewport: originalFlow.viewport,
      coverUrl: originalFlow.coverUrl,
    });

    // Copy all nodes
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.sourceFlowId))
      .collect();

    for (const node of nodes) {
      await ctx.db.insert("workflowNodes", {
        flowId: newFlowId,
        userId: args.userId,
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
      .withIndex("by_flow", (q) => q.eq("flowId", args.sourceFlowId))
      .collect();

    for (const edge of edges) {
      await ctx.db.insert("workflowEdges", {
        flowId: newFlowId,
        userId: args.userId,
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

    // Update target project timestamp
    await ctx.db.patch(args.targetProjectId, { updatedAt: now });

    return newFlowId;
  },
});
