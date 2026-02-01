import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

const API_BASE = 'https://api.balldontlie.io/v1';

interface GameLogEntry {
	player_id: number;
	game_id: number;
	game_date: string;
	season: number;
	team_id: number;
	opponent_id: number | null;
	is_home: boolean | null;
	result: string | null;
	final_score: string | null;
	dnp: boolean;
	started: boolean | null;
	min: string | null;
	pts: number | null;
	reb: number | null;
	ast: number | null;
	stl: number | null;
	blk: number | null;
	turnover: number | null;
	pf: number | null;
	fgm: number | null;
	fga: number | null;
	fg3m: number | null;
	fg3a: number | null;
	ftm: number | null;
	fta: number | null;
	oreb: number | null;
	dreb: number | null;
	plus_minus: number | null;
}

// Check if player played (has minutes > 0)
function didPlay(minStr: string | null): boolean {
	if (!minStr) return false;
	const parts = minStr.split(':');
	const minutes = parseInt(parts[0], 10) || 0;
	return minutes > 0;
}

// Parse API stat response into game log entry
function parseGameStat(stat: any, playerId: number): GameLogEntry | null {
	if (!stat.game || !stat.team) return null;

	const game = stat.game;
	// The stats endpoint returns home_team_id/visitor_team_id as integers, not objects
	const homeTeamId = game.home_team_id ?? game.home_team?.id;
	const visitorTeamId = game.visitor_team_id ?? game.visitor_team?.id;
	const isHome = homeTeamId === stat.team.id;
	const opponentId = isHome ? visitorTeamId : homeTeamId;

	// Determine result
	let result: string | null = null;
	let finalScore: string | null = null;

	if (game.home_team_score != null && game.visitor_team_score != null) {
		const playerScore = isHome ? game.home_team_score : game.visitor_team_score;
		const oppScore = isHome ? game.visitor_team_score : game.home_team_score;
		result = playerScore > oppScore ? 'W' : playerScore < oppScore ? 'L' : null;
		finalScore = `${playerScore}-${oppScore}`;
	}

	const played = didPlay(stat.min);

	return {
		player_id: playerId,
		game_id: game.id,
		game_date: game.date,
		season: game.season,
		team_id: stat.team.id,
		opponent_id: opponentId || null,
		is_home: isHome,
		result,
		final_score: finalScore,
		dnp: !played,
		started: null, // Will be populated from lineups
		min: played ? stat.min : null,
		pts: stat.pts ?? null,
		reb: stat.reb ?? null,
		ast: stat.ast ?? null,
		stl: stat.stl ?? null,
		blk: stat.blk ?? null,
		turnover: stat.turnover ?? null,
		pf: stat.pf ?? null,
		fgm: stat.fgm ?? null,
		fga: stat.fga ?? null,
		fg3m: stat.fg3m ?? null,
		fg3a: stat.fg3a ?? null,
		ftm: stat.ftm ?? null,
		fta: stat.fta ?? null,
		oreb: stat.oreb ?? null,
		dreb: stat.dreb ?? null,
		plus_minus: stat.plus_minus ?? null
	};
}

// Fetch game stats from API for a season
async function fetchGameStatsFromAPI(
	playerId: number,
	season: number,
	apiKey: string
): Promise<GameLogEntry[]> {
	const entries: GameLogEntry[] = [];
	let cursor: string | null = null;
	let pages = 0;
	const maxPages = 10;

	try {
		while (pages < maxPages) {
			const url = cursor
				? `${API_BASE}/stats?seasons[]=${season}&player_ids[]=${playerId}&per_page=100&postseason=false&cursor=${cursor}`
				: `${API_BASE}/stats?seasons[]=${season}&player_ids[]=${playerId}&per_page=100&postseason=false`;

			const response = await fetch(url, { headers: { Authorization: apiKey } });

			if (!response.ok) {
				if (response.status === 429) {
					await new Promise((resolve) => setTimeout(resolve, 2000));
					continue;
				}
				break;
			}

			const data = await response.json();

			for (const stat of data.data || []) {
				const entry = parseGameStat(stat, playerId);
				if (entry) {
					entries.push(entry);
				}
			}

			if (!data.meta?.next_cursor) break;
			cursor = data.meta.next_cursor;
			pages++;

			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	} catch {
		// Return what we have
	}

	return entries;
}

// Cache game log entries to database
async function cacheGameLog(entries: GameLogEntry[]): Promise<void> {
	if (entries.length === 0) return;

	const rows = entries.map((e) => ({
		...e,
		updated_at: new Date().toISOString()
	}));

	// Upsert in batches to avoid payload limits
	const batchSize = 50;
	for (let i = 0; i < rows.length; i += batchSize) {
		const batch = rows.slice(i, i + batchSize);
		await supabase.from('player_game_log').upsert(batch, { onConflict: 'player_id,game_id' });
	}
}

// Fetch lineups for games to determine if player started
async function fetchStarterInfo(
	playerId: number,
	gameIds: number[],
	apiKey: string
): Promise<Map<number, boolean>> {
	const starterMap = new Map<number, boolean>();

	// Check lineups_cache first
	const { data: cachedLineups } = await supabase
		.from('lineups_cache')
		.select('game_id, starters')
		.in('game_id', gameIds);

	const cachedGameIds = new Set<number>();
	if (cachedLineups) {
		for (const lineup of cachedLineups) {
			cachedGameIds.add(lineup.game_id);
			const starters: number[] = lineup.starters || [];
			starterMap.set(lineup.game_id, starters.includes(playerId));
		}
	}

	// Fetch missing lineups from API (limit to avoid too many requests)
	const missingGameIds = gameIds.filter(id => !cachedGameIds.has(id)).slice(0, 20);

	for (const gameId of missingGameIds) {
		try {
			const response = await fetch(`${API_BASE}/games/${gameId}/lineups`, {
				headers: { Authorization: apiKey }
			});

			if (response.ok) {
				const data = await response.json();
				const allStarters: number[] = [];

				// Collect all starter IDs
				if (data.data?.home_starters) {
					allStarters.push(...data.data.home_starters.map((p: any) => p.id));
				}
				if (data.data?.visitor_starters) {
					allStarters.push(...data.data.visitor_starters.map((p: any) => p.id));
				}

				// Cache the lineups
				await supabase.from('lineups_cache').upsert({
					game_id: gameId,
					starters: allStarters,
					data: data.data,
					cached_at: new Date().toISOString()
				}, { onConflict: 'game_id' });

				starterMap.set(gameId, allStarters.includes(playerId));
			}

			// Rate limit
			await new Promise(resolve => setTimeout(resolve, 100));
		} catch {
			// Skip this game
		}
	}

	return starterMap;
}

// Update starter info in cached game logs
async function updateStarterInfo(
	playerId: number,
	gameIds: number[],
	starterMap: Map<number, boolean>
): Promise<void> {
	for (const [gameId, started] of starterMap) {
		await supabase
			.from('player_game_log')
			.update({ started })
			.eq('player_id', playerId)
			.eq('game_id', gameId);
	}
}

// Get current NBA season
function getCurrentSeason(): number {
	const now = new Date();
	const month = now.getMonth();
	const year = now.getFullYear();
	// NBA season starts in October
	return month < 9 ? year - 1 : year;
}

export const GET: RequestHandler = async ({ params, url }) => {
	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const playerId = parseInt(params.id, 10);
	if (isNaN(playerId)) {
		throw error(400, 'Invalid player ID');
	}

	// Parse query params
	const seasonParam = url.searchParams.get('season');
	const season = seasonParam ? parseInt(seasonParam, 10) : getCurrentSeason();

	if (isNaN(season)) {
		throw error(400, 'Invalid season');
	}

	try {
		// First check cache
		const { data: cachedGames } = await supabase
			.from('player_game_log')
			.select(
				`
				*,
				team:teams!player_game_log_team_id_fkey(*),
				opponent:teams!player_game_log_opponent_id_fkey(*)
			`
			)
			.eq('player_id', playerId)
			.eq('season', season)
			.order('game_date', { ascending: false });

		// If we have cached data for this season, return it
		if (cachedGames && cachedGames.length > 0) {
			return json({
				data: {
					player_id: playerId,
					season,
					games: cachedGames.map((g) => ({
						game_id: g.game_id,
						date: g.game_date,
						team: g.team,
						opponent: g.opponent,
						is_home: g.is_home,
						result: g.result,
						final_score: g.final_score,
						dnp: g.dnp ?? false,
						started: g.started,
						min: g.min,
						pts: g.pts,
						reb: g.reb,
						ast: g.ast,
						stl: g.stl,
						blk: g.blk,
						turnover: g.turnover,
						pf: g.pf,
						fgm: g.fgm,
						fga: g.fga,
						fg3m: g.fg3m,
						fg3a: g.fg3a,
						ftm: g.ftm,
						fta: g.fta,
						oreb: g.oreb,
						dreb: g.dreb,
						plus_minus: g.plus_minus
					}))
				}
			});
		}

		// Fetch from API
		const entries = await fetchGameStatsFromAPI(playerId, season, apiKey);

		// Cache the results
		await cacheGameLog(entries);

		// Fetch team info for the entries
		const teamIds = [...new Set(entries.flatMap((e) => [e.team_id, e.opponent_id].filter(Boolean)))];
		const { data: teams } = await supabase.from('teams').select('*').in('id', teamIds);

		const teamsMap: Record<number, any> = {};
		if (teams) {
			for (const t of teams) {
				teamsMap[t.id] = t;
			}
		}

		// Sort by date descending
		entries.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());

		return json({
			data: {
				player_id: playerId,
				season,
				games: entries.map((e) => ({
					game_id: e.game_id,
					date: e.game_date,
					team: teamsMap[e.team_id] || null,
					opponent: e.opponent_id ? teamsMap[e.opponent_id] || null : null,
					is_home: e.is_home,
					result: e.result,
					final_score: e.final_score,
					dnp: e.dnp,
					started: e.started,
					min: e.min,
					pts: e.pts,
					reb: e.reb,
					ast: e.ast,
					stl: e.stl,
					blk: e.blk,
					turnover: e.turnover,
					pf: e.pf,
					fgm: e.fgm,
					fga: e.fga,
					fg3m: e.fg3m,
					fg3a: e.fg3a,
					ftm: e.ftm,
					fta: e.fta,
					oreb: e.oreb,
					dreb: e.dreb,
					plus_minus: e.plus_minus
				}))
			}
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to fetch game log:', err);
		throw error(500, 'Failed to fetch game log');
	}
};
