import { Node, NodeProps, XYPosition } from '@xyflow/react';
import { nanoid } from 'nanoid';

import { iconMapping } from '@/app/workflow/utils/icon-mapping';
import { IncomingNodeData } from '@/app/workflow/hooks/use-workflow-runner';
import GenerateImageNode, {
  GenerateImageNodeType,
} from './generate-image-node';
import GenerateTextNode, { GenerateTextNodeType } from './generate-text-node';
import GenerateVideoNode, {
  GenerateVideoNodeType,
} from './generate-video-node';
import CommentNode, { CommentNodeType, CommentNodeData } from './comment-node';
import { processGenerateTextNode } from './processors/generate-text-processor';
import { processGenerateImageNode } from './processors/generate-image-processor';
import { processGenerateVideoNode } from './processors/generate-video-processor';
import { NODE_SIZE, nodesConfig, COMMENT_NODE_SIZE } from '../../config';

/* WORKFLOW NODE DATA PROPS ------------------------------------------------------ */
export type RunnableNodeStatus = 'loading' | 'success' | 'error' | 'initial';

export type WorkflowNodeData = {
  title?: string;
  label?: string;
  icon?: keyof typeof iconMapping;
  status?: RunnableNodeStatus;
  error?: string;
};

export type WorkflowNodeProps = NodeProps<Node<WorkflowNodeData>> & {
  type: AppNodeType;
  children?: React.ReactNode;
};

export type NodeConfig = {
  id: WorkflowNodeType;
  title: string;
  status?: 'loading' | 'success' | 'error' | 'initial';
  handles: NonNullable<Node['handles']>;
  icon: keyof typeof iconMapping;
};

export const nodeTypes = {
  'generate-text-node': GenerateTextNode,
  'generate-image-node': GenerateImageNode,
  'generate-video-node': GenerateVideoNode,
  'comment-node': CommentNode,
};

export type TextNode = GenerateTextNodeType;

export type ImageNode = GenerateImageNodeType;

export type VideoNode = GenerateVideoNodeType;

export type CommentNode = CommentNodeType;

export type AppNode = TextNode | ImageNode | VideoNode | CommentNode;

export type NodeProcessor<T extends AppNode = AppNode> = (
  incomingNodeData: IncomingNodeData,
  node: T,
) => Promise<Partial<T['data']>>;

// This is a mapping of node types to their respective processing functions.
export const nodeProcessors = {
  'generate-text-node': processGenerateTextNode,
  'generate-image-node': processGenerateImageNode,
  'generate-video-node': processGenerateVideoNode,
} as const;

export function createNodeByType<T extends AppNode>({
  type,
  id,
  position = { x: 0, y: 0 },
  data,
}: {
  type: T['type'];
  id?: string;
  position?: XYPosition;
  data?: T['data'];
}): T {
  // Handle comment node separately (no config needed)
  if (type === 'comment-node') {
    const commentNode: CommentNode = {
      id: id ?? nanoid(),
      data: (data as CommentNodeData) ?? {},
      position: {
        x: position.x - COMMENT_NODE_SIZE.width * 0.5,
        y: position.y - COMMENT_NODE_SIZE.height * 0.5,
      },
      type: 'comment-node',
    };
    return commentNode as T;
  }

  // Only workflow nodes have config
  const nodeConfig = nodesConfig[type as keyof typeof nodesConfig];

  // Guard against missing config (shouldn't happen for workflow nodes)
  if (!nodeConfig) {
    throw new Error(`No config found for node type: ${type}`);
  }

  const defaultData = {
    title: nodeConfig.title,
    status: nodeConfig.status,
    icon: nodeConfig.icon,
  };

  const newNode: AppNode = {
    id: id ?? nanoid(),
    data: data ? { ...defaultData, ...data } : defaultData,
    position: {
      x: position.x - NODE_SIZE.width * 0.5,
      y: position.y - NODE_SIZE.height * 0.5,
    },
    type,
  };

  return newNode as T;
}

export type AppNodeType = NonNullable<AppNode['type']>;

// Workflow node types (excludes comment-node which doesn't participate in workflow)
export type WorkflowNodeType = Exclude<AppNodeType, 'comment-node'>;
