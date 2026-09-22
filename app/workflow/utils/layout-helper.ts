import { type Edge } from '@xyflow/react';
import ELK, { ElkNode, ElkPort } from 'elkjs/lib/elk.bundled.js';

import { type AppNode } from '@/app/workflow/components/nodes';
import { nodesConfig } from '../config';

const elk = new ELK();

const layoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.edgeNodeBetweenLayers': '80',
  'elk.spacing.nodeNode': '140',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
  'elk.separateConnectedComponents': 'true',
  'elk.spacing.componentComponent': '140',
  'elk.portConstraints': 'FIXED_ORDER',
};

function createPort(id: string, side: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST') {
  return { id, layoutOptions: { side } };
}

function getPorts(node: AppNode) {
  // Skip comment nodes (they don't have handles)
  if (node.type === 'comment-node') {
    return { targetPorts: [], sourcePorts: [] };
  }

  const nodeConfig = nodesConfig[node.type as keyof typeof nodesConfig];
  if (!nodeConfig) {
    return { targetPorts: [], sourcePorts: [] };
  }

  const handles = nodeConfig.handles;
  const targetPorts: ElkPort[] = [];
  const sourcePorts: ElkPort[] = [];

  handles?.forEach((_, i) => {
    const index = handles.length - i - 1;
    const handle = handles[index];

    if (handle.type === 'target') {
      targetPorts.push(
        createPort(`${node.id}-target-${handle.id ?? null}`, 'WEST'),
      );
    }
    if (handle.type === 'source') {
      sourcePorts.push(
        createPort(`${node.id}-source-${handle.id ?? null}`, 'EAST'),
      );
    }
  });

  return { targetPorts, sourcePorts };
}

export async function layoutGraph(nodes: AppNode[], edges: Edge[]) {
  const connectedNodes = new Set();

  const graph: ElkNode = {
    id: 'root',
    layoutOptions,
    edges: edges.map((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
      return {
        id: edge.id,
        sources: [`${edge.source}-source-${edge.sourceHandle ?? null}`],
        targets: [`${edge.target}-target-${edge.targetHandle ?? null}`],
      };
    }),
    children: nodes.reduce<ElkNode[]>((acc, node) => {
      if (!connectedNodes.has(node.id)) return acc;

      const { targetPorts, sourcePorts } = getPorts(node);
      acc.push({
        id: node.id,
        width: node.width ?? node.measured?.width ?? 150,
        height: node.height ?? node.measured?.height ?? 50,
        ports: [createPort(node.id, 'EAST'), ...targetPorts, ...sourcePorts],
      });

      return acc;
    }, []),
  };

  const elkNodes = await elk.layout(graph);
  const layoutedNodesMap = new Map(elkNodes.children?.map((n) => [n.id, n]));

  const layoutedNodes: AppNode[] = nodes.map((node) => {
    const layoutedNode = layoutedNodesMap.get(node.id);
    if (!layoutedNode) return node;

    if (
      layoutedNode.x === undefined ||
      layoutedNode.y === undefined ||
      (layoutedNode.x === node.position.x && layoutedNode.y === node.position.y)
    ) {
      return node;
    }

    return {
      ...node,
      position: { x: layoutedNode.x, y: layoutedNode.y },
    };
  });

  return layoutedNodes;
}
