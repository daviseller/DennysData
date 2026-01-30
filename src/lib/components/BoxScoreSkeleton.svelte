<script lang="ts">
	// Skeleton loading placeholder for box score panel
</script>

<div class="box-score-skeleton">
	<!-- Header skeleton -->
	<div class="header-skeleton">
		<div class="team-skeleton">
			<div class="skeleton-line skeleton-color"></div>
			<div class="skeleton-line skeleton-abbr"></div>
			<div class="skeleton-line skeleton-score-lg"></div>
		</div>
		<div class="status-skeleton">
			<div class="skeleton-line skeleton-dot"></div>
			<div class="skeleton-line skeleton-status"></div>
		</div>
		<div class="team-skeleton team-right">
			<div class="skeleton-line skeleton-score-lg"></div>
			<div class="skeleton-line skeleton-abbr"></div>
			<div class="skeleton-line skeleton-color"></div>
		</div>
	</div>

	<!-- Team totals skeleton -->
	<div class="totals-skeleton">
		<div class="totals-header-skeleton">
			<div class="skeleton-line skeleton-label"></div>
		</div>
		<div class="stat-bars-skeleton">
			{#each Array(4) as _, i}
				<div class="stat-row-skeleton">
					<div class="skeleton-line skeleton-stat-label"></div>
					<div class="skeleton-line skeleton-bar"></div>
					<div class="skeleton-line skeleton-stat-value"></div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Stats table skeleton -->
	{#each Array(2) as _, tableIndex}
		<div class="table-skeleton">
			<div class="table-header-skeleton">
				<div class="skeleton-line skeleton-team-header"></div>
			</div>
			<div class="table-rows-skeleton">
				{#each Array(5) as _, rowIndex}
					<div class="table-row-skeleton">
						<div class="skeleton-line skeleton-player"></div>
						<div class="skeleton-line skeleton-stat"></div>
						<div class="skeleton-line skeleton-stat"></div>
						<div class="skeleton-line skeleton-stat"></div>
						<div class="skeleton-line skeleton-stat"></div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.box-score-skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.skeleton-line {
		background: var(--bg-inset);
		border-radius: var(--radius-sm);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	/* Header skeleton */
	.header-skeleton {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.team-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.team-right {
		flex-direction: row-reverse;
	}

	.team-right .skeleton-color {
		order: 3;
	}

	.skeleton-color {
		width: 4px;
		height: 32px;
	}

	.skeleton-abbr {
		width: 36px;
		height: 16px;
	}

	.skeleton-score-lg {
		width: 40px;
		height: 24px;
	}

	.status-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.skeleton-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.skeleton-status {
		width: 48px;
		height: 11px;
	}

	/* Totals skeleton */
	.totals-skeleton {
		padding: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.totals-header-skeleton {
		margin-bottom: var(--space-md);
	}

	.skeleton-label {
		width: 80px;
		height: 12px;
	}

	.stat-bars-skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.stat-row-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.skeleton-stat-label {
		width: 32px;
		height: 11px;
	}

	.skeleton-bar {
		flex: 1;
		height: 8px;
	}

	.skeleton-stat-value {
		width: 24px;
		height: 11px;
	}

	/* Table skeleton */
	.table-skeleton {
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.table-header-skeleton {
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--border-secondary);
	}

	.skeleton-team-header {
		width: 60px;
		height: 14px;
	}

	.table-rows-skeleton {
		padding: var(--space-sm) var(--space-md);
	}

	.table-row-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-xs) 0;
	}

	.table-row-skeleton:not(:last-child) {
		border-bottom: 1px solid var(--border-secondary);
	}

	.skeleton-player {
		width: 100px;
		height: 12px;
	}

	.skeleton-stat {
		width: 28px;
		height: 12px;
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
