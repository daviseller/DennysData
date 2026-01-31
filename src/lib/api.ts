import type { GamesResponse, BoxScore, StandingsMap, ApiResult } from './types';

/**
 * Fetch games for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function fetchGames(date: string, signal?: AbortSignal): Promise<ApiResult<GamesResponse>> {
	try {
		const response = await fetch(`/api/games?date=${date}`, { signal });

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: {
					message: errorData.message || 'Failed to fetch games',
					status: response.status
				}
			};
		}

		const data: GamesResponse = await response.json();
		return { data, error: null };
	} catch (err) {
		// Don't treat aborted requests as errors
		if (err instanceof Error && err.name === 'AbortError') {
			return { data: null, error: null };
		}
		return {
			data: null,
			error: {
				message: 'Network error. Please check your connection.',
				status: 0
			}
		};
	}
}

/**
 * Fetch box score for a specific game
 * @param gameId - The game ID
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function fetchBoxScore(gameId: number, signal?: AbortSignal): Promise<ApiResult<BoxScore>> {
	try {
		const response = await fetch(`/api/boxscore/${gameId}`, { signal });

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: {
					message: errorData.message || 'Failed to fetch box score',
					status: response.status
				}
			};
		}

		const result: { data: BoxScore } = await response.json();
		return { data: result.data, error: null };
	} catch (err) {
		// Don't treat aborted requests as errors
		if (err instanceof Error && err.name === 'AbortError') {
			return { data: null, error: null };
		}
		return {
			data: null,
			error: {
				message: 'Network error. Please check your connection.',
				status: 0
			}
		};
	}
}

/**
 * Fetch current season standings
 * @param season - Optional season year (defaults to current)
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function fetchStandings(season?: number, signal?: AbortSignal): Promise<ApiResult<StandingsMap>> {
	try {
		const url = season ? `/api/standings?season=${season}` : '/api/standings';
		const response = await fetch(url, { signal });

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: {
					message: errorData.message || 'Failed to fetch standings',
					status: response.status
				}
			};
		}

		const data: StandingsMap = await response.json();
		return { data, error: null };
	} catch (err) {
		// Don't treat aborted requests as errors
		if (err instanceof Error && err.name === 'AbortError') {
			return { data: null, error: null };
		}
		return {
			data: null,
			error: {
				message: 'Network error. Please check your connection.',
				status: 0
			}
		};
	}
}

/**
 * Format a date to YYYY-MM-DD for API calls
 */
export function formatDateForApi(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Get today's date formatted for API
 */
export function getTodayForApi(): string {
	return formatDateForApi(new Date());
}
