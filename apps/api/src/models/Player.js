/**
 * @file Player.js
 * @description Mongoose schema for a Valorant player profile.
 *
 * This document is created / updated every time a profile is successfully
 * fetched from the HenrikDev API.  It serves two purposes:
 *   1. A fallback data source when the upstream API is unavailable.
 *   2. Historical rank tracking — each save captures the rank at that moment.
 */

import mongoose from "mongoose";

// ── Sub-document: rank snapshot ───────────────────────────────────────────────

const RankSchema = new mongoose.Schema(
  {
    tier:       { type: Number, default: 0 },
    name:       { type: String, default: "Unranked" },
    rr:         { type: Number, default: 0 },
    elo:        { type: Number, default: 0 },
    rrChange:   { type: Number, default: 0 },
    iconUrl:    { type: String, default: "" },

    // All-time peak rank derived from the by_season API field.
    peak: {
      tier:    { type: Number, default: 0 },
      name:    { type: String, default: "Unranked" },
      iconUrl: { type: String, default: "" },
    },
  },
  { _id: false } // embedded document — no separate _id needed
);

// ── Main schema ───────────────────────────────────────────────────────────────

const PlayerSchema = new mongoose.Schema(
  {
    // Riot's immutable player identifier — used as the natural key for upserts.
    puuid: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    // Display name parts (can change — always updated on each fetch).
    name:   { type: String, required: true },
    tag:    { type: String, required: true },
    region: { type: String, required: true, default: "eu" },
    level:  { type: Number, default: 0 },

    // Card URLs from the Riot account endpoint.
    card: {
      small: { type: String, default: "" },
      large: { type: String, default: "" },
      wide:  { type: String, default: "" },
    },

    // Latest rank snapshot (null for unranked players who have never placed).
    rank: { type: RankSchema, default: null },

    // Aggregate counters maintained by the cron refresh job.
    matchCount:  { type: Number, default: 0 },
    lastMatchAt: { type: Date,   default: null },
  },
  {
    // Automatically manage createdAt / updatedAt timestamps.
    timestamps: true,

    // Optimise read queries that sort the leaderboard by ELO.
    // Compound indexes are defined below the schema definition.
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Case-insensitive player lookup by name + tag (the most common query).
PlayerSchema.index({ name: 1, tag: 1 });

// Leaderboard sort by ELO (descending).
PlayerSchema.index({ "rank.elo": -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────

/**
 * Human-readable Riot ID, e.g. "KediPotter#TR1".
 * Exposed in JSON output because toJSON({ virtuals: true }) is set below.
 */
PlayerSchema.virtual("riotId").get(function () {
  return `${this.name}#${this.tag}`;
});

// ── JSON serialisation ────────────────────────────────────────────────────────

PlayerSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    // Remove the internal Mongoose _id from API responses; use puuid instead.
    delete ret._id;
    return ret;
  },
});

export const Player = mongoose.model("Player", PlayerSchema);
