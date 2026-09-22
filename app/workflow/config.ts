import { Position } from '@xyflow/react';
import { NodeConfig, WorkflowNodeType } from './components/nodes';

export const NODE_SIZE = { width: 260, height: 50 };
export const COMMENT_NODE_SIZE = { width: 240, height: 100 };

export const nodesConfig: Record<WorkflowNodeType, NodeConfig> = {
  'generate-text-node': {
    id: 'generate-text-node',
    title: 'Text Block',
    icon: 'Type',
    handles: [
      {
        id: 'input',
        type: 'target',
        position: Position.Left,
        x: 0,
        y: NODE_SIZE.height * 0.5,
      },
      {
        id: 'output',
        type: 'source',
        position: Position.Right,
        x: NODE_SIZE.width,
        y: NODE_SIZE.height * 0.5,
      },
    ],
  },
  'generate-image-node': {
    id: 'generate-image-node',
    title: 'Image Block',
    icon: 'Image',
    handles: [
      {
        id: 'input',
        type: 'target',
        position: Position.Left,
        x: 0,
        y: NODE_SIZE.height * 0.5,
      },
      {
        id: 'output',
        type: 'source',
        position: Position.Right,
        x: NODE_SIZE.width,
        y: NODE_SIZE.height * 0.5,
      },
    ],
  },
  'generate-video-node': {
    id: 'generate-video-node',
    title: 'Video Block',
    icon: 'Play',
    handles: [
      {
        id: 'input',
        type: 'target',
        position: Position.Left,
        x: 0,
        y: NODE_SIZE.height * 0.5,
      },
      {
        id: 'output',
        type: 'source',
        position: Position.Right,
        x: NODE_SIZE.width,
        y: NODE_SIZE.height * 0.5,
      },
    ],
  },
};
