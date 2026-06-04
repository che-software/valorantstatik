/**
 * @file Match.js
 * @description Mongoose schema for a single Valorant match record.
 *
 * We store a lightweight summary per player per match rather than the full
 * raw match blob.  This keeps the collection size manageable and lets us
 * compute lifetime stats with a single aggregation pipeline.
 */

import mongoose from "mongoose";

// ── Sub-document: per-player stats within a match ────────────────────────────

const MatchPlayerSchema = new mongoose.Schema(
  {
    puuid:     { type: String, required: true, index: true },
    name:      { type: String, required: true },
    tag:       { type: String, required: true },
    team:      { type: String, enum: ["red", "blue"], required: true },
    character: { type: String, required: true },   // agent name
    tier:      { type: Number, default: 0 },
    tierName:  { type: String, default: "Unranked" },
    agentIcon: { type: String, default: "" },

    // Aggregated combat stats.
    acs:        { type: Number, default: 0 },
    adr:        { type: Number, default: 0 },
    damageMade: { type: Number, default: 0 },

    stats: {
      score:     { type: Number, default: 0 },
      kills:     { type: Number, default: 0 },
      deaths:    { type: Number, default: 0 },
      assists:   { type: Number, default: 0 },
      headshots: { type: Number, default: 0 },
      bodyshots: { type: Number, default: 0 },
      legshots:  { type: Number, default: 0 },
    },

    // Map of weapon name → kill count for this player in this match.
    weaponKills: { type: Map, of: Number, default: {} },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const MatchSchema = new mongoose.Schema(
  {
    // Riot match ID — natural unique key.
    matchId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    map:      { type: String, required: true },
    mode:     { type: String, default: "Competitive" },
    duration: { type: Number, default: 0 }, // minutes
    rounds:   { type: Number, default: 0 },

    // Unix timestamp (seconds) from the API.
    startedAt: { type: Number, required: true },

    teams: {
      red:  { won: Boolean, roundsWon: Number, roundsLost: Number },
      blue: { won: Boolean, roundsWon: Number, roundsLost: Number },
    },

    // All 10 players embedded — avoids a separate JOIN-style lookup.
    players: { type: [MatchPlayerSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Fast lookup of all matches a specific player participated in.
MatchSchema.index({ "players.puuid": 1, startedAt: -1 });

// ── JSON serialisation ────────────────────────────────────────────────────────

MatchSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Match = mongoose.model("Match", MatchSchema);
