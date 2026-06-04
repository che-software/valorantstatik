/**
 * @file CachedResponse.js
 * @description Generic TTL-based API response cache backed by MongoDB.
 *
 * Why MongoDB instead of Redis?
 *   The free-tier deployment has no Redis instance.  MongoDB's TTL index
 *   feature lets the database automatically expire stale documents, giving
 *   us a zero-dependency cache that survives process restarts.
 *
 * Each document stores one serialised API response keyed by a deterministic
 * string (e.g. "profile:KediPotter:TR1").
 */

import mongoose from "mongoose";

const CachedResponseSchema = new mongoose.Schema(
  {
    // Deterministic cache key, e.g. "profile:Name:Tag" or "matches:Name:Tag".
    key: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    // The serialised response payload.  Stored as Mixed so any shape is valid.
    data: {
      type:     mongoose.Schema.Types.Mixed,
      required: true,
    },

    // The document will be automatically deleted by MongoDB after this field
    // passes its expiry — driven by the TTL index defined below.
    expiresAt: {
      type:     Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── TTL index ─────────────────────────────────────────────────────────────────
// MongoDB checks this index every 60 seconds and removes expired documents.
// expireAfterSeconds: 0 means "expire when the current time ≥ expiresAt".
CachedResponseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Static helpers ────────────────────────────────────────────────────────────

/**
 * Retrieves a cached value, returning null if missing or expired.
 *
 * @param {string} key
 * @returns {Promise<unknown|null>}
 */
CachedResponseSchema.statics.get = async function (key) {
  const doc = await this.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  return doc?.data ?? null;
};

/**
 * Stores a value in the cache with a TTL in seconds.
 *
 * @param {string} key
 * @param {unknown} data
 * @param {number}  ttlSeconds
 */
CachedResponseSchema.statics.set = async function (key, data, ttlSeconds) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1_000);
  await this.findOneAndUpdate(
    { key },
    { $set: { data, expiresAt } },
    { upsert: true, new: true }
  );
};

export const CachedResponse = mongoose.model("CachedResponse", CachedResponseSchema);
