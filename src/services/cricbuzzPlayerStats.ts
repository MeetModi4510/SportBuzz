/**
 * Cricbuzz Player Batting Stats API Service
 *
 * Fetches career batting statistics from the Cricbuzz RapidAPI endpoint.
 * Endpoint: GET /stats/v1/player/{playerId}/batting
 *
 * This service handles only the HTTP layer — transformation is done separately
 * in utils/playerStatsTransformer.ts.
 */

import type { CricbuzzBattingStatsResponse } from '@/types/playerBattingTypes';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const BASE_URL = `https://${RAPIDAPI_HOST}`;

/**
 * Fetch player batting statistics from Cricbuzz.
 *
 * @param playerId - Cricbuzz numeric player ID
 * @returns Raw batting stats response with headers and format-grouped values
 * @throws Error if API key is missing, or if the request fails
 */
export async function getPlayerBattingStats(
  playerId: number
): Promise<CricbuzzBattingStatsResponse> {
  if (!RAPIDAPI_KEY) {
    throw new Error(
      'VITE_RAPIDAPI_KEY is not configured. Add it to your .env file.'
    );
  }

  const url = `${BASE_URL}/stats/v1/player/${playerId}/batting`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Player with ID ${playerId} not found on Cricbuzz`);
    }
    if (response.status === 429) {
      throw new Error('Cricbuzz API rate limit exceeded. Please try again later.');
    }
    throw new Error(
      `Cricbuzz API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // The API may return the stats directly or wrapped in an object
  // Handle both cases gracefully
  if (data && (data.headers || data.values)) {
    return data as CricbuzzBattingStatsResponse;
  }

  // Some response formats nest inside an "appIndex" or "bat" key
  if (data?.bat) {
    return data.bat as CricbuzzBattingStatsResponse;
  }

  // Return the raw data and let the transformer handle parsing
  return data as CricbuzzBattingStatsResponse;
}
