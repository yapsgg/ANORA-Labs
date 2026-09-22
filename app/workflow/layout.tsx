'use client';

import '@xyflow/react/dist/style.css';

import { ReactFlowProvider } from '@xyflow/react';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppStoreProvider } from '@/app/workflow/store';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import { Toaster } from '@/components/ui/sonner';

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <TextShimmer className="text-xs text-muted-foreground" duration={1}>
          Loading...
        </TextShimmer>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppStoreProvider initialState={{ nodes: [], edges: [] }}>
      <ReactFlowProvider>{children}</ReactFlowProvider>
      <Toaster />
    </AppStoreProvider>
  );
}
