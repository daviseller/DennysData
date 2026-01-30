<script lang="ts">
	import { fetchGames, formatDateForApi } from '$lib/api';
	import type { Game } from '$lib/types';
	import DayPicker from '$lib/components/DayPicker.svelte';
	import GamesList from '$lib/components/GamesList.svelte';

	let currentTheme = $state('arena');
	let selectedDate = $state(new Date());
	let games = $state<Game[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const themes = [
		{ id: 'hardwood', name: 'Hardwood', type: 'dark' },
		{ id: 'broadcast', name: 'Broadcast', type: 'dark' },
		{ id: 'tunnel', name: 'Tunnel', type: 'dark' },
		{ id: 'jumbotron', name: 'Jumbotron', type: 'dark' },
		{ id: 'blackout', name: 'Blackout', type: 'dark' },
		{ id: 'arena', name: 'Arena', type: 'light' },
		{ id: 'courtside', name: 'Courtside', type: 'light' },
		{ id: 'pressbox', name: 'Pressbox', type: 'light' },
		{ id: 'practice', name: 'Practice', type: 'light' },
		{ id: 'chalk', name: 'Chalk', type: 'light' }
	];

	function setTheme(themeId: string) {
		currentTheme = themeId;
		document.documentElement.setAttribute('data-theme', themeId);
	}

	async function loadGames(date: Date) {
		loading = true;
		error = null;

		const dateStr = formatDateForApi(date);
		const result = await fetchGames(dateStr);

		if (result.error) {
			error = result.error.message;
			games = [];
		} else {
			games = result.data?.data ?? [];
		}

		loading = false;
	}

	function handleDateChange(date: Date) {
		selectedDate = date;
		loadGames(date);
	}

	// Load games on mount
	$effect(() => {
		loadGames(selectedDate);
	});
</script>

<div class="container">
	<header class="header">
		<h1>DennysData</h1>
		<p class="text-secondary">NBA Box Scores</p>
	</header>

	<section class="day-picker-section">
		<DayPicker {selectedDate} onDateChange={handleDateChange} />
	</section>

	<section class="games-section mt-lg">
		<div class="section-header">
			<span class="label">GAMES</span>
			<span class="game-count">{games.length} {games.length === 1 ? 'game' : 'games'}</span>
		</div>
		<GamesList {games} {loading} {error} />
	</section>

	<section class="panel mt-lg">
		<div class="panel-header">
			<span class="label">Theme</span>
		</div>
		<div class="panel-body">
			<div class="theme-grid">
				{#each themes as theme (theme.id)}
					<button
						class="theme-btn"
						class:active={currentTheme === theme.id}
						onclick={() => setTheme(theme.id)}
					>
						<span class="theme-name">{theme.name}</span>
						<span class="theme-type label">{theme.type}</span>
					</button>
				{/each}
			</div>
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--space-lg);
	}

	.header {
		margin-bottom: var(--space-lg);
	}

	.day-picker-section {
		display: flex;
		justify-content: center;
	}

	.section-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.game-count {
		font-family: var(--font-stats);
		font-size: 12px;
		color: var(--text-muted);
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--space-sm);
	}

	.theme-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.theme-btn:hover {
		border-color: var(--accent-primary);
	}

	.theme-btn.active {
		border-color: var(--accent-primary);
		background: var(--bg-card-hover);
	}

	.theme-name {
		font-family: var(--font-display);
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.theme-type {
		font-size: 9px;
	}

	@media (max-width: 640px) {
		.container {
			padding: var(--space-md);
		}

		.theme-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
