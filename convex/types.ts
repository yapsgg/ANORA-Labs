import { Id } from "./_generated/dataModel";

// Node status type
export type NodeStatus = "loading" | "success" | "error" | "initial";

// Node types
export type WorkflowNodeType =
  | "generate-text-node"
  | "generate-image-node"
  | "generate-video-node"
  | "comment-node";

// Node config (model settings)
export interface NodeConfig {
  model?: string;
  temperature?: number;
  size?: string;
  duration?: number;
  ratio?: string;
  resolution?: string;
}

// Node data (type-specific content)
export interface NodeData {
  title?: string;
  label?: string;
  icon?: string;
  status?: NodeStatus;
  error?: string;
  config?: NodeConfig;
  // Content fields
  text?: string;
  prompt?: string;
  image?: string;
  video?: string;
  // Comment node fields
  author?: string;
  createdAt?: string;
  resolved?: boolean;
}

// Position on canvas
export interface Position {
  x: number;
  y: number;
}

// Viewport state
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Measured dimensions
export interface MeasuredDimensions {
  width?: number;
  height?: number;
}

// Database workflow node
export interface DbWorkflowNode {
  _id: Id<"workflowNodes">;
  _creationTime: number;
  flowId: Id<"flows">;
  userId: Id<"users">;
  nodeId: string;
  type: WorkflowNodeType;
  position: Position;
  data: NodeData;
  measured?: MeasuredDimensions;
  selected?: boolean;
  dragging?: boolean;
  createdAt: number;
  updatedAt: number;
}

// Database workflow edge
export interface DbWorkflowEdge {
  _id: Id<"workflowEdges">;
  _creationTime: number;
  flowId: Id<"flows">;
  userId: Id<"users">;
  edgeId: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  createdAt: number;
  updatedAt: number;
}

// Database workflow asset
export interface DbWorkflowAsset {
  _id: Id<"workflowAssets">;
  _creationTime: number;
  flowId: Id<"flows">;
  nodeId: string;
  userId: Id<"users">;
  storageId: Id<"_storage">;
  type: "image" | "video";
  filename?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  createdAt: number;
}

// Database flow with viewport
export interface DbFlow {
  _id: Id<"flows">;
  _creationTime: number;
  name: string;
  projectId: Id<"projects">;
  userId: Id<"users">;
  updatedAt: number;
  viewport?: Viewport;
}

// Input types for creating/updating

export interface CreateNodeInput {
  nodeId: string;
  type: WorkflowNodeType;
  position: Position;
  data: NodeData;
  measured?: MeasuredDimensions;
}

export interface UpdateNodeInput {
  nodeId: string;
  position?: Position;
  data?: Partial<NodeData>;
  measured?: MeasuredDimensions;
  selected?: boolean;
  dragging?: boolean;
}

export interface CreateEdgeInput {
  edgeId: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

// Full workflow data (for save/load)
export interface WorkflowData {
  nodes: CreateNodeInput[];
  edges: CreateEdgeInput[];
  viewport?: Viewport;
}

// React Flow compatible types
export interface ReactFlowNode {
  id: string;
  type: WorkflowNodeType;
  position: Position;
  data: NodeData;
  measured?: MeasuredDimensions;
  selected?: boolean;
  dragging?: boolean;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}
