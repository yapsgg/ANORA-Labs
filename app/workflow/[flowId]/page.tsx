'use client';

import { use } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import WorkflowEditor from '../components/workflow-editor';

export default function WorkflowPage({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = use(params);

  return (
    <div className="h-screen w-full">
      <WorkflowEditor flowId={flowId as Id<'flows'>} />
    </div>
  );
}
