import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';
import type { StatsResponse, Game, PlayerStats, BoxScore, TeamTotals, Broadcast } from '$lib/types';

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
	market: 'national' | 'home' | 'away';
	names: string[];
}

interface ESPNGame {
	competitions: Array<{
		competitors: Array<{
			team: { abbreviation: string };
			homeAway: 'home' | 'away';
		}>;
		broadcasts?: ESPNBroadcast[];
	}>;
}

interface ESPNResponse {
	events: ESPNGame[];
}

async function fetchBroadcastsForGame(
	homeAbbr: string,
	visitorAbbr: string,
	gameDate: string,
	fetchFn: typeof fetch
): Promise<Broadcast[]> {
	try {
		// ESPN uses YYYYMMDD format
		const espnDate = gameDate.replace(/-/g, '');
		const response = await fetchFn(`${ESPN_API}?dates=${espnDate}`);

		if (!response.ok) {
			return [];
		}

		const data: ESPNResponse = await response.json();

		for (const event of data.events) {
			const competition = event.competitions[0];
			if (!competition) continue;

			const home = competition.competitors.find((c) => c.homeAway === 'home');
			const away = competition.competitors.find((c) => c.homeAway === 'away');
			if (!home || !away) continue;

			const espnHome = normalizeAbbr(home.team.abbreviation);
			const espnAway = normalizeAbbr(away.team.abbreviation);

			// Match by team abbreviations
			if (espnHome === homeAbbr && espnAway === visitorAbbr) {
				const broadcasts: Broadcast[] = [];
				for (const b of competition.broadcasts || []) {
					for (const name of b.names) {
						broadcasts.push({
							network: name,
							market: b.market
						});
					}
				}
				return broadcasts;
			}
		}
	} catch (err) {
		console.warn('Failed to fetch ESPN broadcasts:', err);
	}

	return [];
}
const CACHE_TTL_RECENT = 5 * 60 * 1000; // 5 minutes for recent games

function isGameFinal(game: Game): boolean {
	return game.status === 'Final';
}

function isCacheValid(cachedAt: string, game: Game): boolean {
	// Final games are always valid
	if (isGameFinal(game)) {
		return true;
	}
	// In-progress/recent games valid for 5 minutes
	const cacheTime = new Date(cachedAt).getTime();
	return Date.now() - cacheTime < CACHE_TTL_RECENT;
}

export const GET: RequestHandler = async ({ params, fetch }) => {
	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const gameId = params.id;

	if (!gameId || !/^\d+$/.test(gameId)) {
		throw error(400, 'Invalid game ID');
	}

	const gameIdNum = parseInt(gameId, 10);

	try {
		// Check cache first
		const { data: cached } = await supabase
			.from('box_scores_cache')
			.select('data, cached_at')
			.eq('game_id', gameIdNum)
			.single();

		if (cached) {
			const boxScore = cached.data as { data: BoxScore };
			if (isCacheValid(cached.cached_at, boxScore.data.game)) {
				// For non-final games, fetch fresh broadcast info
				if (!isGameFinal(boxScore.data.game)) {
					const broadcasts = await fetchBroadcastsForGame(
						boxScore.data.game.home_team.abbreviation,
						boxScore.data.game.visitor_team.abbreviation,
						boxScore.data.game.date,
						fetch
					);
					if (broadcasts.length > 0) {
						boxScore.data.game.broadcasts = broadcasts;
					}
				}
				return json(boxScore);
			}
		}

		// Fetch game details and stats in parallel
		const [gameResponse, statsResponse] = await Promise.all([
			fetch(`${API_BASE}/games/${gameId}`, {
				headers: { Authorization: apiKey }
			}),
			fetch(`${API_BASE}/stats?game_ids[]=${gameId}&per_page=100`, {
				headers: { Authorization: apiKey }
			})
		]);

		if (!gameResponse.ok || !statsResponse.ok) {
			if (gameResponse.status === 404) {
				throw error(404, 'Game not found');
			}
			if (gameResponse.status === 429 || statsResponse.status === 429) {
				throw error(429, 'Rate limit exceeded. Please try again later.');
			}

			console.error('API errors:', gameResponse.status, statsResponse.status);
			throw error(500, 'Failed to fetch box score');
		}

		const gameData: { data: Game } = await gameResponse.json();
		const statsData: StatsResponse = await statsResponse.json();

		const game = gameData.data;
		const stats = statsData.data;

		// Fetch broadcast info for non-final games
		if (!isGameFinal(game)) {
			const broadcasts = await fetchBroadcastsForGame(
				game.home_team.abbreviation,
				game.visitor_team.abbreviation,
				game.date,
				fetch
			);
			if (broadcasts.length > 0) {
				game.broadcasts = broadcasts;
			}
		}

		// Separate stats by team
		const homeStats = stats.filter((s) => s.team.id === game.home_team.id);
		const visitorStats = stats.filter((s) => s.team.id === game.visitor_team.id);

		// Calculate team totals
		const homeTotals = calculateTeamTotals(homeStats);
		const visitorTotals = calculateTeamTotals(visitorStats);

		const boxScore: BoxScore = {
			game,
			home_team: {
				team: game.home_team,
				players: homeStats,
				totals: homeTotals
			},
			visitor_team: {
				team: game.visitor_team,
				players: visitorStats,
				totals: visitorTotals
			}
		};

		const responseData = { data: boxScore };

		// Cache if game is final
		if (isGameFinal(game)) {
			await supabase.from('box_scores_cache').upsert(
				{
					game_id: gameIdNum,
					data: responseData,
					cached_at: new Date().toISOString()
				},
				{ onConflict: 'game_id' }
			);
		}

		return json(responseData);
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to fetch box score:', err);
		throw error(500, 'Failed to fetch box score');
	}
};

function calculateTeamTotals(stats: PlayerStats[]): TeamTotals {
	const totals = stats.reduce(
		(acc, player) => {
			acc.fgm += player.fgm || 0;
			acc.fga += player.fga || 0;
			acc.fg3m += player.fg3m || 0;
			acc.fg3a += player.fg3a || 0;
			acc.ftm += player.ftm || 0;
			acc.fta += player.fta || 0;
			acc.oreb += player.oreb || 0;
			acc.dreb += player.dreb || 0;
			acc.reb += player.reb || 0;
			acc.ast += player.ast || 0;
			acc.stl += player.stl || 0;
			acc.blk += player.blk || 0;
			acc.turnover += player.turnover || 0;
			acc.pf += player.pf || 0;
			acc.pts += player.pts || 0;
			return acc;
		},
		{
			fgm: 0,
			fga: 0,
			fg3m: 0,
			fg3a: 0,
			ftm: 0,
			fta: 0,
			oreb: 0,
			dreb: 0,
			reb: 0,
			ast: 0,
			stl: 0,
			blk: 0,
			turnover: 0,
			pf: 0,
			pts: 0
		}
	);

	return {
		min: '240:00', // Team total minutes (5 players * 48 min)
		fgm: totals.fgm,
		fga: totals.fga,
		fg_pct: totals.fga > 0 ? totals.fgm / totals.fga : 0,
		fg3m: totals.fg3m,
		fg3a: totals.fg3a,
		fg3_pct: totals.fg3a > 0 ? totals.fg3m / totals.fg3a : 0,
		ftm: totals.ftm,
		fta: totals.fta,
		ft_pct: totals.fta > 0 ? totals.ftm / totals.fta : 0,
		oreb: totals.oreb,
		dreb: totals.dreb,
		reb: totals.reb,
		ast: totals.ast,
		stl: totals.stl,
		blk: totals.blk,
		turnover: totals.turnover,
		pf: totals.pf,
		pts: totals.pts
	};
}
