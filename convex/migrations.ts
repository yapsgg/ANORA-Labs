import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { TableNames } from "./_generated/dataModel";

// One-shot data migrations to clean up state left over from the old billing
// model (subscriptions, credits, coupons, affiliates) and from the old
// AIML/Topaz/Kling node config schema.
//
// Run via the dashboard ("Run function") or the CLI:
//
//   npx convex run migrations:wipeLegacyTables
//   npx convex run migrations:stripLegacyNodeFields
//
// Both are idempotent and chunked. Re-run until each returns
// `remainingTotal: 0`, then delete the LEGACY (TEMPORARY) blocks in
// convex/schema.ts and re-push.

const LEGACY_TABLES = [
  "subscriptions",
  "creditBalances",
  "creditPurchases",
  "creditUsage",
  "couponCodes",
  "couponRedemptions",
  "affiliates",
  "affiliateReferrals",
  "affiliatePayouts",
] as const satisfies readonly TableNames[];

// Convex caps writes at 8000 docs per mutation; stay well under that across
// all tables combined so a single invocation is safe.
const MAX_DELETIONS_PER_RUN = 4000;

export const wipeLegacyTables = internalMutation({
  args: {},
  returns: v.object({
    deletedThisRun: v.number(),
    remainingTotal: v.number(),
    perTable: v.array(
      v.object({
        table: v.string(),
        deleted: v.number(),
        remaining: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    let deletedThisRun = 0;
    let remainingTotal = 0;
    const perTable: { table: string; deleted: number; remaining: number }[] = [];

    for (const table of LEGACY_TABLES) {
      const budget = MAX_DELETIONS_PER_RUN - deletedThisRun;
      let deleted = 0;

      if (budget > 0) {
        const docs = await ctx.db.query(table).take(budget);
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
        }
        deleted = docs.length;
        deletedThisRun += deleted;
      }

      // Cheap remainder probe — if any document remains we still need another run.
      const sample = await ctx.db.query(table).take(1);
      const remaining = sample.length;
      remainingTotal += remaining;

      perTable.push({ table, deleted, remaining });
    }

    return { deletedThisRun, remainingTotal, perTable };
  },
});

// ─── Legacy fields on workflowNodes ─────────────────────────────────────────
//
// Old node rows carry config.klingV3 and data.topazConfig from the AIML era.
// This mutation walks workflowNodes and patches them out. Schema-side, both
// fields are kept as `v.optional(v.any())` LEGACY shells so the patch is
// allowed. After this returns remainingTotal: 0, drop the LEGACY fields from
// convex/schema.ts and re-push.

const NODE_PATCH_BUDGET_PER_RUN = 4000;

export const stripLegacyNodeFields = internalMutation({
  args: {},
  returns: v.object({
    patchedThisRun: v.number(),
    remainingTotal: v.number(),
  }),
  handler: async (ctx) => {
    let patchedThisRun = 0;

    // We can't index by "has legacy field" cheaply, so paginate via the
    // built-in cursor and stop once the budget is exhausted.
    const cursor = ctx.db.query("workflowNodes");
    for await (const doc of cursor) {
      if (patchedThisRun >= NODE_PATCH_BUDGET_PER_RUN) break;

      const config = doc.data?.config as Record<string, unknown> | undefined;
      const data = doc.data as Record<string, unknown>;

      const hasKlingV3 = config && "klingV3" in config;
      const hasAction = config && "action" in config;
      const hasFalParams = config && "falParams" in config;
      const hasTopaz = "topazConfig" in data;
      if (!hasKlingV3 && !hasAction && !hasFalParams && !hasTopaz) continue;

      const newConfig = config ? { ...config } : undefined;
      if (newConfig && "klingV3" in newConfig) delete newConfig.klingV3;
      if (newConfig && "action" in newConfig) delete newConfig.action;
      if (newConfig && "falParams" in newConfig) delete newConfig.falParams;

      const newData = { ...data };
      if ("topazConfig" in newData) delete newData.topazConfig;
      if (newConfig) (newData as { config?: unknown }).config = newConfig;

      await ctx.db.patch(doc._id, { data: newData as typeof doc.data });
      patchedThisRun++;
    }

    // Probe whether any remain. Cheap because we stop on the first hit.
    let remainingTotal = 0;
    const probe = ctx.db.query("workflowNodes");
    for await (const doc of probe) {
      const config = doc.data?.config as Record<string, unknown> | undefined;
      const data = doc.data as Record<string, unknown>;
      if (
        (config && ("klingV3" in config || "action" in config || "falParams" in config)) ||
        "topazConfig" in data
      ) {
        remainingTotal = 1; // sentinel — at least one row still needs work
        break;
      }
    }

    return { patchedThisRun, remainingTotal };
  },
});
