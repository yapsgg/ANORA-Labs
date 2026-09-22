'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { useWorkflowPersistence } from '../hooks/use-workflow-persistence';
import Workflow from './workflow';
import WorkflowViewer from './workflow-viewer';
import { matchesShortcut, SHORTCUT_SAVE } from '@/lib/shortcuts';

interface WorkflowEditorProps {
  flowId: Id<'flows'>;
}

export default function WorkflowEditor({ flowId }: WorkflowEditorProps) {
  const {
    isLoading,
    isSaving,
    save,
    flowData,
    isReadOnly,
  } = useWorkflowPersistence({
    flowId,
    autoSaveInterval: 3000,
    autoSave: true,
  });

  // Save on Cmd/Ctrl + S (only for owners)
  useEffect(() => {
    if (isReadOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUT_SAVE)) {
        e.preventDefault();
        save();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, isReadOnly]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  // Read-only viewer for published flows (non-owners)
  if (isReadOnly) {
    return (
      <div className="h-full w-full">
        <WorkflowViewer flowId={flowId} />
      </div>
    );
  }

  // Full editor for owners
  return (
    <div className="h-full w-full">
      <Workflow
        flowId={flowId}
        flowName={flowData?.flow?.name ?? 'Untitled'}
        projectId={flowData?.project?._id}
        isSaving={isSaving}
      />
    </div>
  );
}
