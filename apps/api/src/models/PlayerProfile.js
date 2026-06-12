import mongoose from "mongoose";

const PlayerProfileSchema = new mongoose.Schema(
  {
    puuid: { type: String, required: true, unique: true, index: true },
    gameName: { type: String, required: true },
    tagLine: { type: String, required: true },
    region: { type: String, default: "eu" },
    
    // Computed player info (including rank, cards)
    player: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Aggregate stats (KDA, win rate, tilt, etc.)
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    tilt: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Recent match history array
    matches: { type: Array, default: [] },
    
    // Used for Stale-While-Revalidate TTL logic
    lastUpdated: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
PlayerProfileSchema.index({ gameName: 1, tagLine: 1 });
PlayerProfileSchema.index({ lastUpdated: 1 });

export const PlayerProfile = mongoose.model("PlayerProfile", PlayerProfileSchema);
