/**
 * @file env.js
 * @description Centralised environment variable loading and validation.
 *
 * Importing this module is the ONLY place in the codebase where process.env
 * is read directly.  Every other module imports from here, giving us a single
 * point of failure when a required variable is missing.
 */

import "dotenv/config";

/**
 * Asserts that a required environment variable exists and is non-empty.
 * Throws at startup so misconfigured deployments fail fast and loudly.
 *
 * @param {string} key - The env variable name.
 * @returns {string} The trimmed value.
 */
function require(key) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`[config/env] Missing required environment variable: "${key}"`);
  }
  return value;
}

export const env = {
  // Server
  port:        parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv:     process.env.NODE_ENV ?? "development",
  isDev:       (process.env.NODE_ENV ?? "development") === "development",

  // MongoDB
  mongodbUri:  require("MONGODB_URI"),

  // HenrikDev Valorant API
  henrikApiKey: require("HENRIK_API_KEY"),

  // CORS — comma-separated list of allowed origins
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map(o => o.trim()),
};
