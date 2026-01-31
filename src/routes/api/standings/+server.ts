import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';
import type { StandingsResponse, StandingsMap } from '$lib/types';

const API_BASE = 'https://api.balldontlie.io/v1';

// Get the current NBA season (season starts in October)
function getCurrentSeason(): number {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth(); // 0-indexed
	// If before October, we're in the previous year's season
	return month < 9 ? year - 1 : year;
}

function isCacheValid(cachedAt: string): boolean {
	const cacheTime = new Date(cachedAt).getTime();
	// Cache for 5 minutes - standings update when games finish
	return Date.now() - cacheTime < 5 * 60 * 1000;
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const seasonParam = url.searchParams.get('season');
	const season = seasonParam ? parseInt(seasonParam, 10) : getCurrentSeason();

	try {
		// Check cache first
		const { data: cached } = await supabase
			.from('standings_cache')
			.select('data, cached_at')
			.eq('season', season)
			.single();

		if (cached && isCacheValid(cached.cached_at)) {
			return json(cached.data as StandingsMap);
		}

		// Fetch from API
		const response = await fetch(`${API_BASE}/standings?season=${season}`, {
			headers: {
				Authorization: apiKey
			}
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('balldontlie standings API error:', response.status, text);

			if (response.status === 401) {
				throw error(500, 'API authentication failed');
			}
			if (response.status === 429) {
				throw error(429, 'Rate limit exceeded. Please try again later.');
			}

			throw error(response.status, 'Failed to fetch standings');
		}

		const data: StandingsResponse = await response.json();

		// Transform to a map for easy lookup by team abbreviation
		const standingsMap: StandingsMap = {};
		for (const standing of data.data) {
			standingsMap[standing.team.abbreviation] = {
				wins: standing.wins,
				losses: standing.losses,
				conference: standing.team.conference,
				conference_rank: standing.conference_rank
			};
		}

		// Cache the response
		await supabase.from('standings_cache').upsert(
			{
				season: season,
				data: standingsMap,
				cached_at: new Date().toISOString()
			},
			{ onConflict: 'season' }
		);

		return json(standingsMap);
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to fetch standings:', err);
		throw error(500, 'Failed to fetch standings');
	}
};
