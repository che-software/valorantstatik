/**
 * @file riotApiClient.js
 * @description Low-level HTTP client for the HenrikDev Valorant API.
 *
 * Responsibilities:
 *   - Attach the API key to every request.
 *   - Unwrap the HenrikDev envelope: { status, data } → data.
 *   - Retry on 429 (rate-limit) and 500 (transient server error).
 *   - Map upstream HTTP status codes to typed application errors.
 *
 * All callers receive plain JavaScript objects; they never touch axios directly.
 */

import axios from "axios";
import { env } from "../config/env.js";

const BASE_URL = "https://api.henrikdev.xyz/valorant";

/** Maximum number of attempts before propagating the last error. */
const MAX_RETRIES = 3;

/** Delay between retry attempts in milliseconds. */
const RETRY_DELAY_MS = 2_000;

// ── Typed API error ───────────────────────────────────────────────────────────

/**
 * Represents a predictable error returned by this client.
 * Controllers catch ApiError and translate it into an HTTP response.
 */
export class ApiError extends Error {
  /**
   * @param {string} message   - Human-readable description.
   * @param {number} status    - HTTP status code to forward to the client.
   * @param {number} [retryAfter] - Seconds until the rate limit resets (429 only).
   */
  constructor(message, status, retryAfter = undefined) {
    super(message);
    this.name       = "ApiError";
    this.status     = status;
    this.retryAfter = retryAfter;
  }
}

// ── Status-to-message mapping ─────────────────────────────────────────────────

const STATUS_MESSAGES = {
  400: "Invalid request parameters.",
  401: "HenrikDev API key is invalid or missing.",
  403: "Player profile is private or access is forbidden.",
  404: "Player not found. Check the Name#Tag and try again.",
  429: "HenrikDev API rate limit exceeded. Please wait.",
  500: "HenrikDev server error. Try again in a moment.",
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Simple promise-based delay. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determines whether a failed attempt should be retried.
 *
 * @param {number} status  - HTTP status of the failed request.
 * @param {number} attempt - Current attempt number (0-indexed).
 * @returns {boolean}
 */
function shouldRetry(status, attempt) {
  if (attempt >= MAX_RETRIES - 1) return false;
  if (status === 429 && attempt < 2) return true;
  if (status === 500 && attempt < 1) return true;
  return false;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Executes a GET request against the HenrikDev API with automatic retries.
 *
 * HenrikDev always returns `{ status: 200, data: { ... } }`.
 * This function unwraps the envelope and returns the inner `data` object.
 *
 * @param {string} path - Relative API path, e.g. "/v1/account/Name/Tag".
 * @returns {Promise<unknown>} The unwrapped data payload.
 * @throws {ApiError} On non-retryable upstream errors.
 */
export async function henrikGet(path) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}${path}`, {
        headers:  { Authorization: env.henrikApiKey },
        timeout:  15_000,
      });

      // HenrikDev envelope: response.data = { status, data }
      // We only care about the inner data payload.
      return response.data?.data ?? response.data;
    } catch (err) {
      const status = err.response?.status ?? 500;
      lastError    = new ApiError(
        STATUS_MESSAGES[status] ?? "Unknown upstream error.",
        status,
        status === 429 ? 90 : undefined
      );

      if (shouldRetry(status, attempt)) {
        console.warn(`[RiotApiClient] Attempt ${attempt + 1} failed (${status}). Retrying in ${RETRY_DELAY_MS}ms…`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      break;
    }
  }

  throw lastError;
}
