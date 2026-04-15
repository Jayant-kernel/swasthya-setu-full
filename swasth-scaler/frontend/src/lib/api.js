// Centralized API base URL — set VITE_API_URL in .env to override
export const API_BASE_URL = 'https://swasthya-setu-full.onrender.com/api/v1'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * apiFetch — drop-in fetch() replacement for Render backend calls.
 *
 * Render free tier spins down after inactivity. First request after
 * spin-down fails or times out. This wrapper:
 *   1. Tries the request normally.
 *   2. On network failure or 502/503/504, waits 4s then retries once.
 *   3. Shows nothing extra — callers handle errors as before.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  try {
    const res = await fetch(url, options)
    // Render returns 502/503/504 while waking up — retry after delay
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      await sleep(4000)
      return fetch(url, options)
    }
    return res
  } catch {
    // Network error (server still waking) — wait then retry once
    await sleep(4000)
    return fetch(url, options)
  }
}
