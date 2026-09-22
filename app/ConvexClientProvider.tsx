"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Allow production builds / static prerendering without a Convex deployment
  // configured. The app itself needs NEXT_PUBLIC_CONVEX_URL at runtime.
  if (!convex) {
    if (typeof window === "undefined") {
      return <>{children}</>;
    }
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL. Copy .env.example to .env.local and set your Convex deployment URL."
    );
  }

  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}