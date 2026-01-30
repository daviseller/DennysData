import { json, error } from '@sveltejs/kit';
import { BALLDONTLIE_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import type { GamesResponse } from '$lib/types';

const API_BASE = 'https://api.balldontlie.io/v1';

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
