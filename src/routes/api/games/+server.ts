import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';
import type { GamesResponse, Game, Broadcast } from '$lib/types';

const API_BASE = 'https://api.balldontlie.io/v1';
const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

// ESPN team abbreviation mapping (ESPN uses different abbrs for some teams)
const ESPN_ABBR_MAP: Record<string, string> = {
	'GS': 'GSW',
	'NY': 'NYK',
	'NO': 'NOP',
	'SA': 'SAS',
	'UTAH': 'UTA',
	'WSH': 'WAS'
};

function normalizeAbbr(abbr: string): string {
	return ESPN_ABBR_MAP[abbr] || abbr;
}

interface ESPNBroadcast {
	market: string;
	names: string[];
}

interface ESPNGame {
	competitions: Array<{
		competitors: Array<{
			homeAway: string;
			team: { abbreviation: string };
		}>;
		broadcasts?: ESPNBroadcast[];
	}>;
}

interface ESPNResponse {
	events: ESPNGame[];
}

async function fetchESPNBroadcasts(date: string, fetchFn: typeof fetch): Promise<Map<string, Broadcast[]>> {
	const broadcastMap = new Map<string, Broadcast[]>();

	try {
		// ESPN uses YYYYMMDD format
		const espnDate = date.replace(/-/g, '');
		const response = await fetchFn(`${ESPN_API}?dates=${espnDate}`);

		if (!response.ok) {
			console.warn('ESPN API returned:', response.status);
			return broadcastMap;
		}

		const data: ESPNResponse = await response.json();

		for (const event of data.events || []) {
			const competition = event.competitions?.[0];
			if (!competition) continue;

			const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
			const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');

			if (!homeTeam || !awayTeam) continue;

			const homeAbbr = normalizeAbbr(homeTeam.team.abbreviation);
			const awayAbbr = normalizeAbbr(awayTeam.team.abbreviation);
			const key = `${awayAbbr}@${homeAbbr}`;

			const broadcasts: Broadcast[] = [];
			for (const b of competition.broadcasts || []) {
				for (const name of b.names || []) {
					broadcasts.push({
						network: name,
						market: b.market as 'national' | 'home' | 'away'
					});
				}
			}

			if (broadcasts.length > 0) {
				broadcastMap.set(key, broadcasts);
			}
		}
	} catch (err) {
		console.warn('Failed to fetch ESPN broadcasts:', err);
	}

	return broadcastMap;
}

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

		// Fetch ESPN broadcasts in parallel (don't wait if it fails)
		const broadcastMap = await fetchESPNBroadcasts(date, fetch);

		// Merge broadcast data into games
		for (const game of data.data) {
			const key = `${game.visitor_team.abbreviation}@${game.home_team.abbreviation}`;
			const broadcasts = broadcastMap.get(key);
			if (broadcasts) {
				game.broadcasts = broadcasts;
			}
		}

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
