/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as balances from "../balances.js";
import type * as consultantReviews from "../consultantReviews.js";
import type * as consultants from "../consultants.js";
import type * as enterpriseInquiries from "../enterpriseInquiries.js";
import type * as favorites from "../favorites.js";
import type * as flows from "../flows.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as marketplace from "../marketplace.js";
import type * as marketplaceReviews from "../marketplaceReviews.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as polar from "../polar.js";
import type * as projects from "../projects.js";
import type * as publicFlows from "../publicFlows.js";
import type * as search from "../search.js";
import type * as types from "../types.js";
import type * as users from "../users.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  auth: typeof auth;
  balances: typeof balances;
  consultantReviews: typeof consultantReviews;
  consultants: typeof consultants;
  enterpriseInquiries: typeof enterpriseInquiries;
  favorites: typeof favorites;
  flows: typeof flows;
  helpers: typeof helpers;
  http: typeof http;
  marketplace: typeof marketplace;
  marketplaceReviews: typeof marketplaceReviews;
  migrations: typeof migrations;
  notifications: typeof notifications;
  polar: typeof polar;
  projects: typeof projects;
  publicFlows: typeof publicFlows;
  search: typeof search;
  types: typeof types;
  users: typeof users;
  workflows: typeof workflows;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
