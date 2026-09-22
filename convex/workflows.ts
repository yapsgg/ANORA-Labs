import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Validators
const positionValidator = v.object({
  x: v.number(),
  y: v.number(),
});

const nodeConfigValidator = v.object({
  model: v.optional(v.string()),
  temperature: v.optional(v.number()),
  size: v.optional(v.string()),
  duration: v.optional(v.number()),
  ratio: v.optional(v.string()),
  resolution: v.optional(v.string()),
  // When true, the node delegates model selection (OpenRouter Auto Router
  // for text, local resolver for image) instead of using `model` directly.
  auto: v.optional(v.boolean()),
});

const nodeDataValidator = v.object({
  title: v.optional(v.string()),
  label: v.optional(v.string()),
  icon: v.optional(v.string()),
  status: v.optional(v.union(
    v.literal("loading"),
    v.literal("success"),
    v.literal("error"),
    v.literal("initial")
  )),
  error: v.optional(v.string()),
  config: v.optional(nodeConfigValidator),
  text: v.optional(v.string()),
  prompt: v.optional(v.string()),
  image: v.optional(v.string()),
  video: v.optional(v.string()),
  author: v.optional(v.string()),
  createdAt: v.optional(v.string()),
  resolved: v.optional(v.boolean()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  isUploaded: v.optional(v.boolean()),
});

const measuredValidator = v.optional(v.object({
  width: v.optional(v.number()),
  height: v.optional(v.number()),
}));

const nodeInputValidator = v.object({
  nodeId: v.string(),
  type: v.union(
    v.literal("generate-text-node"),
    v.literal("generate-image-node"),
    v.literal("generate-video-node"),
    v.literal("comment-node")
  ),
  position: positionValidator,
  data: nodeDataValidator,
  measured: measuredValidator,
});

const edgeInputValidator = v.object({
  edgeId: v.string(),
  source: v.string(),
  target: v.string(),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  type: v.optional(v.string()),
});

const viewportValidator = v.object({
  x: v.number(),
  y: v.number(),
  zoom: v.number(),
});

// Load complete workflow (nodes + edges) for a flow
// Returns data if user is owner OR if flow is published
export const load = query({
  args: { flowId: v.id("flows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const flow = await ctx.db.get(args.flowId);
    if (!flow) return null;

    const isOwner = userId !== null && flow.userId === userId;

    // Check if flow is published (for non-owners)
    let isPublished = false;
    if (!isOwner) {
      const publicFlow = await ctx.db
        .query("publicFlows")
        .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
        .first();
      isPublished = !!publicFlow;

      // If not owner and not published, deny access
      if (!isPublished) return null;
    }

    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    const edges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    // Transform to React Flow format
    const reactFlowNodes = nodes.map((node) => ({
      id: node.nodeId,
      type: node.type,
      position: node.position,
      data: node.data,
      measured: node.measured,
      selected: node.selected,
      dragging: node.dragging,
    }));

    const reactFlowEdges = edges.map((edge) => ({
      id: edge.edgeId,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
    }));

    return {
      flow,
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
      viewport: flow.viewport,
      isOwner,
      isPublished: isOwner ? undefined : isPublished,
    };
  },
});

// Save complete workflow (replaces all nodes + edges)
export const save = mutation({
  args: {
    flowId: v.id("flows"),
    nodes: v.array(nodeInputValidator),
    edges: v.array(edgeInputValidator),
    viewport: v.optional(viewportValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const now = Date.now();

    // Delete existing nodes and edges
    const existingNodes = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    const existingEdges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_flow", (q) => q.eq("flowId", args.flowId))
      .collect();

    for (const node of existingNodes) {
      await ctx.db.delete(node._id);
    }

    for (const edge of existingEdges) {
      await ctx.db.delete(edge._id);
    }

    // Insert new nodes
    for (const node of args.nodes) {
      await ctx.db.insert("workflowNodes", {
        flowId: args.flowId,
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

    // Insert new edges
    for (const edge of args.edges) {
      await ctx.db.insert("workflowEdges", {
        flowId: args.flowId,
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

    // Update flow with viewport and timestamp
    await ctx.db.patch(args.flowId, {
      updatedAt: now,
      viewport: args.viewport,
    });

    // Also update parent project timestamp
    await ctx.db.patch(flow.projectId, { updatedAt: now });

    return { success: true };
  },
});

// Update single node (for real-time sync)
export const updateNode = mutation({
  args: {
    flowId: v.id("flows"),
    nodeId: v.string(),
    position: v.optional(positionValidator),
    data: v.optional(nodeDataValidator),
    measured: measuredValidator,
    selected: v.optional(v.boolean()),
    dragging: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const existingNode = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow_nodeId", (q) =>
        q.eq("flowId", args.flowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!existingNode) {
      throw new Error("Node not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.position) updates.position = args.position;
    if (args.data) updates.data = { ...existingNode.data, ...args.data };
    if (args.measured !== undefined) updates.measured = args.measured;
    if (args.selected !== undefined) updates.selected = args.selected;
    if (args.dragging !== undefined) updates.dragging = args.dragging;

    await ctx.db.patch(existingNode._id, updates);

    return { success: true };
  },
});

// Add single node
export const addNode = mutation({
  args: {
    flowId: v.id("flows"),
    node: nodeInputValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const now = Date.now();

    await ctx.db.insert("workflowNodes", {
      flowId: args.flowId,
      userId,
      nodeId: args.node.nodeId,
      type: args.node.type,
      position: args.node.position,
      data: args.node.data,
      measured: args.node.measured,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.flowId, { updatedAt: now });

    return { success: true };
  },
});

// Remove single node (and its connected edges)
export const removeNode = mutation({
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

    // Delete the node
    const node = await ctx.db
      .query("workflowNodes")
      .withIndex("by_flow_nodeId", (q) =>
        q.eq("flowId", args.flowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (node) {
      await ctx.db.delete(node._id);
    }

    // Delete connected edges
    const sourceEdges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_source", (q) =>
        q.eq("flowId", args.flowId).eq("source", args.nodeId)
      )
      .collect();

    const targetEdges = await ctx.db
      .query("workflowEdges")
      .withIndex("by_target", (q) =>
        q.eq("flowId", args.flowId).eq("target", args.nodeId)
      )
      .collect();

    for (const edge of [...sourceEdges, ...targetEdges]) {
      await ctx.db.delete(edge._id);
    }

    // Delete associated assets and collect info for client-side Bunny cleanup
    const assets = await ctx.db
      .query("workflowAssets")
      .withIndex("by_node", (q) =>
        q.eq("flowId", args.flowId).eq("nodeId", args.nodeId)
      )
      .collect();

    const assetsToDelete = assets.map((asset) => ({
      type: asset.type,
      storagePath: asset.storagePath,
      videoId: asset.videoId,
    }));

    for (const asset of assets) {
      await ctx.db.delete(asset._id);
    }

    await ctx.db.patch(args.flowId, { updatedAt: Date.now() });

    return { success: true, assetsToDelete };
  },
});

// Add single edge
export const addEdge = mutation({
  args: {
    flowId: v.id("flows"),
    edge: edgeInputValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const now = Date.now();

    await ctx.db.insert("workflowEdges", {
      flowId: args.flowId,
      userId,
      edgeId: args.edge.edgeId,
      source: args.edge.source,
      target: args.edge.target,
      sourceHandle: args.edge.sourceHandle,
      targetHandle: args.edge.targetHandle,
      type: args.edge.type,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.flowId, { updatedAt: now });

    return { success: true };
  },
});

// Remove single edge
export const removeEdge = mutation({
  args: {
    flowId: v.id("flows"),
    edgeId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    const edge = await ctx.db
      .query("workflowEdges")
      .withIndex("by_flow_edgeId", (q) =>
        q.eq("flowId", args.flowId).eq("edgeId", args.edgeId)
      )
      .first();

    if (edge) {
      await ctx.db.delete(edge._id);
    }

    await ctx.db.patch(args.flowId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Update viewport only
export const updateViewport = mutation({
  args: {
    flowId: v.id("flows"),
    viewport: viewportValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const flow = await ctx.db.get(args.flowId);
    if (!flow || flow.userId !== userId) {
      throw new Error("Flow not found");
    }

    await ctx.db.patch(args.flowId, {
      viewport: args.viewport,
    });

    return { success: true };
  },
});
