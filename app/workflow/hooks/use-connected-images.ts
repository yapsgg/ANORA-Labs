import { useMemo } from 'react';
import { useNodeConnections, useNodesData } from '@xyflow/react';
import type { ConnectedImage } from '../components/nodes/components/connected-image-previews';

/**
 * Hook to get connected image previews from upstream image nodes
 * Returns an array of ConnectedImage objects with id, url, and optional label
 */
export function useConnectedImages(): ConnectedImage[] {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: 'input',
  });

  const sourceNodeIds = useMemo(
    () => connections.map((c) => c.source),
    [connections],
  );

  const sourceNodesData = useNodesData(sourceNodeIds);

  const connectedImages = useMemo(() => {
    const images: ConnectedImage[] = [];

    for (const nd of sourceNodesData) {
      if (nd?.data && 'image' in nd.data && nd.data.image) {
        const imageUrl = String(nd.data.image);
        // Check if it's a base64 image or URL
        const isUrl = imageUrl.startsWith('http');
        const url = isUrl ? imageUrl : `data:image/png;base64,${imageUrl}`;

        images.push({
          id: nd.id,
          url,
          label: (nd.data as { label?: string }).label || undefined,
        });
      }
    }

    return images;
  }, [sourceNodesData]);

  return connectedImages;
}
