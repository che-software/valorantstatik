/**
 * @file server.js
 * @description Application entry point.
 *
 * Startup sequence:
 *   1. Load and validate environment variables (throws on missing vars).
 *   2. Connect to MongoDB — abort if the connection fails at boot.
 *   3. Start the HTTP server on the configured port.
 *   4. Register SIGTERM / SIGINT handlers for graceful shutdown.
 *
 * This file intentionally contains no business logic — it only wires
 * infrastructure together.
 */

import { env }                from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { initCronJobs }       from "./cron/cronJobs.js";
import app                    from "./app.js";

async function main() {
  // ── 1. Connect to MongoDB ─────────────────────────────────────────────────
  try {
    await connectDatabase();
    initCronJobs();
  } catch (err) {
    console.error("[Server] Failed to connect to MongoDB:", err.message);
    // A broken DB at startup is unrecoverable — exit with a non-zero code so
    // the process supervisor (PM2, Docker, etc.) knows to restart us.
    process.exit(1);
  }

  // ── 2. Start HTTP server ──────────────────────────────────────────────────
  const server = app.listen(env.port, () => {
    console.log(`[Server] Running in ${env.nodeEnv} mode`);
    console.log(`[Server] Listening on http://localhost:${env.port}`);
    console.log(`[Server] Health check → http://localhost:${env.port}/health`);
  });

  // ── 3. Graceful shutdown ──────────────────────────────────────────────────
  /**
   * Cleanly close the HTTP server and the MongoDB connection when the process
   * receives a termination signal.  This prevents in-flight requests from
   * being dropped abruptly and avoids leaving stale MongoDB connections open.
   *
   * @param {string} signal - The OS signal that triggered shutdown.
   */
  async function shutdown(signal) {
    console.log(`\n[Server] ${signal} received — shutting down gracefully…`);

    // Stop accepting new connections; wait for existing requests to finish.
    server.close(async () => {
      await disconnectDatabase();
      console.log("[Server] Shutdown complete.");
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown is taking too long.
    setTimeout(() => {
      console.error("[Server] Graceful shutdown timed out — forcing exit.");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  // Catch unhandled promise rejections — log and exit so the supervisor can
  // restart the process in a clean state.
  process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled rejection:", reason);
    process.exit(1);
  });
}

main();
