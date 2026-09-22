import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

/**
 * Find a user by email (internal only, used by webhook handler as fallback)
 */
export const findByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.find((u) => u.email === args.email) || null;
  },
});
