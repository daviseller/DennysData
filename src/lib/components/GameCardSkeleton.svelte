<script lang="ts">
	// Skeleton loading placeholder for game cards
</script>

<div class="game-card-skeleton">
	<div class="status-skeleton">
		<div class="skeleton-line skeleton-dot"></div>
		<div class="skeleton-line skeleton-status"></div>
	</div>

	<div class="teams-skeleton">
		<div class="team-row-skeleton">
			<div class="skeleton-line skeleton-color"></div>
			<div class="skeleton-line skeleton-abbr"></div>
			<div class="skeleton-line skeleton-score"></div>
		</div>
		<div class="team-row-skeleton">
			<div class="skeleton-line skeleton-color"></div>
			<div class="skeleton-line skeleton-abbr"></div>
			<div class="skeleton-line skeleton-score"></div>
		</div>
	</div>
</div>

<style>
	.game-card-skeleton {
		padding: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.status-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-sm);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border-secondary);
	}

	.teams-skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.team-row-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.skeleton-line {
		background: var(--bg-inset);
		border-radius: var(--radius-sm);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.skeleton-status {
		width: 48px;
		height: 12px;
	}

	.skeleton-color {
		width: 4px;
		height: 24px;
		flex-shrink: 0;
	}

	.skeleton-abbr {
		width: 36px;
		height: 14px;
		flex: 0 0 auto;
	}

	.skeleton-score {
		width: 28px;
		height: 18px;
		margin-left: auto;
	}

	@keyframes skeleton-pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
