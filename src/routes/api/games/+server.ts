import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';
import type { GamesResponse, Game } from '$lib/types';

const API_BASE = 'https://api.balldontlie.io/v1';

function isToday(date: string): boolean {
	const gameDate = new Date(date + 'T12:00:00'); // noon to avoid timezone issues
	const today = new Date();
	return (
		gameDate.getFullYear() === today.getFullYear() &&
		gameDate.getMonth() === today.getMonth() &&
		gameDate.getDate() === today.getDate()
	);
}

function isHistorical(date: string): boolean {
	const gameDate = new Date(date + 'T12:00:00');
	const now = new Date();
	const diff = now.getTime() - gameDate.getTime();
	return diff > 24 * 60 * 60 * 1000; // More than 24 hours ago
}

function isCacheValid(cachedAt: string, date: string): boolean {
	// Never use cache for today's games - they might be live
	if (isToday(date)) {
		return false;
	}
	// Historical games are always valid
	if (isHistorical(date)) {
		return true;
	}
	// Future/recent games valid for 30 minutes
	const cacheTime = new Date(cachedAt).getTime();
	return Date.now() - cacheTime < 30 * 60 * 1000;
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const date = url.searchParams.get('date');

	if (!date) {
		throw error(400, 'Missing required parameter: date (YYYY-MM-DD)');
	}

	// Validate date format
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw error(400, 'Invalid date format. Use YYYY-MM-DD');
	}

	try {
		// Check cache first
		const { data: cached } = await supabase
			.from('games_cache')
			.select('data, cached_at')
			.eq('date', date)
			.single();

		if (cached && isCacheValid(cached.cached_at, date)) {
			return json(cached.data as GamesResponse);
		}

		// Fetch from API
		const response = await fetch(`${API_BASE}/games?dates[]=${date}`, {
			headers: {
				Authorization: apiKey
			}
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('balldontlie API error:', response.status, text);

			if (response.status === 401) {
				throw error(500, 'API authentication failed');
			}
			if (response.status === 429) {
				throw error(429, 'Rate limit exceeded. Please try again later.');
			}

			throw error(response.status, 'Failed to fetch games');
		}

		const data: GamesResponse = await response.json();

		// Don't cache today's games (might be live) or if any are currently live
		const hasLiveGames = data.data.some(
			(game: Game) => game.status !== 'Final' && game.period > 0
		);
		const shouldCache = !isToday(date) && !hasLiveGames;

		// Cache the response (upsert by date)
		if (shouldCache) {
			// Create a unique ID from the date (YYYYMMDD as integer)
			const dateId = parseInt(date.replace(/-/g, ''), 10);

			await supabase.from('games_cache').upsert(
				{
					id: dateId,
					date: date,
					data: data,
					cached_at: new Date().toISOString()
				},
				{ onConflict: 'id' }
			);
		}

		return json(data);
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to fetch games:', err);
		throw error(500, 'Failed to fetch games');
	}
};
