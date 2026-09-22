import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  // Pay-as-you-go: new users start at $0. Top-up via /api/polar/checkout/topup.
});
