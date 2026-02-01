<script lang="ts">
	import { goto } from '$app/navigation';
	import AppNav from '$lib/components/AppNav.svelte';
	import PlayerSlidePanel from '$lib/components/PlayerSlidePanel.svelte';

	// Theme management (shared pattern from box scores)
	function getStoredTheme(): string {
		if (typeof document === 'undefined') return 'arena';
		const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
		return match ? match[1] : 'arena';
	}

	function storeTheme(themeId: string) {
		const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
		document.cookie = `theme=${themeId}; expires=${expires}; path=/; SameSite=Lax`;
	}

	let currentTheme = $state(getStoredTheme());
	let themeDropdownOpen = $state(false);
	let selectedPlayerId = $state<number | null>(null);
	let isMobile = $state(false);

	// Season state - 2025 represents 2025-26 season (current)
	let selectedSeason = $state(2025);

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

	function handlePlayerClick(playerId: number) {
		if (isMobile) {
			goto(`/player/${playerId}`);
		} else {
			selectedPlayerId = playerId;
		}
	}

	function handleClosePlayerPanel() {
		selectedPlayerId = null;
	}

	function handleGameNavigate(gameId: number, dateStr: string) {
		selectedPlayerId = null;
		goto(`/?date=${dateStr}&game=${gameId}`);
	}

	function updateIsMobile() {
		isMobile = window.innerWidth <= 900;
	}

	// Apply theme on mount
	$effect(() => {
		document.documentElement.setAttribute('data-theme', currentTheme);
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			updateIsMobile();
			window.addEventListener('resize', updateIsMobile);
			return () => window.removeEventListener('resize', updateIsMobile);
		}
	});

	$effect(() => {
		if (themeDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	const currentThemeInfo = $derived(themes.find(t => t.id === currentTheme));
	const showPlayerPanel = $derived(selectedPlayerId !== null);
</script>

<svelte:head>
	<title>NBA Player Stats - {selectedSeason}-{selectedSeason + 1} | DennysData</title>
</svelte:head>

<div class="page-wrapper">
	<header class="header">
		<span class="header-title">DennysData</span>
		<span class="header-divider">·</span>
		<span class="header-subtitle">NBA</span>
		<span class="header-divider">·</span>
		<AppNav />
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

	<section class="season-picker-section">
		<div class="season-picker">
			<span class="season-label">SEASON</span>
			<span class="season-value">{selectedSeason}-{String(selectedSeason + 1).slice(-2)}</span>
		</div>
	</section>

	<div class="content-area" class:has-panel={showPlayerPanel}>
		<section class="players-section">
			<div class="section-header">
				<span class="label">PLAYERS</span>
				<span class="player-count">Loading...</span>
			</div>
			<div class="placeholder-content">
				<p>Player stats table will go here</p>
				<p class="placeholder-hint">Phase 2: Stats table with search and sort</p>
			</div>
		</section>

		{#if showPlayerPanel && !isMobile}
			<aside class="player-sidebar">
				<div class="sidebar-header">
					<span class="label">PLAYER</span>
					<button class="close-btn" onclick={handleClosePlayerPanel} aria-label="Close player panel">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				</div>
				<div class="sidebar-content">
					<!-- PlayerPanel will be shown in slide panel -->
				</div>
			</aside>
		{/if}
	</div>
</div>

<PlayerSlidePanel playerId={selectedPlayerId} onClose={handleClosePlayerPanel} onGameClick={handleGameNavigate} />

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
		grid-template-columns: minmax(300px, 1fr) minmax(300px, 400px);
		gap: var(--space-lg);
		max-width: 1400px;
	}

	.players-section {
		min-width: 0;
		min-height: 0;
	}

	.content-area.has-panel .players-section {
		overflow-y: auto;
		padding-right: var(--space-xs);
	}

	.player-sidebar {
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

	.season-picker-section {
		display: flex;
		justify-content: center;
	}

	.season-picker {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.season-label {
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.season-value {
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-primary);
	}

	.section-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.label {
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.player-count {
		font-family: var(--font-stats);
		font-size: 12px;
		color: var(--text-muted);
	}

	.placeholder-content {
		padding: var(--space-xl);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		text-align: center;
	}

	.placeholder-content p {
		margin: 0;
		font-family: var(--font-display);
		font-size: 14px;
		color: var(--text-secondary);
	}

	.placeholder-hint {
		margin-top: var(--space-sm) !important;
		font-size: 12px !important;
		color: var(--text-muted) !important;
	}

	@media (max-width: 900px) {
		.content-area.has-panel {
			display: block;
		}

		.player-sidebar {
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
		margin-bottom: var(--space-sm);
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
