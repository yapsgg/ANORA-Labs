const MIN_NODE_SIZE = 320;
const MAX_NODE_SIZE = 480;
const MIN_SMALLER_DIMENSION = 280;

function clampDimensions(aspectRatio: number, widthCap: number) {
  let nodeWidth: number;
  let nodeHeight: number;

  if (aspectRatio >= 1) {
    const widthScale = Math.min(aspectRatio, widthCap);
    nodeWidth = Math.round(MIN_NODE_SIZE + (MAX_NODE_SIZE - MIN_NODE_SIZE) * ((widthScale - 1) / (widthCap - 1)));
    nodeWidth = Math.min(nodeWidth, MAX_NODE_SIZE);
    nodeHeight = Math.round(nodeWidth / aspectRatio);
    if (nodeHeight < MIN_SMALLER_DIMENSION) {
      nodeHeight = MIN_SMALLER_DIMENSION;
      nodeWidth = Math.round(nodeHeight * aspectRatio);
    }
  } else {
    const heightScale = Math.min(1 / aspectRatio, widthCap);
    nodeHeight = Math.round(MIN_NODE_SIZE + (MAX_NODE_SIZE - MIN_NODE_SIZE) * ((heightScale - 1) / (widthCap - 1)));
    nodeHeight = Math.min(nodeHeight, MAX_NODE_SIZE);
    nodeWidth = Math.round(nodeHeight * aspectRatio);
    if (nodeWidth < MIN_SMALLER_DIMENSION) {
      nodeWidth = MIN_SMALLER_DIMENSION;
      nodeHeight = Math.round(nodeWidth / aspectRatio);
    }
  }

  return { width: nodeWidth, height: nodeHeight };
}

/**
 * Image nodes: accepts pixel sizes ("1024x1536") and aspect ratios ("16:9").
 * Falls back to a square if `size` is unparseable.
 */
export function calculateImageNodeDimensions(size: string): { width: number; height: number } {
  const ratioMatch = size.match(/^(\d+):(\d+)$/);
  if (ratioMatch) {
    const aspectRatio = parseInt(ratioMatch[1], 10) / parseInt(ratioMatch[2], 10);
    return clampDimensions(aspectRatio, 1.75);
  }

  const pixelMatch = size.match(/^(\d+)x(\d+)$/);
  if (!pixelMatch) {
    return { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE };
  }
  const aspectRatio = parseInt(pixelMatch[1], 10) / parseInt(pixelMatch[2], 10);
  return clampDimensions(aspectRatio, 1.75);
}

/**
 * Video nodes: aspect-ratio strings only ("16:9", "9:16", "1:1").
 */
export function calculateVideoNodeDimensions(ratio: string): { width: number; height: number } {
  const match = ratio.match(/^(\d+):(\d+)$/);
  if (!match) {
    return { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE };
  }
  const aspectRatio = parseInt(match[1], 10) / parseInt(match[2], 10);
  return clampDimensions(aspectRatio, 1.78);
}
