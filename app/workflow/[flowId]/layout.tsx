'use client';

import '@xyflow/react/dist/style.css';

import { ReactFlowProvider } from '@xyflow/react';

import { AppStoreProvider } from '@/app/workflow/store';

export default function WorkflowFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStoreProvider initialState={{ nodes: [], edges: [] }}>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </AppStoreProvider>
  );
}
