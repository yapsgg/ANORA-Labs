import { useMemo } from 'react';
import { useNodeConnections, useNodesData } from '@xyflow/react';

export interface ConnectedVideo {
  id: string;
  url: string;
  label?: string;
}

/**
 * Returns videos from upstream generate-video / uploaded video nodes connected
 * to this node's `input` handle. URLs are passed through as-is — Bunny CDN
 * URLs work directly with OpenRouter, and YouTube/data: URLs are also valid.
 */
export function useConnectedVideos(): ConnectedVideo[] {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: 'input',
  });

  const sourceNodeIds = useMemo(
    () => connections.map((c) => c.source),
    [connections],
  );

  const sourceNodesData = useNodesData(sourceNodeIds);

  return useMemo(() => {
    const videos: ConnectedVideo[] = [];
    for (const nd of sourceNodesData) {
      if (nd?.data && 'video' in nd.data && nd.data.video) {
        const url = String(nd.data.video);
        if (!url) continue;
        videos.push({
          id: nd.id,
          url,
          label: (nd.data as { label?: string }).label || undefined,
        });
      }
    }
    return videos;
  }, [sourceNodesData]);
}
