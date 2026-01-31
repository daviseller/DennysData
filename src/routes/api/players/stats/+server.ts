import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// Get the current NBA season (season starts in October)
function getCurrentSeason(): number {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	return month < 9 ? year - 1 : year;
}

export const GET: RequestHandler = async ({ url }) => {
	const teamIdsParam = url.searchParams.get('team_ids');
	const playerIdsParam = url.searchParams.get('player_ids');
	const seasonParam = url.searchParams.get('season');

	const season = seasonParam ? parseInt(seasonParam, 10) : getCurrentSeason();

	if (!teamIdsParam && !playerIdsParam) {
		throw error(400, 'Must provide team_ids or player_ids');
	}

	try {
		let query = supabase
			.from('player_season_stats')
			.select(`
				player_id,
				season,
				games_played,
				min,
				pts,
				reb,
				ast,
				stl,
				blk,
				turnover,
				fgm,
				fga,
				fg_pct,
				fg3m,
				fg3a,
				fg3_pct,
				ftm,
				fta,
				ft_pct,
				oreb,
				dreb,
				players!inner (
					id,
					first_name,
					last_name,
					team_id,
					position,
					jersey_number
				)
			`)
			.eq('season', season);

		if (teamIdsParam) {
			const teamIds = teamIdsParam.split(',').map((id) => parseInt(id, 10));
			query = query.in('players.team_id', teamIds);
		}

		if (playerIdsParam) {
			const playerIds = playerIdsParam.split(',').map((id) => parseInt(id, 10));
			query = query.in('player_id', playerIds);
		}

		const { data, error: dbError } = await query;

		if (dbError) {
			console.error('Database error:', dbError);
			throw error(500, 'Failed to fetch player stats');
		}

		// Transform to a more usable format
		const stats = (data || []).map((row: any) => ({
			player: {
				id: row.players.id,
				first_name: row.players.first_name,
				last_name: row.players.last_name,
				team_id: row.players.team_id,
				position: row.players.position,
				jersey_number: row.players.jersey_number
			},
			season: row.season,
			games_played: row.games_played,
			min: row.min,
			pts: row.pts,
			reb: row.reb,
			ast: row.ast,
			stl: row.stl,
			blk: row.blk,
			turnover: row.turnover,
			fgm: row.fgm,
			fga: row.fga,
			fg_pct: row.fg_pct,
			fg3m: row.fg3m,
			fg3a: row.fg3a,
			fg3_pct: row.fg3_pct,
			ftm: row.ftm,
			fta: row.fta,
			ft_pct: row.ft_pct,
			oreb: row.oreb,
			dreb: row.dreb
		}));

		return json({ data: stats, season });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to fetch player stats:', err);
		throw error(500, 'Failed to fetch player stats');
	}
};
