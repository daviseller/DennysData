<script lang="ts">
	import type { Game } from '$lib/types';
	import { getTeamColors } from '$lib/team-colors';

	interface Props {
		game: Game;
		selected?: boolean;
		onSelect?: (game: Game) => void;
	}

	let { game, selected = false, onSelect }: Props = $props();

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
			// game.time might already include quarter info, check before adding
			if (game.time.startsWith('Q') || game.time.startsWith('OT')) {
				return game.time;
			}
			const quarter = game.period <= 4 ? `Q${game.period}` : `OT${game.period - 4}`;
			return `${quarter} ${game.time}`;
		}
		// Scheduled - status field contains the datetime for scheduled games
		return formatGameTime(game.status);
	}

	function formatGameTime(dateTimeString: string): string {
		const date = new Date(dateTimeString);
		// Check if it's a valid date (status might be "Final" or other text)
		if (isNaN(date.getTime())) return dateTimeString;
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function getWinner(game: Game): 'home' | 'visitor' | null {
		if (game.status !== 'Final') return null;
		if (game.home_team_score > game.visitor_team_score) return 'home';
		if (game.visitor_team_score > game.home_team_score) return 'visitor';
		return null;
	}

	function handleClick(e: MouseEvent) {
		if (onSelect) {
			e.preventDefault();
			onSelect(game);
		}
	}

	const status = $derived(getGameStatus(game));
	const statusText = $derived(getStatusText(game));
	const winner = $derived(getWinner(game));
	const homeColors = $derived(getTeamColors(game.home_team.abbreviation));
	const visitorColors = $derived(getTeamColors(game.visitor_team.abbreviation));
</script>

<a href="/game/{game.id}" class="game-card" class:selected onclick={handleClick}>
	<div class="game-status">
		<span class="status-indicator status-{status}">
			<span class="status-dot"></span>
			{statusText}
		</span>
	</div>

	<div class="game-teams" class:has-result={status === 'final'}>
		<div class="team-row" class:winner={winner === 'visitor'}>
			<span class="team-color" class:muted={status === 'final' && winner === 'home'} style="background: linear-gradient(135deg, {visitorColors.primary} 49%, {visitorColors.secondary} 51%)"></span>
			<span class="team-abbr">{game.visitor_team.abbreviation}</span>
			<span class="score" class:stat-leader={winner === 'visitor'}>
				{status === 'scheduled' ? '-' : game.visitor_team_score}
			</span>
		</div>
		<div class="team-row" class:winner={winner === 'home'}>
			<span class="team-color" class:muted={status === 'final' && winner === 'visitor'} style="background: linear-gradient(135deg, {homeColors.primary} 49%, {homeColors.secondary} 51%)"></span>
			<span class="team-abbr">{game.home_team.abbreviation}</span>
			<span class="score" class:stat-leader={winner === 'home'}>
				{status === 'scheduled' ? '-' : game.home_team_score}
			</span>
		</div>
	</div>
</a>

<style>
	.game-card {
		display: block;
		padding: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		text-decoration: none;
		color: inherit;
		transition: border-color var(--transition-fast), background var(--transition-fast);
		cursor: pointer;
	}

	.game-card:hover {
		border-color: var(--accent-primary);
		background: var(--bg-card-hover);
	}

	.game-card.selected {
		border-color: var(--accent-primary);
		background: var(--bg-card-hover);
		box-shadow: inset 3px 0 0 var(--accent-primary);
	}

	.game-status {
		margin-bottom: var(--space-sm);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border-secondary);
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

	.game-teams {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.team-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.team-color {
		width: 14px;
		height: 14px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.team-color.muted {
		opacity: 0.4;
	}

	.team-abbr {
		flex: 1;
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-primary);
	}

	.winner .team-abbr {
		color: var(--text-primary);
	}

	/* Only mute losing team when game has a result */
	.has-result .team-row:not(.winner) .team-abbr {
		color: var(--text-muted);
	}

	.score {
		font-family: var(--font-stats);
		font-size: 18px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		min-width: 32px;
		text-align: right;
	}

	/* Only mute losing score when game has a result */
	.has-result .score:not(.stat-leader) {
		color: var(--text-muted);
	}

	.score.stat-leader {
		color: var(--text-primary);
	}
</style>
