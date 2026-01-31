<script lang="ts">
	import type { Game } from '$lib/types';
	import GameCard from './GameCard.svelte';
	import GameCardSkeleton from './GameCardSkeleton.svelte';
	import BoxScorePanel from './BoxScorePanel.svelte';

	interface Props {
		games: Game[];
		loading: boolean;
		error: string | null;
		selectedGameId?: number | null;
		onSelectGame?: (game: Game) => void;
		onRetry?: () => void;
	}

	let { games, loading, error, selectedGameId = null, onSelectGame, onRetry }: Props = $props();

	function handleGameSelect(game: Game) {
		if (onSelectGame) {
			onSelectGame(game);

			// On mobile, scroll to show the selected game at top after box score renders
			if (window.innerWidth <= 900) {
				// Small delay to let the box score render
				setTimeout(() => {
					const element = document.querySelector(`[data-game-id="${game.id}"]`);
					if (element) {
						element.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}
				}, 50);
			}
		}
	}

	function getErrorMessage(error: string): { title: string; description: string } {
		if (error.includes('fetch') || error.includes('network') || error.includes('Failed')) {
			return {
				title: 'CONNECTION ERROR',
				description: 'Unable to reach the server. Check your internet connection.'
			};
		}
		if (error.includes('timeout') || error.includes('Timeout')) {
			return {
				title: 'REQUEST TIMEOUT',
				description: 'The server took too long to respond. Try again.'
			};
		}
		if (error.includes('500') || error.includes('Server')) {
			return {
				title: 'SERVER ERROR',
				description: 'Something went wrong on our end. Try again in a moment.'
			};
		}
		if (error.includes('404') || error.includes('not found')) {
			return {
				title: 'NOT FOUND',
				description: 'The requested data could not be found.'
			};
		}
		if (error.includes('429') || error.includes('rate')) {
			return {
				title: 'RATE LIMITED',
				description: 'Too many requests. Please wait a moment and try again.'
			};
		}
		return {
			title: 'ERROR',
			description: error
		};
	}

	const errorInfo = $derived(error ? getErrorMessage(error) : null);
</script>

{#if loading}
	<div class="games-list skeleton-grid">
		{#each Array(6) as _, i}
			<GameCardSkeleton />
		{/each}
	</div>
{:else if error}
	<div class="error-state">
		<span class="error-icon">!</span>
		<span class="error-title">{errorInfo?.title}</span>
		<span class="error-description">{errorInfo?.description}</span>
		{#if onRetry}
			<button class="retry-btn" onclick={onRetry}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 4v6h6M23 20v-6h-6"/>
					<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
				</svg>
				RETRY
			</button>
		{/if}
	</div>
{:else if games.length === 0}
	<div class="empty-state">
		<span class="empty-icon">○</span>
		<span class="empty-text">NO GAMES SCHEDULED</span>
		<span class="empty-subtext">Try selecting a different date</span>
	</div>
{:else}
	<div class="games-list">
		{#each games as game (game.id)}
			<div class="game-item" data-game-id={game.id}>
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

	.skeleton-grid {
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
		.games-list,
		.skeleton-grid {
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

	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-2xl);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.error-state {
		border-color: var(--stat-negative);
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
		max-width: 280px;
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

	.retry-btn:active {
		background: var(--bg-inset);
	}

	.empty-icon {
		font-size: 40px;
		color: var(--text-muted);
	}

	.empty-text {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.empty-subtext {
		font-family: var(--font-display);
		font-size: 13px;
		color: var(--text-muted);
	}
</style>
