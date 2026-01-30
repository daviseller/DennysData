<script lang="ts">
	import { fetchBoxScore } from '$lib/api';
	import { getTeamColors } from '$lib/team-colors';
	import type { BoxScore, Game } from '$lib/types';
	import StatsTable from './StatsTable.svelte';
	import TeamTotals from './TeamTotals.svelte';

	interface Props {
		gameId: number;
	}

	let { gameId }: Props = $props();

	let boxScore = $state<BoxScore | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Track pending request to cancel on new requests
	let abortController: AbortController | null = null;

	$effect(() => {
		if (gameId) {
			loadBoxScore(gameId);
		}
	});

	async function loadBoxScore(id: number) {
		// Cancel any pending request
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		loading = true;
		error = null;

		const result = await fetchBoxScore(id, abortController.signal);

		// If request was aborted, don't update state
		if (!result.data && !result.error) {
			return;
		}

		if (result.error) {
			error = result.error.message;
			boxScore = null;
		} else {
			boxScore = result.data;
		}

		loading = false;
	}

	type GameStatus = 'live' | 'final' | 'scheduled';

	function getGameStatus(game: Game): GameStatus {
		if (game.status === 'Final') return 'final';
		if (game.period > 0 && game.time) return 'live';
		return 'scheduled';
	}

	function getStatusText(game: Game): string {
		const status = getGameStatus(game);
		if (status === 'final') return 'FINAL';
		if (status === 'live') {
			const quarter = game.period <= 4 ? `Q${game.period}` : `OT${game.period - 4}`;
			return `${quarter} ${game.time}`;
		}
		return formatGameTime(game.status);
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

	const game = $derived(boxScore?.game);
	const status = $derived(game ? getGameStatus(game) : 'scheduled');
	const statusText = $derived(game ? getStatusText(game) : '');
	const homeColors = $derived(game ? getTeamColors(game.home_team.abbreviation) : { primary: '#666', secondary: '#333' });
	const visitorColors = $derived(game ? getTeamColors(game.visitor_team.abbreviation) : { primary: '#666', secondary: '#333' });
	const hasStats = $derived(boxScore && (boxScore.home_team.players.length > 0 || boxScore.visitor_team.players.length > 0));
</script>

<div class="box-score-panel">
	{#if loading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<span class="loading-text">LOADING BOX SCORE</span>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="error-icon">!</span>
			<span class="error-text">{error}</span>
			<button class="retry-btn" onclick={() => loadBoxScore(gameId)}>
				RETRY
			</button>
		</div>
	{:else if boxScore && game}
		<div class="game-header">
			<div class="game-matchup">
				<div class="team visitor">
					<span class="team-color" style="background: {visitorColors.primary}"></span>
					<span class="team-abbr">{game.visitor_team.abbreviation}</span>
					<span class="team-score" class:winner={status === 'final' && game.visitor_team_score > game.home_team_score}>
						{status === 'scheduled' ? '-' : game.visitor_team_score}
					</span>
				</div>

				<div class="game-status">
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
					<span class="team-color" style="background: {homeColors.primary}"></span>
				</div>
			</div>
		</div>

		{#if hasStats}
			<section class="stats-section">
				<TeamTotals
					homeTeam={boxScore.home_team}
					visitorTeam={boxScore.visitor_team}
					homeColor={homeColors.primary}
					visitorColor={visitorColors.primary}
				/>
			</section>

			<section class="stats-section">
				<StatsTable
					players={boxScore.visitor_team.players}
					totals={boxScore.visitor_team.totals}
					teamColor={visitorColors.primary}
					teamAbbr={game.visitor_team.abbreviation}
				/>
			</section>

			<section class="stats-section">
				<StatsTable
					players={boxScore.home_team.players}
					totals={boxScore.home_team.totals}
					teamColor={homeColors.primary}
					teamAbbr={game.home_team.abbreviation}
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

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-2xl);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-secondary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-text {
		font-family: var(--font-stats);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
	}

	/* Error State */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-2xl);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.error-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--stat-negative);
		color: white;
		font-family: var(--font-stats);
		font-size: 18px;
		font-weight: 700;
		border-radius: var(--radius-sm);
	}

	.error-text {
		font-family: var(--font-display);
		font-size: 14px;
		color: var(--text-primary);
		text-align: center;
	}

	.retry-btn {
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
		transition: background var(--transition-fast);
	}

	.retry-btn:hover {
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
		width: 4px;
		height: 32px;
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
