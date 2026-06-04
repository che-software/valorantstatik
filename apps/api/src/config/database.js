/**
 * @file database.js
 * @description MongoDB connection management via Mongoose.
 *
 * Design decisions:
 *  - A single connection is created at boot and reused for the entire process.
 *  - Mongoose buffering is disabled so queries fail immediately when the
 *    database is unreachable rather than silently queuing forever.
 *  - The connection is exported so the health-check endpoint can query its
 *    readyState without establishing a second connection.
 */

import mongoose from "mongoose";
import { env } from "./env.js";

/** Mongoose connection options applied at every connect() call. */
const CONNECT_OPTIONS = {
  // Disable Mongoose's internal query buffer — prefer explicit error handling.
  bufferCommands: false,

  // Automatically create indexes defined in schemas (safe to disable in prod
  // after the initial deployment if write throughput is a concern).
  autoIndex: env.isDev,

  // Timeout values that prevent the app from hanging on a bad network.
  serverSelectionTimeoutMS: 10_000, // give up selecting a server after 10 s
  socketTimeoutMS:          45_000, // close idle sockets after 45 s
};

/**
 * Opens a Mongoose connection to MongoDB Atlas.
 * Should be called once from server.js before the HTTP server starts.
 *
 * @returns {Promise<typeof mongoose>} The Mongoose instance after connecting.
 */
export async function connectDatabase() {
  // Mongoose emits these events on the default connection.
  mongoose.connection.on("connected",    () => console.log("[DB] MongoDB connected ✔"));
  mongoose.connection.on("disconnected", () => console.warn("[DB] MongoDB disconnected"));
  mongoose.connection.on("error",        (err) => console.error("[DB] MongoDB error:", err.message));

  await mongoose.connect(env.mongodbUri, CONNECT_OPTIONS);
  return mongoose;
}

/**
 * Gracefully closes the Mongoose connection.
 * Registered as a SIGTERM/SIGINT handler in server.js.
 */
export async function disconnectDatabase() {
  await mongoose.connection.close();
  console.log("[DB] MongoDB connection closed");
}

/** The Mongoose connection object (readyState: 0=disconnected, 1=connected). */
export const dbConnection = mongoose.connection;
