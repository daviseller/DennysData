<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchGames, fetchStandings, formatDateForApi } from '$lib/api';
	import type { Game, StandingsMap } from '$lib/types';
	import DayPicker from '$lib/components/DayPicker.svelte';
	import GamesList from '$lib/components/GamesList.svelte';
	import BoxScorePanel from '$lib/components/BoxScorePanel.svelte';

	function getStoredTheme(): string {
		if (typeof document === 'undefined') return 'arena';
		const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
		return match ? match[1] : 'arena';
	}

	function storeTheme(themeId: string) {
		// Store for 1 year
		const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
		document.cookie = `theme=${themeId}; expires=${expires}; path=/; SameSite=Lax`;
	}

	let currentTheme = $state(getStoredTheme());
	let selectedDate = $state(new Date());
	let games = $state<Game[]>([]);
	let standings = $state<StandingsMap>({});
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedGame = $state<Game | null>(null);
	let themeDropdownOpen = $state(false);
	let initialDateResolved = $state(false);
	let isMobile = $state(false);

	// Track pending request to cancel on new requests
	let gamesAbortController: AbortController | null = null;
	let gamesRefreshInterval: ReturnType<typeof setInterval> | null = null;
	let standingsRefreshInterval: ReturnType<typeof setInterval> | null = null;

	// For testing: ?testTime=2026-01-31T08:00:00 to simulate different times
	function getTestTime(): Date {
		if (typeof window === 'undefined') return new Date();
		const params = new URLSearchParams(window.location.search);
		const testTime = params.get('testTime');
		if (testTime) {
			const parsed = new Date(testTime);
			if (!isNaN(parsed.getTime())) return parsed;
		}
		return new Date();
	}

	const themes = [
		{ id: 'arena', name: 'Arena', type: 'light' },
		{ id: 'courtside', name: 'Courtside', type: 'light' },
		{ id: 'pressbox', name: 'Pressbox', type: 'light' },
		{ id: 'practice', name: 'Practice', type: 'light' },
		{ id: 'chalk', name: 'Chalk', type: 'light' },
		{ id: 'hardwood', name: 'Hardwood', type: 'dark' },
		{ id: 'broadcast', name: 'Broadcast', type: 'dark' },
		{ id: 'tunnel', name: 'Tunnel', type: 'dark' },
		{ id: 'jumbotron', name: 'Jumbotron', type: 'dark' },
		{ id: 'blackout', name: 'Blackout', type: 'dark' }
	];

	function setTheme(themeId: string) {
		currentTheme = themeId;
		document.documentElement.setAttribute('data-theme', themeId);
		storeTheme(themeId);
		themeDropdownOpen = false;
	}

	function toggleThemeDropdown() {
		themeDropdownOpen = !themeDropdownOpen;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.theme-dropdown')) {
			themeDropdownOpen = false;
		}
	}

	async function loadGames(date: Date, silent = false) {
		// Cancel any pending request
		if (gamesAbortController) {
			gamesAbortController.abort();
		}
		gamesAbortController = new AbortController();

		// Only show loading on initial load, not during silent refresh
		if (!silent) {
			loading = true;
			error = null;
		}

		const dateStr = formatDateForApi(date);
		const result = await fetchGames(dateStr, gamesAbortController.signal);

		// If request was aborted, don't update state
		if (!result.data && !result.error) {
			return;
		}

		if (result.error) {
			// Only show error on initial load
			if (!silent) {
				error = result.error.message;
				games = [];
			}
		} else {
			const rawGames = result.data?.data ?? [];
			games = sortGames(rawGames);
		}

		if (!silent) {
			loading = false;
		}
	}

	// Check if any games are currently live
	function hasLiveGames(): boolean {
		return games.some(game => game.period > 0 && game.time && game.status !== 'Final');
	}

	async function loadStandings() {
		const result = await fetchStandings();
		if (result.data) {
			standings = result.data;
		}
	}

	function handleDateChange(date: Date) {
		selectedDate = date;
		loadGames(date);
	}

	function handleSelectGame(game: Game) {
		// Toggle off if clicking the already selected game
		if (selectedGame?.id === game.id) {
			selectedGame = null;
		} else {
			selectedGame = game;
		}
	}

	function handleCloseBoxScore() {
		selectedGame = null;
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		// Escape closes box score panel
		if (e.key === 'Escape' && selectedGame !== null) {
			e.preventDefault();
			handleCloseBoxScore();
		}
		// Escape also closes theme dropdown
		if (e.key === 'Escape' && themeDropdownOpen) {
			e.preventDefault();
			themeDropdownOpen = false;
		}
	}

	// Apply theme on mount and when changed
	$effect(() => {
		document.documentElement.setAttribute('data-theme', currentTheme);
	});

	// Smart date initialization - find the day with live or upcoming games
	// Works across timezones by checking both today and yesterday
	async function initializeDate() {
		const now = getTestTime();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);

		loading = true;

		// Fetch both days in parallel
		const [todayResult, yesterdayResult] = await Promise.all([
			fetchGames(formatDateForApi(today)),
			fetchGames(formatDateForApi(yesterday))
		]);

		const todayGames = todayResult.data?.data ?? [];
		const yesterdayGames = yesterdayResult.data?.data ?? [];

		// Priority 1: Show day with live games
		if (hasLiveGamesInList(todayGames)) {
			selectedDate = today;
			games = sortGames(todayGames);
			loading = false;
			initialDateResolved = true;
			return;
		}

		if (hasLiveGamesInList(yesterdayGames)) {
			selectedDate = yesterday;
			games = sortGames(yesterdayGames);
			loading = false;
			initialDateResolved = true;
			return;
		}

		// Priority 2: Show day with games starting within 4 hours
		if (hasUpcomingGames(todayGames, now)) {
			selectedDate = today;
			games = sortGames(todayGames);
			loading = false;
			initialDateResolved = true;
			return;
		}

		// Priority 3: Show yesterday (most recent completed games)
		if (yesterdayGames.length > 0) {
			selectedDate = yesterday;
			games = sortGames(yesterdayGames);
			loading = false;
			initialDateResolved = true;
			return;
		}

		// Fallback: Show today
		selectedDate = today;
		games = sortGames(todayGames);
		loading = false;
		initialDateResolved = true;
	}

	function hasLiveGamesInList(gamesList: Game[]): boolean {
		return gamesList.some(g => g.period > 0 && g.status !== 'Final');
	}

	function hasUpcomingGames(gamesList: Game[], now: Date): boolean {
		const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
		return gamesList.some(g => {
			if (g.status === 'Final') return false;
			const gameTime = new Date(g.datetime);
			return !isNaN(gameTime.getTime()) && gameTime <= fourHoursFromNow && gameTime > now;
		});
	}

	function sortGames(rawGames: Game[]): Game[] {
		return rawGames.sort((a, b) => {
			const aIsLive = a.period > 0 && a.time && a.status !== 'Final';
			const bIsLive = b.period > 0 && b.time && b.status !== 'Final';
			const aIsFinal = a.status === 'Final';
			const bIsFinal = b.status === 'Final';

			// Live games first
			if (aIsLive && !bIsLive) return -1;
			if (!aIsLive && bIsLive) return 1;

			// Finished games last
			if (aIsFinal && !bIsFinal) return 1;
			if (!aIsFinal && bIsFinal) return -1;

			// Within live games, sort by period desc, then time remaining asc
			if (aIsLive && bIsLive) {
				if (a.period !== b.period) {
					return b.period - a.period;
				}
				const parseTime = (t: string) => {
					const match = t.match(/(\d+):(\d+)/);
					if (!match) return 999;
					return parseInt(match[1]) * 60 + parseInt(match[2]);
				};
				return parseTime(a.time) - parseTime(b.time);
			}

			// Within scheduled/finished games, sort by start time or ID
			const timeA = new Date(a.status).getTime();
			const timeB = new Date(b.status).getTime();
			if (!isNaN(timeA) && !isNaN(timeB)) {
				return timeA - timeB;
			}
			return a.id - b.id;
		});
	}

	// Track screen size for responsive behavior
	function updateIsMobile() {
		isMobile = window.innerWidth <= 900;
	}

	// Initialize on mount
	onMount(() => {
		initializeDate();
		loadStandings();
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);
		return () => window.removeEventListener('resize', updateIsMobile);
	});

	// Auto-refresh games list when there are live games
	$effect(() => {
		// Clear any existing interval
		if (gamesRefreshInterval) {
			clearInterval(gamesRefreshInterval);
			gamesRefreshInterval = null;
		}

		// If there are live games, refresh every 30 seconds
		if (hasLiveGames()) {
			gamesRefreshInterval = setInterval(() => {
				loadGames(selectedDate, true); // silent refresh
			}, 30000);
		}

		// Cleanup on unmount
		return () => {
			if (gamesRefreshInterval) {
				clearInterval(gamesRefreshInterval);
				gamesRefreshInterval = null;
			}
		};
	});

	// Auto-refresh standings when there are live games (every 2 minutes)
	$effect(() => {
		if (standingsRefreshInterval) {
			clearInterval(standingsRefreshInterval);
			standingsRefreshInterval = null;
		}

		if (hasLiveGames()) {
			standingsRefreshInterval = setInterval(() => {
				loadStandings();
			}, 120000); // 2 minutes
		}

		return () => {
			if (standingsRefreshInterval) {
				clearInterval(standingsRefreshInterval);
				standingsRefreshInterval = null;
			}
		};
	});

	// Close dropdown on click outside
	$effect(() => {
		if (themeDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	// Global keyboard shortcuts
	$effect(() => {
		document.addEventListener('keydown', handleGlobalKeydown);
		return () => document.removeEventListener('keydown', handleGlobalKeydown);
	});

	const showBoxScore = $derived(selectedGame !== null);
	const currentThemeInfo = $derived(themes.find(t => t.id === currentTheme));
	const selectedGameId = $derived(selectedGame?.id ?? null);
</script>

<div class="page-wrapper">
	<header class="header">
		<span class="header-title">DennysData</span>
		<span class="header-divider">·</span>
		<span class="header-subtitle">NBA</span>
		<span class="header-divider">·</span>
		<span class="header-subtitle">Box Scores</span>
		<div class="header-spacer"></div>
		<div class="theme-dropdown">
			<button class="theme-trigger" onclick={toggleThemeDropdown}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="5"/>
					<line x1="12" y1="1" x2="12" y2="3"/>
					<line x1="12" y1="21" x2="12" y2="23"/>
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
					<line x1="1" y1="12" x2="3" y2="12"/>
					<line x1="21" y1="12" x2="23" y2="12"/>
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
				</svg>
				<span class="theme-current">{currentThemeInfo?.name}</span>
				<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 9l6 6 6-6"/>
				</svg>
			</button>
			{#if themeDropdownOpen}
				<div class="theme-menu">
					<div class="theme-group">
						<span class="theme-group-label">LIGHT</span>
						{#each themes.filter(t => t.type === 'light') as theme (theme.id)}
							<button
								class="theme-option"
								class:active={currentTheme === theme.id}
								onclick={() => setTheme(theme.id)}
							>
								{theme.name}
							</button>
						{/each}
					</div>
					<div class="theme-group">
						<span class="theme-group-label">DARK</span>
						{#each themes.filter(t => t.type === 'dark') as theme (theme.id)}
							<button
								class="theme-option"
								class:active={currentTheme === theme.id}
								onclick={() => setTheme(theme.id)}
							>
								{theme.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</header>

	<section class="day-picker-section">
		<DayPicker {selectedDate} onDateChange={handleDateChange} />
	</section>

	<div class="content-area" class:has-panel={showBoxScore}>
		<section class="games-section">
			<div class="section-header">
				<span class="label">GAMES</span>
				<span class="game-count">{games.length} {games.length === 1 ? 'game' : 'games'}</span>
			</div>
			<GamesList
				{games}
				{standings}
				{loading}
				{error}
				{selectedGameId}
				showInlineBoxScore={isMobile}
				onSelectGame={handleSelectGame}
				onRetry={() => loadGames(selectedDate)}
			/>
		</section>

		{#if showBoxScore && !isMobile}
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
					<BoxScorePanel gameId={selectedGameId} game={selectedGame} />
				</div>
			</aside>
		{/if}
	</div>
</div>

<style>
	.page-wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
		padding: var(--space-lg);
		overflow: hidden;
	}

	.content-area {
		flex: 1;
		min-height: 0;
		max-width: 960px;
		width: 100%;
		margin: 0 auto;
		margin-top: var(--space-lg);
		overflow-y: auto;
	}

	.content-area.has-panel {
		display: grid;
		grid-template-columns: minmax(300px, 400px) minmax(400px, 1fr);
		gap: var(--space-lg);
		max-width: 1400px;
	}

	.games-section {
		min-width: 0;
		min-height: 0;
	}

	.content-area.has-panel .games-section {
		overflow-y: auto;
		padding-right: var(--space-xs);
	}

	.box-score-sidebar {
		display: flex;
		flex-direction: column;
		min-height: 0;
		background: var(--bg-app);
		overflow-y: auto;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
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
		margin-left: auto;
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

	@media (max-width: 900px) {
		.content-area.has-panel {
			display: block;
		}

		/* Hide sidebar on mobile - inline accordion is shown in GamesList instead */
		.box-score-sidebar {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.page-wrapper {
			padding: var(--space-md);
		}
	}

	.header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding-bottom: var(--space-lg);
		margin-bottom: var(--space-md);
	}

	.header-title {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-primary);
	}

	.header-subtitle {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 400;
		letter-spacing: 0.02em;
		color: var(--text-secondary);
	}

	.header-divider {
		color: var(--text-secondary);
		opacity: 0.5;
	}

	.header-spacer {
		flex: 1;
	}

	/* Theme Dropdown */
	.theme-dropdown {
		position: relative;
	}

	.theme-trigger {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--text-secondary);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
	}

	.theme-trigger:hover {
		color: var(--text-primary);
		border-color: var(--accent-primary);
		background: var(--bg-card-hover);
	}

	.theme-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: var(--space-xs);
		padding: var(--space-sm);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		z-index: 100;
		min-width: 120px;
	}

	.theme-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.theme-group:not(:last-child) {
		margin-bottom: var(--space-sm);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border-secondary);
	}

	.theme-group-label {
		font-family: var(--font-stats);
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		padding: 2px var(--space-sm);
		margin-bottom: 2px;
	}

	.theme-option {
		display: block;
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		font-family: var(--font-display);
		font-size: 12px;
		font-weight: 400;
		color: var(--text-primary);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-align: left;
		transition: background var(--transition-fast);
	}

	.theme-option:hover {
		background: var(--bg-inset);
	}

	.theme-option.active {
		background: var(--bg-inset);
		font-weight: 500;
	}
</style>
