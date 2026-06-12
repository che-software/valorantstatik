import { henrikGet } from "../controllers/riotApiClient.js";
import { transformPlayer, transformMatch } from "../controllers/transformers.js";
import { processLifetimeStats, calcTiltStats } from "../controllers/statsProcessor.js";
import { PlayerProfile } from "../models/PlayerProfile.js";

const DELAY_MS = 2000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches player data from Riot/HenrikDev API and updates the PlayerProfile database.
 * 
 * @param {string} name 
 * @param {string} tag 
 * @returns {Promise<object>} The updated PlayerProfile document
 */
export async function syncPlayer(name, tag) {
  try {
    const n = encodeURIComponent(name);
    const t = encodeURIComponent(tag);

    const account = await henrikGet(`/v1/account/${n}/${t}`);
    if (!account?.puuid) throw new Error("Player not found");

    const region = account.region ?? "eu";

    const [rankResult, matchesResult] = await Promise.allSettled([
      henrikGet(`/v2/mmr/${region}/${n}/${t}`),
      henrikGet(`/v3/matches/${region}/${n}/${t}?size=20`),
    ]);

    const rankData   = rankResult.status    === "fulfilled" ? rankResult.value    : null;
    const rawMatches = matchesResult.status === "fulfilled" ? matchesResult.value : [];

    const player  = transformPlayer(account, rankData);
    const matches = Array.isArray(rawMatches) ? rawMatches.map(transformMatch) : [];

    const stats = processLifetimeStats(matches, name, tag);
    const tilt  = calcTiltStats(matches, name, tag);

    const profileData = {
      puuid: player.puuid,
      gameName: player.name,
      tagLine: player.tag,
      region: player.region,
      player,
      stats,
      tilt,
      matches,
      lastUpdated: new Date()
    };

    const updatedProfile = await PlayerProfile.findOneAndUpdate(
      { puuid: player.puuid },
      { $set: profileData },
      { upsert: true, new: true }
    );

    console.log(`[SyncService] Successfully synced ${name}#${tag}`);
    return updatedProfile;
  } catch (error) {
    console.error(`[SyncService] Failed to sync ${name}#${tag}:`, error.message);
    throw error;
  }
}

/**
 * Iterates over all stored players and syncs them with a delay to prevent rate limits.
 */
export async function syncAllPlayers() {
  console.log("[SyncService] Starting background sync for all players...");
  try {
    const profiles = await PlayerProfile.find({}, { gameName: 1, tagLine: 1 }).lean();
    console.log(`[SyncService] Found ${profiles.length} profiles to sync.`);

    let successCount = 0;
    let failCount = 0;

    for (const profile of profiles) {
      try {
        await syncPlayer(profile.gameName, profile.tagLine);
        successCount++;
      } catch (err) {
        failCount++;
      }
      // Rate limiting delay between requests
      await delay(DELAY_MS);
    }

    console.log(`[SyncService] Sync complete. Success: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error("[SyncService] Critical error during syncAllPlayers:", err.message);
  }
}
