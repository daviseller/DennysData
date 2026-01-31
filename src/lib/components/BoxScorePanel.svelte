<script lang="ts" module>
	// Module context - shared across all instances
	let sharedCombinedView = $state(false);
</script>

<script lang="ts">
	import { fetchBoxScore, fetchPlayerSeasonStats, fetchLineups } from '$lib/api';
	import { getTeamColors } from '$lib/team-colors';
	import type { BoxScore, Game, PlayerSeasonStats } from '$lib/types';
	import StatsTable from './StatsTable.svelte';
	import SeasonStatsTable from './SeasonStatsTable.svelte';
	import TeamTotals from './TeamTotals.svelte';
	import BoxScoreSkeleton from './BoxScoreSkeleton.svelte';

	interface Props {
		gameId: number;
		game?: Game; // Pass game data to know if it's scheduled
	}

	let { gameId, game: initialGame }: Props = $props();

	let boxScore = $state<BoxScore | null>(null);
	let seasonStats = $state<PlayerSeasonStats[]>([]);
	let starters = $state<Set<number>>(new Set());
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Use module-level state for view preference (persists across instances)
	const combinedView = {
		get value() { return sharedCombinedView; },
		set value(v: boolean) { sharedCombinedView = v; }
	};

	// Track pending request to cancel on new requests
	let abortController: AbortController | null = null;
	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	type GameStatus = 'live' | 'final' | 'scheduled';

	function getGameStatus(game: Game): GameStatus {
		if (game.status === 'Final') return 'final';
		if (game.period > 0 && game.time) return 'live';
		return 'scheduled';
	}

	// Derived values needed for auto-refresh
	const game = $derived(boxScore?.game);
	const status = $derived(game ? getGameStatus(game) : 'scheduled');

	// Determine if we should fetch season stats (for scheduled games)
	const isScheduledGame = $derived(initialGame ? getGameStatus(initialGame) === 'scheduled' : false);

	// Load box score when gameId changes
	$effect(() => {
		if (gameId) {
			if (isScheduledGame && initialGame) {
				loadSeasonStats(initialGame);
			} else {
				loadBoxScore(gameId);
			}
		}
	});

	// Auto-refresh for live games
	$effect(() => {
		// Clear any existing interval
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}

		// If game is live, refresh every 30 seconds
		if (status === 'live' && gameId) {
			refreshInterval = setInterval(() => {
				loadBoxScore(gameId, true); // silent refresh (no loading state)
			}, 30000);
		}

		// Cleanup on unmount
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
		};
	});

	async function loadSeasonStats(g: Game) {
		loading = true;
		error = null;
		seasonStats = [];

		const result = await fetchPlayerSeasonStats([g.visitor_team.id, g.home_team.id]);

		if (result.error) {
			error = result.error.message;
		} else if (result.data) {
			seasonStats = result.data.data;
		}

		loading = false;
	}

	async function loadBoxScore(id: number, silent = false) {
		// Cancel any pending request
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		// Only show loading state on initial load, not during silent refresh
		if (!silent) {
			loading = true;
			error = null;
		}

		// Fetch box score and lineups in parallel
		const [boxScoreResult, lineupsResult] = await Promise.all([
			fetchBoxScore(id, abortController.signal),
			fetchLineups(id, abortController.signal)
		]);

		// If request was aborted, don't update state
		if (!boxScoreResult.data && !boxScoreResult.error) {
			return;
		}

		if (boxScoreResult.error) {
			// Only show error on initial load, ignore errors during silent refresh
			if (!silent) {
				error = boxScoreResult.error.message;
				boxScore = null;
			}
		} else {
			boxScore = boxScoreResult.data;
		}

		// Update starters (don't fail if lineups aren't available yet)
		if (lineupsResult.data?.starters) {
			starters = new Set(lineupsResult.data.starters);
		}

		if (!silent) {
			loading = false;
		}
	}

	function getErrorInfo(error: string): { title: string; description: string } {
		if (error.includes('fetch') || error.includes('network') || error.includes('Failed')) {
			return {
				title: 'CONNECTION ERROR',
				description: 'Unable to load box score. Check your connection.'
			};
		}
		if (error.includes('timeout') || error.includes('Timeout')) {
			return {
				title: 'REQUEST TIMEOUT',
				description: 'Loading took too long. Try again.'
			};
		}
		if (error.includes('500') || error.includes('Server')) {
			return {
				title: 'SERVER ERROR',
				description: 'Something went wrong. Try again in a moment.'
			};
		}
		if (error.includes('404') || error.includes('not found')) {
			return {
				title: 'NOT FOUND',
				description: 'Box score data is not available.'
			};
		}
		return {
			title: 'ERROR',
			description: error
		};
	}

	function getStatusText(g: Game): string {
		const s = getGameStatus(g);
		if (s === 'final') return 'FINAL';
		if (s === 'live') {
			// game.time might already include quarter info, check before adding
			if (g.time.startsWith('Q') || g.time.startsWith('OT')) {
				return g.time;
			}
			const quarter = g.period <= 4 ? `Q${g.period}` : `OT${g.period - 4}`;
			return `${quarter} ${g.time}`;
		}
		return formatGameTime(g.status);
	}

	function formatGameTime(dateTimeString: string): string {
		const date = new Date(dateTimeString);
		if (isNaN(date.getTime())) return dateTimeString;
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	const statusText = $derived(game ? getStatusText(game) : '');
	const gameDate = $derived(game ? (() => {
		// Parse date as local time to avoid timezone shift
		// game.date is "YYYY-MM-DD" - parsing directly treats it as UTC
		const [year, month, day] = game.date.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).toUpperCase();
	})() : '');
	const homeColors = $derived(game ? getTeamColors(game.home_team.abbreviation) : { primary: '#666', secondary: '#333' });
	const visitorColors = $derived(game ? getTeamColors(game.visitor_team.abbreviation) : { primary: '#666', secondary: '#333' });
	const hasStats = $derived(boxScore && (boxScore.home_team.players.length > 0 || boxScore.visitor_team.players.length > 0));
	const errorInfo = $derived(error ? getErrorInfo(error) : null);
	const combinedPlayers = $derived(boxScore ? [...boxScore.visitor_team.players, ...boxScore.home_team.players] : []);
</script>

<div class="box-score-panel">
	{#if loading}
		<BoxScoreSkeleton />
	{:else if error}
		<div class="error-state">
			<span class="error-icon">!</span>
			<span class="error-title">{errorInfo?.title}</span>
			<span class="error-description">{errorInfo?.description}</span>
			<button class="retry-btn" onclick={() => loadBoxScore(gameId)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 4v6h6M23 20v-6h-6"/>
					<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
				</svg>
				RETRY
			</button>
		</div>
	{:else if isScheduledGame && initialGame && seasonStats.length > 0}
		{@const schedGame = initialGame}
		{@const schedVisitorColors = getTeamColors(schedGame.visitor_team.abbreviation)}
		{@const schedHomeColors = getTeamColors(schedGame.home_team.abbreviation)}
		{@const schedGameDate = (() => {
			const [year, month, day] = schedGame.date.split('-').map(Number);
			const date = new Date(year, month - 1, day);
			return date.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric'
			}).toUpperCase();
		})()}
		{@const schedStatusText = formatGameTime(schedGame.status)}

		<div class="game-header">
			<div class="game-matchup">
				<div class="team visitor">
					<span class="team-color" style="background: linear-gradient(135deg, {schedVisitorColors.primary} 49%, {schedVisitorColors.secondary} 51%)"></span>
					<span class="team-abbr">{schedGame.visitor_team.abbreviation}</span>
					<span class="team-score">-</span>
				</div>

				<div class="game-status">
					<span class="game-date">{schedGameDate}</span>
					<span class="status-indicator status-scheduled">
						<span class="status-dot"></span>
						{schedStatusText}
					</span>
				</div>

				<div class="team home">
					<span class="team-score">-</span>
					<span class="team-abbr">{schedGame.home_team.abbreviation}</span>
					<span class="team-color" style="background: linear-gradient(135deg, {schedHomeColors.primary} 49%, {schedHomeColors.secondary} 51%)"></span>
				</div>
			</div>
		</div>

		<div class="preview-label">
			<span class="preview-text">GAME PREVIEW</span>
		</div>

		<section class="stats-section">
			<SeasonStatsTable
				players={seasonStats}
				teamAbbr={schedGame.visitor_team.abbreviation}
				teamId={schedGame.visitor_team.id}
			/>
		</section>

		<section class="stats-section">
			<SeasonStatsTable
				players={seasonStats}
				teamAbbr={schedGame.home_team.abbreviation}
				teamId={schedGame.home_team.id}
			/>
		</section>
	{:else if boxScore && game}
		<div class="game-header">
			<div class="game-matchup">
				<div class="team visitor">
					<span class="team-color" style="background: linear-gradient(135deg, {visitorColors.primary} 49%, {visitorColors.secondary} 51%)"></span>
					<span class="team-abbr">{game.visitor_team.abbreviation}</span>
					<span class="team-score" class:winner={status === 'final' && game.visitor_team_score > game.home_team_score}>
						{status === 'scheduled' ? '-' : game.visitor_team_score}
					</span>
				</div>

				<div class="game-status">
					<span class="game-date">{gameDate}</span>
					<span class="status-indicator status-{status}">
						<span class="status-dot"></span>
						{statusText}
					</span>
				</div>

				<div class="team home">
					<span class="team-score" class:winner={status === 'final' && game.home_team_score > game.visitor_team_score}>
						{status === 'scheduled' ? '-' : game.home_team_score}
					</span>
					<span class="team-abbr">{game.home_team.abbreviation}</span>
					<span class="team-color" style="background: linear-gradient(135deg, {homeColors.primary} 49%, {homeColors.secondary} 51%)"></span>
				</div>
			</div>
		</div>

		{#if hasStats}
			<div class="view-toggle">
				<button
					class="toggle-btn"
					class:active={!combinedView.value}
					onclick={() => combinedView.value = false}
				>
					BY TEAM
				</button>
				<button
					class="toggle-btn"
					class:active={combinedView.value}
					onclick={() => combinedView.value = true}
				>
					COMBINED
				</button>
			</div>

			{#if combinedView.value}
				<section class="stats-section">
					<StatsTable
						players={combinedPlayers}
						showTeamColumn={true}
						{starters}
					/>
				</section>
			{:else}
				<section class="stats-section">
					<StatsTable
						players={boxScore.visitor_team.players}
						totals={boxScore.visitor_team.totals}
						teamColor={visitorColors.primary}
						teamAbbr={game.visitor_team.abbreviation}
						{starters}
					/>
				</section>

				<section class="stats-section">
					<StatsTable
						players={boxScore.home_team.players}
						totals={boxScore.home_team.totals}
						teamColor={homeColors.primary}
						teamAbbr={game.home_team.abbreviation}
						{starters}
					/>
				</section>
			{/if}

			<section class="stats-section">
				<TeamTotals
					homeTeam={boxScore.home_team}
					visitorTeam={boxScore.visitor_team}
					homeColors={homeColors}
					visitorColors={visitorColors}
				/>
			</section>
		{:else}
			<div class="no-stats">
				<span class="no-stats-icon">◇</span>
				<span class="no-stats-text">STATS NOT AVAILABLE</span>
				<span class="no-stats-subtext">Box score will be available once the game starts</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.box-score-panel {
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		max-width: 100%;
	}

	/* View Toggle */
	.view-toggle {
		display: flex;
		gap: 2px;
		margin-bottom: var(--space-md);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		padding: 2px;
	}

	.toggle-btn {
		flex: 1;
		padding: var(--space-xs) var(--space-sm);
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.toggle-btn:hover {
		color: var(--text-primary);
	}

	.toggle-btn.active {
		color: var(--text-primary);
		background: var(--bg-card);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Error State */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-2xl);
		background: var(--bg-card);
		border: 1px solid var(--stat-negative);
		border-radius: var(--radius-sm);
	}

	.error-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		font-family: var(--font-stats);
		font-size: 20px;
		font-weight: 700;
		color: white;
		background: var(--stat-negative);
		border-radius: var(--radius-sm);
	}

	.error-title {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-primary);
		margin-top: var(--space-xs);
	}

	.error-description {
		font-family: var(--font-display);
		font-size: 13px;
		color: var(--text-secondary);
		text-align: center;
	}

	.retry-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		font-family: var(--font-stats);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-primary);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--transition-fast), background var(--transition-fast);
	}

	.retry-btn:hover {
		border-color: var(--accent-primary);
		background: var(--bg-card-hover);
	}

	/* Game Header */
	.game-header {
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		padding: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.game-matchup {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.team {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.team-color {
		width: 16px;
		height: 16px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.team-abbr {
		font-family: var(--font-stats);
		font-size: 16px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-primary);
	}

	.team-score {
		font-family: var(--font-stats);
		font-size: 24px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
	}

	.team-score.winner {
		color: var(--text-primary);
	}

	.game-status {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.game-date {
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
	}

	.status-indicator {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}

	.status-live {
		color: var(--status-live);
	}

	.status-live .status-dot {
		animation: pulse 1.5s ease-in-out infinite;
		box-shadow: 0 0 4px var(--status-live-glow);
	}

	.status-final {
		color: var(--status-final);
	}

	.status-scheduled {
		color: var(--status-scheduled);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	/* Preview Label */
	.preview-label {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-md);
	}

	.preview-text {
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		padding: var(--space-xs) var(--space-md);
		background: var(--bg-inset);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius-sm);
	}

	/* Sections */
	.stats-section {
		margin-bottom: var(--space-md);
	}

	/* No Stats State */
	.no-stats {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-2xl);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.no-stats-icon {
		font-size: 32px;
		color: var(--text-muted);
	}

	.no-stats-text {
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
	}

	.no-stats-subtext {
		font-family: var(--font-display);
		font-size: 13px;
		color: var(--text-muted);
	}
</style>
