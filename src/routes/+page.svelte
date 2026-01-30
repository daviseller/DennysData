<script lang="ts">
	import { fetchGames, formatDateForApi } from '$lib/api';
	import type { Game } from '$lib/types';
	import DayPicker from '$lib/components/DayPicker.svelte';
	import GamesList from '$lib/components/GamesList.svelte';
	import BoxScorePanel from '$lib/components/BoxScorePanel.svelte';

	let currentTheme = $state('arena');
	let selectedDate = $state(new Date());
	let games = $state<Game[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedGameId = $state<number | null>(null);

	// Track pending request to cancel on new requests
	let gamesAbortController: AbortController | null = null;

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
		// Cancel any pending request
		if (gamesAbortController) {
			gamesAbortController.abort();
		}
		gamesAbortController = new AbortController();

		loading = true;
		error = null;
		selectedGameId = null;

		const dateStr = formatDateForApi(date);
		const result = await fetchGames(dateStr, gamesAbortController.signal);

		// If request was aborted, don't update state
		if (!result.data && !result.error) {
			return;
		}

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

	function handleSelectGame(game: Game) {
		selectedGameId = game.id;
	}

	function handleCloseBoxScore() {
		selectedGameId = null;
	}

	// Apply theme on mount and when changed
	$effect(() => {
		document.documentElement.setAttribute('data-theme', currentTheme);
	});

	// Load games on mount
	$effect(() => {
		loadGames(selectedDate);
	});

	const showBoxScore = $derived(selectedGameId !== null);
</script>

<div class="container" class:has-panel={showBoxScore}>
	<main class="main-content">
		<section class="day-picker-section">
			<DayPicker {selectedDate} onDateChange={handleDateChange} />
		</section>

		<section class="games-section mt-lg">
			<div class="section-header">
				<span class="label">GAMES</span>
				<span class="game-count">{games.length} {games.length === 1 ? 'game' : 'games'}</span>
			</div>
			<GamesList
				{games}
				{loading}
				{error}
				{selectedGameId}
				onSelectGame={handleSelectGame}
			/>
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

		<footer class="footer">
			<span class="footer-text">DennysData</span>
			<span class="footer-divider">·</span>
			<span class="footer-text">NBA Box Scores</span>
		</footer>
	</main>

	{#if showBoxScore}
		<aside class="box-score-sidebar">
			<div class="sidebar-header">
				<span class="label">BOX SCORE</span>
				<button class="close-btn" onclick={handleCloseBoxScore} aria-label="Close box score">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
			<div class="sidebar-content">
				<BoxScorePanel gameId={selectedGameId} />
			</div>
		</aside>
	{/if}
</div>

<style>
	.container {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--space-lg);
		transition: max-width var(--transition-base);
		overflow-x: hidden;
	}

	.container.has-panel {
		display: grid;
		grid-template-columns: minmax(300px, 400px) minmax(400px, 1fr);
		gap: var(--space-lg);
		max-width: 1400px;
	}

	.box-score-sidebar {
		position: sticky;
		top: var(--space-lg);
		max-height: calc(100vh - var(--space-lg) * 2);
		display: flex;
		flex-direction: column;
		background: var(--bg-app);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: var(--space-sm);
		margin-bottom: var(--space-md);
		border-bottom: 1px solid var(--border-secondary);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		border-color: var(--accent-primary);
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding-right: var(--space-xs);
	}

	.main-content {
		min-width: 0;
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

	@media (max-width: 900px) {
		.container.has-panel {
			display: block;
		}

		/* Hide sidebar on mobile - inline accordion is shown in GamesList instead */
		.box-score-sidebar {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.container {
			padding: var(--space-md);
		}

		.theme-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-xl) 0 var(--space-md);
	}

	.footer-text {
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.02em;
		color: var(--text-muted);
	}

	.footer-divider {
		color: var(--text-muted);
		opacity: 0.5;
	}
</style>
