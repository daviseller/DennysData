<script lang="ts">
	// Skeleton loading placeholder for player panel
</script>

<div class="player-panel-skeleton">
	<!-- Header skeleton -->
	<div class="header-skeleton">
		<div class="name-row-skeleton">
			<div class="skeleton-line skeleton-name"></div>
			<div class="skeleton-line skeleton-jersey"></div>
		</div>
		<div class="team-row-skeleton">
			<div class="skeleton-line skeleton-team-color"></div>
			<div class="skeleton-line skeleton-team-name"></div>
			<div class="skeleton-line skeleton-position"></div>
		</div>
		<div class="bio-skeleton">
			{#each Array(4) as _}
				<div class="bio-item-skeleton">
					<div class="skeleton-line skeleton-bio-label"></div>
					<div class="skeleton-line skeleton-bio-value"></div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Section title skeleton -->
	<div class="section-skeleton">
		<div class="skeleton-line skeleton-section-title"></div>
	</div>

	<!-- Stats table skeleton -->
	<div class="table-skeleton">
		<div class="table-header-skeleton">
			{#each Array(12) as _}
				<div class="skeleton-line skeleton-th"></div>
			{/each}
		</div>
		<div class="table-rows-skeleton">
			{#each Array(8) as _}
				<div class="table-row-skeleton">
					<div class="skeleton-line skeleton-season"></div>
					<div class="skeleton-line skeleton-team-cell"></div>
					{#each Array(10) as _}
						<div class="skeleton-line skeleton-stat"></div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.player-panel-skeleton {
		display: flex;
		flex-direction: column;
		background: var(--bg-app);
	}

	.skeleton-line {
		background: var(--bg-inset);
		border-radius: var(--radius-sm);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	/* Header skeleton */
	.header-skeleton {
		padding: var(--space-lg);
		background: var(--bg-card);
		border-bottom: 1px solid var(--border-primary);
	}

	.name-row-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.skeleton-name {
		width: 180px;
		height: 28px;
	}

	.skeleton-jersey {
		width: 40px;
		height: 20px;
	}

	.team-row-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.skeleton-team-color {
		width: 14px;
		height: 14px;
	}

	.skeleton-team-name {
		width: 140px;
		height: 14px;
	}

	.skeleton-position {
		width: 30px;
		height: 13px;
	}

	.bio-skeleton {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-sm) var(--space-lg);
	}

	.bio-item-skeleton {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.skeleton-bio-label {
		width: 50px;
		height: 10px;
	}

	.skeleton-bio-value {
		width: 80px;
		height: 14px;
	}

	/* Section title skeleton */
	.section-skeleton {
		padding: var(--space-md);
		padding-bottom: 0;
	}

	.skeleton-section-title {
		width: 120px;
		height: 12px;
	}

	/* Table skeleton */
	.table-skeleton {
		margin: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.table-header-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-inset);
		border-bottom: 1px solid var(--border-secondary);
	}

	.skeleton-th {
		width: 36px;
		height: 10px;
	}

	.skeleton-th:first-child {
		width: 56px;
	}

	.skeleton-th:nth-child(2) {
		width: 40px;
	}

	.table-rows-skeleton {
		padding: var(--space-xs) 0;
	}

	.table-row-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--border-secondary);
	}

	.table-row-skeleton:last-child {
		border-bottom: none;
	}

	.skeleton-season {
		width: 56px;
		height: 12px;
	}

	.skeleton-team-cell {
		width: 40px;
		height: 12px;
	}

	.skeleton-stat {
		width: 36px;
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
