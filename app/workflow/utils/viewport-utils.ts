import type { ReactFlowInstance } from '@xyflow/react';

export interface FocusNodeOptions {
  /** Zoom level to use when focusing (default: 1) */
  zoom?: number;
  /** Duration of the animation in ms (default: 500) */
  duration?: number;
}

/**
 * Focus the viewport on a specific node by its ID
 * Uses fitView with the specific node for reliable centering
 */
export function focusNode(
  reactFlowInstance: ReactFlowInstance,
  nodeId: string,
  options: FocusNodeOptions = {},
): void {
  const { zoom = 2, duration = 500 } = options;

  const node = reactFlowInstance.getNode(nodeId);
  if (!node) return;

  // Use fitView with specific node - more reliable than setCenter
  reactFlowInstance.fitView({
    nodes: [{ id: nodeId }],
    duration,
    maxZoom: zoom,
    minZoom: zoom,
    padding: 0.5,
  });
}

/**
 * Focus and select a specific node
 * Centers the viewport and selects the node
 */
export function focusAndSelectNode(
  reactFlowInstance: ReactFlowInstance,
  nodeId: string,
  options: FocusNodeOptions = {},
): void {
  const node = reactFlowInstance.getNode(nodeId);
  if (!node) return;

  // First select the node, then focus
  const nodes = reactFlowInstance.getNodes();
  const updatedNodes = nodes.map((n) => ({
    ...n,
    selected: n.id === nodeId,
  }));
  reactFlowInstance.setNodes(updatedNodes);

  // Then focus on it
  focusNode(reactFlowInstance, nodeId, options);
}
