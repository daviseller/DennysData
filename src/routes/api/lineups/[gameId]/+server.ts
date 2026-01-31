import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

const API_BASE = 'https://api.balldontlie.io/v1';

export interface LineupPlayer {
	player_id: number;
	team_id: number;
	starter: boolean;
	position: string;
}

export const GET: RequestHandler = async ({ params, fetch }) => {
	const apiKey = BALLDONTLIE_API_KEY;

	if (!apiKey) {
		throw error(500, 'API key not configured');
	}

	const gameId = params.gameId;

	if (!gameId) {
		throw error(400, 'Missing game ID');
	}

	const gameIdNum = parseInt(gameId, 10);

	try {
		// Check cache first - lineups don't change once game starts
		const { data: cached } = await supabase
			.from('lineups_cache')
			.select('starters, data')
			.eq('game_id', gameIdNum)
			.single();

		if (cached) {
			return json({ data: cached.data, starters: cached.starters });
		}

		// Fetch from API
		const response = await fetch(`${API_BASE}/lineups?game_ids[]=${gameId}&per_page=100`, {
			headers: {
				Authorization: apiKey
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				// No lineup data yet - return empty
				return json({ data: [], starters: [] });
			}
			throw error(response.status, 'Failed to fetch lineups');
		}

		const data = await response.json();

		// Extract starter player IDs for easy lookup
		const starters: number[] = [];
		const lineups: LineupPlayer[] = [];

		for (const entry of data.data || []) {
			lineups.push({
				player_id: entry.player?.id,
				team_id: entry.team?.id,
				starter: entry.starter,
				position: entry.position
			});

			if (entry.starter && entry.player?.id) {
				starters.push(entry.player.id);
			}
		}

		// Cache if we have lineup data (game has started)
		if (lineups.length > 0) {
			await supabase.from('lineups_cache').upsert({
				game_id: gameIdNum,
				starters,
				data: lineups,
				cached_at: new Date().toISOString()
			}, { onConflict: 'game_id' });
		}

		return json({ data: lineups, starters });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to fetch lineups:', err);
		throw error(500, 'Failed to fetch lineups');
	}
};
