<script lang="ts">
	import type { Game } from '$lib/types';
	import GameCard from './GameCard.svelte';
	import BoxScorePanel from './BoxScorePanel.svelte';

	interface Props {
		games: Game[];
		loading: boolean;
		error: string | null;
		selectedGameId?: number | null;
		onSelectGame?: (game: Game) => void;
	}

	let { games, loading, error, selectedGameId = null, onSelectGame }: Props = $props();

	function handleGameSelect(game: Game) {
		if (onSelectGame) {
			// Toggle off if clicking the same game
			if (selectedGameId === game.id) {
				// We need a way to deselect - pass null somehow
				// For now, just call with the same game and let parent handle it
			}
			onSelectGame(game);
		}
	}
</script>

{#if loading}
	<div class="loading-state">
		<div class="loading-spinner"></div>
		<span class="loading-text">LOADING GAMES</span>
	</div>
{:else if error}
	<div class="error-state">
		<span class="error-icon">!</span>
		<span class="error-text">{error}</span>
	</div>
{:else if games.length === 0}
	<div class="empty-state">
		<span class="empty-icon">○</span>
		<span class="empty-text">NO GAMES SCHEDULED</span>
	</div>
{:else}
	<div class="games-list">
		{#each games as game (game.id)}
			<div class="game-item">
				<GameCard
					{game}
					selected={selectedGameId === game.id}
					onSelect={handleGameSelect}
				/>
				{#if selectedGameId === game.id}
					<div class="inline-boxscore">
						<BoxScorePanel gameId={game.id} />
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.games-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--space-md);
	}

	.game-item {
		display: contents;
	}

	/* Mobile: show inline box score as accordion */
	.inline-boxscore {
		display: none;
	}

	@media (max-width: 900px) {
		.games-list {
			display: flex;
			flex-direction: column;
			gap: var(--space-md);
			overflow-x: hidden;
		}

		.game-item {
			display: flex;
			flex-direction: column;
			gap: var(--space-md);
		}

		.inline-boxscore {
			display: block;
			padding: var(--space-sm);
			background: var(--bg-inset);
			border: 1px solid var(--border-primary);
			border-radius: var(--radius-sm);
			margin-top: calc(-1 * var(--space-sm));
			overflow-x: hidden;
			max-width: 100%;
		}
	}

	.loading-state,
	.error-state,
	.empty-state {
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
		border: 2px solid var(--border-primary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-text,
	.empty-text {
		font-family: var(--font-stats);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.error-state {
		border-color: var(--status-live);
	}

	.error-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		font-family: var(--font-stats);
		font-size: 18px;
		font-weight: 700;
		color: var(--status-live);
		border: 2px solid var(--status-live);
		border-radius: 50%;
	}

	.error-text {
		font-family: var(--font-display);
		font-size: 13px;
		color: var(--text-secondary);
		text-align: center;
	}

	.empty-icon {
		font-size: 32px;
		color: var(--text-muted);
	}
</style>
