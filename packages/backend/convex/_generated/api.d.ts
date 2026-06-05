/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as barberServices from "../barberServices.js";
import type * as blocks from "../blocks.js";
import type * as crons from "../crons.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as notificationsNode from "../notificationsNode.js";
import type * as privateData from "../privateData.js";
import type * as ratings from "../ratings.js";
import type * as schedule from "../schedule.js";
import type * as services from "../services.js";
import type * as slots from "../slots.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  auth: typeof auth;
  barberServices: typeof barberServices;
  blocks: typeof blocks;
  crons: typeof crons;
  healthCheck: typeof healthCheck;
  http: typeof http;
  notifications: typeof notifications;
  notificationsNode: typeof notificationsNode;
  privateData: typeof privateData;
  ratings: typeof ratings;
  schedule: typeof schedule;
  services: typeof services;
  slots: typeof slots;
  users: typeof users;
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

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
