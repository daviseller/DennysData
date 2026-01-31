import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY, CRON_SECRET } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// Verify cron request (Vercel sends Authorization header)
function verifyCronRequest(request: Request): boolean {
	// In development, allow all requests
	if (process.env.NODE_ENV === 'development') return true;

	// Check for Vercel cron secret
	const authHeader = request.headers.get('authorization');
	if (authHeader === `Bearer ${CRON_SECRET}`) return true;

	return false;
}

const API_BASE = 'https://api.balldontlie.io/v1';

// Get the current NBA season (season starts in October)
function getCurrentSeason(): number {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	return month < 9 ? year - 1 : year;
}

// Helper to make API requests with rate limit handling
async function apiFetch(url: string, apiKey: string): Promise<Response> {
	const response = await fetch(url, {
		headers: { Authorization: apiKey }
	});

	if (response.status === 429) {
		// Rate limited - wait and retry once
		await new Promise((resolve) => setTimeout(resolve, 12000));
		return fetch(url, {
			headers: { Authorization: apiKey }
		});
	}

	return response;
}

// Fetch all pages from a paginated endpoint
async function fetchAllPages<T>(
	baseUrl: string,
	apiKey: string,
	maxPages = 50
): Promise<T[]> {
	const results: T[] = [];
	let cursor: string | null = null;
	let page = 0;

	while (page < maxPages) {
		const url = cursor ? `${baseUrl}&cursor=${cursor}` : baseUrl;
		const response = await apiFetch(url, apiKey);

		if (!response.ok) {
			console.error(`API error at ${url}:`, response.status);
			break;
		}

		const data = await response.json();
		results.push(...data.data);

		if (!data.meta?.next_cursor) break;
		cursor = data.meta.next_cursor;
		page++;

		// Small delay to avoid rate limits
		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	return results;
}

// Sync teams
async function syncTeams(apiKey: string): Promise<number> {
	const response = await apiFetch(`${API_BASE}/teams`, apiKey);
	if (!response.ok) throw new Error(`Failed to fetch teams: ${response.status}`);

	const data = await response.json();
	const teams = data.data;

	for (const team of teams) {
		await supabase.from('teams').upsert(
			{
				id: team.id,
				name: team.name,
				full_name: team.full_name,
				abbreviation: team.abbreviation,
				conference: team.conference,
				division: team.division,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'id' }
		);
	}

	return teams.length;
}

// Sync players
async function syncPlayers(apiKey: string): Promise<number> {
	const players = await fetchAllPages<any>(
		`${API_BASE}/players?per_page=100`,
		apiKey,
		100
	);

	// Batch upsert in chunks
	const chunkSize = 100;
	for (let i = 0; i < players.length; i += chunkSize) {
		const chunk = players.slice(i, i + chunkSize);
		const rows = chunk.map((p) => ({
			id: p.id,
			first_name: p.first_name,
			last_name: p.last_name,
			team_id: p.team?.id || null,
			position: p.position || null,
			jersey_number: p.jersey_number || null,
			height: p.height || null,
			weight: p.weight || null,
			country: p.country || null,
			draft_year: p.draft_year || null,
			draft_round: p.draft_round || null,
			draft_number: p.draft_number || null,
			updated_at: new Date().toISOString()
		}));

		await supabase.from('players').upsert(rows, { onConflict: 'id' });
	}

	return players.length;
}

// Sync player season stats
async function syncPlayerSeasonStats(apiKey: string, season: number): Promise<number> {
	const stats = await fetchAllPages<any>(
		`${API_BASE}/season_averages/general?season=${season}&season_type=regular&type=base&per_page=100`,
		apiKey,
		100
	);

	// Batch upsert in chunks
	const chunkSize = 100;
	for (let i = 0; i < stats.length; i += chunkSize) {
		const chunk = stats.slice(i, i + chunkSize);
		const rows = chunk.map((s) => ({
			player_id: s.player.id,
			season: s.season,
			games_played: s.stats.gp || 0,
			min: s.stats.min || null,
			pts: s.stats.pts || null,
			reb: s.stats.reb || null,
			ast: s.stats.ast || null,
			stl: s.stats.stl || null,
			blk: s.stats.blk || null,
			turnover: s.stats.tov || s.stats.turnover || null,
			pf: s.stats.pf || null,
			fgm: s.stats.fgm || null,
			fga: s.stats.fga || null,
			fg_pct: s.stats.fg_pct || null,
			fg3m: s.stats.fg3m || null,
			fg3a: s.stats.fg3a || null,
			fg3_pct: s.stats.fg3_pct || null,
			ftm: s.stats.ftm || null,
			fta: s.stats.fta || null,
			ft_pct: s.stats.ft_pct || null,
			oreb: s.stats.oreb || null,
			dreb: s.stats.dreb || null,
			updated_at: new Date().toISOString()
		}));

		await supabase.from('player_season_stats').upsert(rows, { onConflict: 'player_id,season' });
	}

	return stats.length;
}

// Sync team season stats
async function syncTeamSeasonStats(apiKey: string, season: number): Promise<number> {
	const response = await apiFetch(
		`${API_BASE}/team_season_averages/general?season=${season}&season_type=regular&type=base&per_page=100`,
		apiKey
	);

	if (!response.ok) throw new Error(`Failed to fetch team stats: ${response.status}`);

	const data = await response.json();
	const stats = data.data;

	for (const s of stats) {
		await supabase.from('team_season_stats').upsert(
			{
				team_id: s.team.id,
				season: s.season,
				games_played: s.stats.gp || 0,
				min: s.stats.min || null,
				pts: s.stats.pts || null,
				reb: s.stats.reb || null,
				ast: s.stats.ast || null,
				stl: s.stats.stl || null,
				blk: s.stats.blk || null,
				turnover: s.stats.tov || s.stats.turnover || null,
				pf: s.stats.pf || null,
				fgm: s.stats.fgm || null,
				fga: s.stats.fga || null,
				fg_pct: s.stats.fg_pct || null,
				fg3m: s.stats.fg3m || null,
				fg3a: s.stats.fg3a || null,
				fg3_pct: s.stats.fg3_pct || null,
				ftm: s.stats.ftm || null,
				fta: s.stats.fta || null,
				ft_pct: s.stats.ft_pct || null,
				oreb: s.stats.oreb || null,
				dreb: s.stats.dreb || null,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'team_id,season' }
		);
	}

	return stats.length;
}

export const POST: RequestHandler = async ({ url, request }) => {
	// Verify this is a legitimate cron request
	if (!verifyCronRequest(request)) {
		throw error(401, 'Unauthorized');
	}

	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const season = parseInt(url.searchParams.get('season') || '') || getCurrentSeason();
	const only = url.searchParams.get('only'); // Optional: 'teams', 'players', 'player_stats', 'team_stats'

	const results: Record<string, number | string> = {
		season,
		started_at: new Date().toISOString()
	};

	try {
		if (!only || only === 'teams') {
			results.teams = await syncTeams(apiKey);
		}

		if (!only || only === 'players') {
			results.players = await syncPlayers(apiKey);
		}

		if (!only || only === 'player_stats') {
			results.player_stats = await syncPlayerSeasonStats(apiKey, season);
		}

		if (!only || only === 'team_stats') {
			results.team_stats = await syncTeamSeasonStats(apiKey, season);
		}

		results.completed_at = new Date().toISOString();
		return json(results);
	} catch (err) {
		console.error('Sync failed:', err);
		throw error(500, `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};

// GET for easy browser testing
export const GET: RequestHandler = async (event) => {
	return POST(event);
};
