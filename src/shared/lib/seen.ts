/**
 * Seen-Screen Utility
 * -------------------
 * Tracks which informational screens the user has already seen (e.g., the
 * Circle welcome banner). Uses localStorage so the preference persists
 * across sessions on the same device.
 */

const PREFIX = 'collzap_seen_';

export function hasSeenScreen(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) === '1';
  } catch {
    return false;
  }
}

export function markScreenSeen(key: string): void {
  try {
    localStorage.setItem(PREFIX + key, '1');
  } catch {
    // ignore storage errors (e.g., private browsing)
  }
}

export function resetSeenScreens(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
