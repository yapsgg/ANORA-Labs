import { Panel } from '@xyflow/react';
import { Route } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLayout } from '@/app/workflow/hooks/use-layout';
import { ZoomSlider } from '@/components/zoom-slider';

export function WorkflowControls() {
  const runLayout = useLayout();

  return (
    <>
      <Panel
        position="bottom-right"
        className="bg-card text-foreground rounded-md"
      >
        <Button onClick={runLayout} variant="ghost">
          <Route />
        </Button>
      </Panel>
    </>
  );
}
