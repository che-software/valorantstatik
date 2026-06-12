import cron from "node-cron";
import { syncAllPlayers } from "../services/syncService.js";

/**
 * Initializes all background cron jobs.
 */
export function initCronJobs() {
  console.log("[Cron] Initializing scheduled jobs...");

  // Run at 00:00 every day (Midnight)
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Executing midnight player synchronization...");
    await syncAllPlayers();
  });
}
