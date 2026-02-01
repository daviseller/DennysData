import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

const API_BASE = 'https://api.balldontlie.io/v1';

// Get all seasons a player might have played (from draft year to current)
function getPlayerSeasonRange(draftYear: number | null): number[] {
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth();
	// NBA season starts in October, so if we're before October, current season is last year
	const currentSeason = currentMonth < 9 ? currentYear - 1 : currentYear;

	// Use draft year if available, otherwise default to 1996 (when detailed stats began)
	// API has basic data back to 1946, but most useful stats start around 1996
	const startYear = draftYear || 1996;

	const seasons: number[] = [];
	for (let year = startYear; year <= currentSeason; year++) {
		seasons.push(year);
	}
	return seasons;
}

// Fetch season averages from the API (uses season_type=regular for accurate counts)
async function fetchSeasonAverages(
	playerId: number,
	season: number,
	apiKey: string
): Promise<any | null> {
	try {
		const url = `${API_BASE}/season_averages/general?season=${season}&season_type=regular&player_ids[]=${playerId}&type=base`;
		const response = await fetch(url, { headers: { Authorization: apiKey } });

		if (!response.ok) {
			if (response.status === 429) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
				const retry = await fetch(url, { headers: { Authorization: apiKey } });
				if (!retry.ok) return null;
				const data = await retry.json();
				return data.data?.[0] || null;
			}
			return null;
		}

		const data = await response.json();
		return data.data?.[0] || null;
	} catch {
		return null;
	}
}

// Fetch all game stats for a player in a season, grouped by team
async function fetchGameStatsByTeam(
	playerId: number,
	season: number,
	apiKey: string
): Promise<Map<number, { team: any; games: any[] }>> {
	const teamMap = new Map<number, { team: any; games: any[] }>();
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
				if (stat.team?.id) {
					const existing = teamMap.get(stat.team.id);
					if (existing) {
						existing.games.push(stat);
					} else {
						teamMap.set(stat.team.id, { team: stat.team, games: [stat] });
					}
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

	return teamMap;
}

// Calculate averages from a set of game stats
function calculateAverages(games: any[]): {
	gamesPlayed: number;
	min: number | null;
	pts: number | null;
	reb: number | null;
	ast: number | null;
	stl: number | null;
	blk: number | null;
	turnover: number | null;
	fgm: number | null;
	fga: number | null;
	fg_pct: number | null;
	fg3m: number | null;
	fg3a: number | null;
	fg3_pct: number | null;
	ftm: number | null;
	fta: number | null;
	ft_pct: number | null;
	oreb: number | null;
	dreb: number | null;
} {
	// Filter out future/unplayed games (0 minutes = DNP or not yet played)
	const playedGames = games.filter((g) => {
		const min = typeof g.min === 'string' ? parseFloat(g.min.split(':')[0]) : g.min || 0;
		return min > 0;
	});

	if (playedGames.length === 0) {
		return {
			gamesPlayed: 0,
			min: null, pts: null, reb: null, ast: null, stl: null, blk: null,
			turnover: null, fgm: null, fga: null, fg_pct: null, fg3m: null,
			fg3a: null, fg3_pct: null, ftm: null, fta: null, ft_pct: null,
			oreb: null, dreb: null
		};
	}

	let totalMin = 0, totalPts = 0, totalReb = 0, totalAst = 0;
	let totalStl = 0, totalBlk = 0, totalTov = 0;
	let totalFgm = 0, totalFga = 0, totalFg3m = 0, totalFg3a = 0;
	let totalFtm = 0, totalFta = 0, totalOreb = 0, totalDreb = 0;

	for (const g of playedGames) {
		const min = typeof g.min === 'string' ? parseFloat(g.min.split(':')[0]) : g.min || 0;
		totalMin += min;
		totalPts += g.pts || 0;
		totalReb += g.reb || 0;
		totalAst += g.ast || 0;
		totalStl += g.stl || 0;
		totalBlk += g.blk || 0;
		totalTov += g.turnover || g.tov || 0;
		totalFgm += g.fgm || 0;
		totalFga += g.fga || 0;
		totalFg3m += g.fg3m || 0;
		totalFg3a += g.fg3a || 0;
		totalFtm += g.ftm || 0;
		totalFta += g.fta || 0;
		totalOreb += g.oreb || 0;
		totalDreb += g.dreb || 0;
	}

	const n = playedGames.length;
	return {
		gamesPlayed: n,
		min: totalMin / n,
		pts: totalPts / n,
		reb: totalReb / n,
		ast: totalAst / n,
		stl: totalStl / n,
		blk: totalBlk / n,
		turnover: totalTov / n,
		fgm: totalFgm / n,
		fga: totalFga / n,
		fg_pct: totalFga > 0 ? totalFgm / totalFga : null,
		fg3m: totalFg3m / n,
		fg3a: totalFg3a / n,
		fg3_pct: totalFg3a > 0 ? totalFg3m / totalFg3a : null,
		ftm: totalFtm / n,
		fta: totalFta / n,
		ft_pct: totalFta > 0 ? totalFtm / totalFta : null,
		oreb: totalOreb / n,
		dreb: totalDreb / n
	};
}

// Fetch season stats for a player, with per-team breakdown for multi-team seasons
async function fetchSeasonStats(
	playerId: number,
	season: number,
	apiKey: string
): Promise<any[]> {
	// First, get overall season averages (uses season_type=regular for accurate game count)
	const seasonAvg = await fetchSeasonAverages(playerId, season, apiKey);
	if (!seasonAvg) return [];

	// Fetch game stats grouped by team
	const teamsMap = await fetchGameStatsByTeam(playerId, season, apiKey);

	if (teamsMap.size <= 1) {
		// Single team season - use the season average (most accurate)
		const teamEntry = teamsMap.size === 1 ? Array.from(teamsMap.values())[0] : null;
		return [
			{
				player_id: playerId,
				season,
				team_id: teamEntry?.team?.id || null,
				team: teamEntry?.team || null,
				games_played: seasonAvg.stats?.gp || seasonAvg.gp || 0,
				min: seasonAvg.stats?.min || seasonAvg.min || null,
				pts: seasonAvg.stats?.pts || seasonAvg.pts || null,
				reb: seasonAvg.stats?.reb || seasonAvg.reb || null,
				ast: seasonAvg.stats?.ast || seasonAvg.ast || null,
				stl: seasonAvg.stats?.stl || seasonAvg.stl || null,
				blk: seasonAvg.stats?.blk || seasonAvg.blk || null,
				turnover: seasonAvg.stats?.tov || seasonAvg.stats?.turnover || seasonAvg.tov || seasonAvg.turnover || null,
				fgm: seasonAvg.stats?.fgm || seasonAvg.fgm || null,
				fga: seasonAvg.stats?.fga || seasonAvg.fga || null,
				fg_pct: seasonAvg.stats?.fg_pct || seasonAvg.fg_pct || null,
				fg3m: seasonAvg.stats?.fg3m || seasonAvg.fg3m || null,
				fg3a: seasonAvg.stats?.fg3a || seasonAvg.fg3a || null,
				fg3_pct: seasonAvg.stats?.fg3_pct || seasonAvg.fg3_pct || null,
				ftm: seasonAvg.stats?.ftm || seasonAvg.ftm || null,
				fta: seasonAvg.stats?.fta || seasonAvg.fta || null,
				ft_pct: seasonAvg.stats?.ft_pct || seasonAvg.ft_pct || null,
				oreb: seasonAvg.stats?.oreb || seasonAvg.oreb || null,
				dreb: seasonAvg.stats?.dreb || seasonAvg.dreb || null
			}
		];
	}

	// Multi-team season - calculate per-team averages from game stats
	const results: any[] = [];

	for (const [teamId, { team, games }] of teamsMap) {
		// Calculate actual per-team averages (filters out unplayed/future games)
		const avgs = calculateAverages(games);

		// Skip if no games actually played with this team
		if (avgs.gamesPlayed === 0) continue;

		results.push({
			player_id: playerId,
			season,
			team_id: teamId,
			team,
			games_played: avgs.gamesPlayed,
			min: avgs.min,
			pts: avgs.pts,
			reb: avgs.reb,
			ast: avgs.ast,
			stl: avgs.stl,
			blk: avgs.blk,
			turnover: avgs.turnover,
			fgm: avgs.fgm,
			fga: avgs.fga,
			fg_pct: avgs.fg_pct,
			fg3m: avgs.fg3m,
			fg3a: avgs.fg3a,
			fg3_pct: avgs.fg3_pct,
			ftm: avgs.ftm,
			fta: avgs.fta,
			ft_pct: avgs.ft_pct,
			oreb: avgs.oreb,
			dreb: avgs.dreb
		});
	}

	return results;
}

// Cache per-team season stats in Supabase
async function cachePerTeamStats(
	stats: Array<{
		player_id: number;
		season: number;
		team_id: number;
		games_played: number;
		min: number | null;
		pts: number | null;
		reb: number | null;
		ast: number | null;
		stl: number | null;
		blk: number | null;
		turnover: number | null;
		fgm: number | null;
		fga: number | null;
		fg_pct: number | null;
		fg3m: number | null;
		fg3a: number | null;
		fg3_pct: number | null;
		ftm: number | null;
		fta: number | null;
		ft_pct: number | null;
		oreb: number | null;
		dreb: number | null;
	}>
): Promise<void> {
	if (stats.length === 0) return;

	const rows = stats.map((s) => ({
		player_id: s.player_id,
		season: s.season,
		team_id: s.team_id,
		games_played: s.games_played,
		min: s.min,
		pts: s.pts,
		reb: s.reb,
		ast: s.ast,
		stl: s.stl,
		blk: s.blk,
		turnover: s.turnover,
		fgm: s.fgm,
		fga: s.fga,
		fg_pct: s.fg_pct,
		fg3m: s.fg3m,
		fg3a: s.fg3a,
		fg3_pct: s.fg3_pct,
		ftm: s.ftm,
		fta: s.fta,
		ft_pct: s.ft_pct,
		oreb: s.oreb,
		dreb: s.dreb,
		updated_at: new Date().toISOString()
	}));

	await supabase.from('player_season_stats').upsert(rows, { onConflict: 'player_id,season,team_id' });
}

export const GET: RequestHandler = async ({ params }) => {
	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const playerId = parseInt(params.id, 10);

	if (isNaN(playerId)) {
		throw error(400, 'Invalid player ID');
	}

	try {
		// Fetch player bio and cached season stats in parallel
		// Note: We need to specify the FK relationship explicitly since there are multiple paths to teams
		const [playerResult, seasonStatsResult, injuryResult] = await Promise.all([
			supabase
				.from('players')
				.select('*, teams!players_team_id_fkey(*)')
				.eq('id', playerId)
				.single(),
			supabase
				.from('player_season_stats')
				.select('*, teams!player_season_stats_team_id_fkey(*)')
				.eq('player_id', playerId)
				.order('season', { ascending: false }),
			supabase
				.from('player_injuries')
				.select('*')
				.eq('player_id', playerId)
				.single()
		]);

		let player = playerResult.data;

		// If player not in our database, fetch from API
		if (!player) {
			const response = await fetch(`${API_BASE}/players/${playerId}`, {
				headers: { Authorization: apiKey }
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw error(404, 'Player not found');
				}
				throw error(500, 'Failed to fetch player');
			}

			const data = await response.json();
			const p = data.data;

			// Cache the player
			await supabase.from('players').upsert(
				{
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
				},
				{ onConflict: 'id' }
			);

			// Fetch the player with team data
			const freshPlayer = await supabase
				.from('players')
				.select('*, teams!players_team_id_fkey(*)')
				.eq('id', playerId)
				.single();

			player = freshPlayer.data;
		}

		if (!player) {
			throw error(404, 'Player not found');
		}

		// Get cached season stats
		let seasonStats = seasonStatsResult.data || [];
		const cachedSeasons = new Set(seasonStats.map((s: any) => s.season));

		// Determine which seasons we need to fetch
		const allSeasons = getPlayerSeasonRange(player.draft_year);
		const missingSeasonsToFetch = allSeasons.filter((s) => !cachedSeasons.has(s));

		// Fetch missing seasons (limit concurrent requests)
		if (missingSeasonsToFetch.length > 0) {
			const newStats: any[] = [];

			// Process in batches of 2 to avoid rate limits
			for (let i = 0; i < missingSeasonsToFetch.length; i += 2) {
				const batch = missingSeasonsToFetch.slice(i, i + 2);

				const results = await Promise.all(
					batch.map(async (season) => {
						// Fetch season stats (handles multi-team seasons)
						const stats = await fetchSeasonStats(playerId, season, apiKey);

						if (stats.length > 0) {
							// Cache the stats
							await cachePerTeamStats(stats);
							return stats;
						}
						return [];
					})
				);

				newStats.push(...results.flat());

				// Delay between batches
				if (i + 2 < missingSeasonsToFetch.length) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}

			// Merge new stats with cached and sort by season desc, then by games played desc
			seasonStats = [...seasonStats, ...newStats].sort((a, b) => {
				if (b.season !== a.season) return b.season - a.season;
				return (b.games_played || 0) - (a.games_played || 0);
			});
		}

		// Get team info for seasons that have team_id but no teams relation
		const teamsToFetch = seasonStats
			.filter((s: any) => s.team_id && !s.teams && !s.team)
			.map((s: any) => s.team_id);

		let teamsMap: Record<number, any> = {};
		if (teamsToFetch.length > 0) {
			const { data: teams } = await supabase
				.from('teams')
				.select('*')
				.in('id', teamsToFetch);

			if (teams) {
				teamsMap = Object.fromEntries(teams.map((t) => [t.id, t]));
			}
		}

		// Format response
		const response = {
			player: {
				id: player.id,
				first_name: player.first_name,
				last_name: player.last_name,
				position: player.position,
				height: player.height,
				weight: player.weight,
				jersey_number: player.jersey_number,
				country: player.country,
				draft_year: player.draft_year,
				draft_round: player.draft_round,
				draft_number: player.draft_number,
				team: player.teams || null
			},
			seasons: seasonStats
				.filter((s: any) => s.games_played > 0)
				.map((s: any) => ({
					season: s.season,
					team: s.teams || s.team || teamsMap[s.team_id] || null,
					games_played: s.games_played,
					min: s.min,
					pts: s.pts,
					reb: s.reb,
					ast: s.ast,
					stl: s.stl,
					blk: s.blk,
					turnover: s.turnover,
					fgm: s.fgm,
					fga: s.fga,
					fg_pct: s.fg_pct,
					fg3m: s.fg3m,
					fg3a: s.fg3a,
					fg3_pct: s.fg3_pct,
					ftm: s.ftm,
					fta: s.fta,
					ft_pct: s.ft_pct,
					oreb: s.oreb,
					dreb: s.dreb
				})),
			injury: injuryResult.data
				? {
						status: injuryResult.data.status,
						return_date: injuryResult.data.return_date,
						description: injuryResult.data.description
					}
				: null
		};

		return json({ data: response });
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to fetch player:', err);
		throw error(500, 'Failed to fetch player data');
	}
};
