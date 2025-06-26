/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as advertising from "../advertising.js";
import type * as ai_chat from "../ai_chat.js";
import type * as analytics from "../analytics.js";
import type * as api_ from "../api.js";
import type * as dynamic_pricing from "../dynamic_pricing.js";
import type * as leads from "../leads.js";
import type * as mail from "../mail.js";
import type * as mailbox from "../mailbox.js";
import type * as payments from "../payments.js";
import type * as plots from "../plots.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  advertising: typeof advertising;
  ai_chat: typeof ai_chat;
  analytics: typeof analytics;
  api: typeof api_;
  dynamic_pricing: typeof dynamic_pricing;
  leads: typeof leads;
  mail: typeof mail;
  mailbox: typeof mailbox;
  payments: typeof payments;
  plots: typeof plots;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
