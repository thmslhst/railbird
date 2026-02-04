/**
 * Simple localStorage persistence for Railbird.
 *
 * Design principles:
 * - Typed keys prevent typos and enable autocomplete
 * - Versioned storage format for future migrations
 * - Generic get/set with JSON serialization
 * - Fails gracefully (returns null on errors)
 *
 * Extendable to:
 * - Add new storage keys (just extend StorageKey)
 * - Add migrations when data format changes
 * - Switch to IndexedDB for larger data
 */

import type { ControlPointData } from "@/systems/camera-rail";

// Storage keys - extend this as needed
export type StorageKey = "railbird:splatUrl" | "railbird:cameraRail";

// Versioned wrapper for stored data
interface StorageEnvelope<T> {
  version: number;
  data: T;
}

// Type mapping for each key
interface StorageSchema {
  "railbird:splatUrl": string;
  "railbird:cameraRail": ControlPointData[];
}

const CURRENT_VERSION = 1;

/**
 * Get a value from localStorage.
 * Returns null if not found or on error.
 */
export function storageGet<K extends StorageKey>(
  key: K
): StorageSchema[K] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const envelope: StorageEnvelope<StorageSchema[K]> = JSON.parse(raw);

    // Future: add migration logic here based on envelope.version
    if (envelope.version !== CURRENT_VERSION) {
      // For now, just return data as-is
      // Later: migrate(envelope.data, envelope.version, CURRENT_VERSION)
    }

    return envelope.data;
  } catch {
    return null;
  }
}

/**
 * Set a value in localStorage.
 * Returns true on success, false on error.
 */
export function storageSet<K extends StorageKey>(
  key: K,
  value: StorageSchema[K]
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const envelope: StorageEnvelope<StorageSchema[K]> = {
      version: CURRENT_VERSION,
      data: value,
    };
    localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a value from localStorage.
 */
export function storageRemove(key: StorageKey): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if a key exists in localStorage.
 */
export function storageHas(key: StorageKey): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}
