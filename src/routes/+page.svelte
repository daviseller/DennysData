<script lang="ts">
	let currentTheme = $state('hardwood');

	const themes = [
		{ id: 'hardwood', name: 'Hardwood', type: 'dark' },
		{ id: 'broadcast', name: 'Broadcast', type: 'dark' },
		{ id: 'tunnel', name: 'Tunnel', type: 'dark' },
		{ id: 'jumbotron', name: 'Jumbotron', type: 'dark' },
		{ id: 'blackout', name: 'Blackout', type: 'dark' },
		{ id: 'arena', name: 'Arena', type: 'light' },
		{ id: 'courtside', name: 'Courtside', type: 'light' },
		{ id: 'pressbox', name: 'Pressbox', type: 'light' },
		{ id: 'practice', name: 'Practice', type: 'light' },
		{ id: 'chalk', name: 'Chalk', type: 'light' },
	];

	function setTheme(themeId: string) {
		currentTheme = themeId;
		document.documentElement.setAttribute('data-theme', themeId);
	}
</script>

<div class="container">
	<header class="header">
		<h1>DennysData</h1>
		<p class="text-secondary">NBA Box Scores</p>
	</header>

	<section class="panel mt-lg">
		<div class="panel-header">
			<span class="label">Theme Selector</span>
		</div>
		<div class="panel-body">
			<div class="theme-grid">
				{#each themes as theme (theme.id)}
					<button
						class="theme-btn"
						class:active={currentTheme === theme.id}
						onclick={() => setTheme(theme.id)}
					>
						<span class="theme-name">{theme.name}</span>
						<span class="theme-type label">{theme.type}</span>
					</button>
				{/each}
			</div>
		</div>
	</section>

	<section class="panel mt-lg">
		<div class="panel-header">
			<span class="label">Sample Game Card</span>
		</div>
		<div class="panel-body">
			<div class="game-card card">
				<div class="game-status">
					<span class="status-indicator status-live">
						<span class="status-dot"></span>
						Q3 4:32
					</span>
				</div>
				<div class="game-teams">
					<div class="team-row">
						<span class="team-abbr">LAL</span>
						<span class="score">98</span>
					</div>
					<div class="team-row">
						<span class="team-abbr">BOS</span>
						<span class="score stat-leader">102</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="panel mt-lg">
		<div class="panel-header">
			<span class="label">Status Indicators</span>
		</div>
		<div class="panel-body">
			<div class="flex gap-md">
				<span class="status-indicator status-live">
					<span class="status-dot"></span>
					LIVE
				</span>
				<span class="status-indicator status-halftime">
					<span class="status-dot"></span>
					HALFTIME
				</span>
				<span class="status-indicator status-final">
					<span class="status-dot"></span>
					FINAL
				</span>
				<span class="status-indicator status-scheduled">
					<span class="status-dot"></span>
					7:30 PM
				</span>
			</div>
		</div>
	</section>

	<section class="panel mt-lg">
		<div class="panel-header">
			<span class="label">Sample Stats Table</span>
		</div>
		<div class="panel-body" style="padding: 0;">
			<table>
				<thead>
					<tr>
						<th>Player</th>
						<th class="number">MIN</th>
						<th class="number">PTS</th>
						<th class="number">REB</th>
						<th class="number">AST</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>L. James</td>
						<td class="number mono">38</td>
						<td class="number mono stat-leader">32</td>
						<td class="number mono">10</td>
						<td class="number mono">8</td>
					</tr>
					<tr>
						<td>A. Davis</td>
						<td class="number mono">36</td>
						<td class="number mono">28</td>
						<td class="number mono stat-leader">14</td>
						<td class="number mono">3</td>
					</tr>
					<tr>
						<td>D. Russell</td>
						<td class="number mono">32</td>
						<td class="number mono">18</td>
						<td class="number mono">4</td>
						<td class="number mono stat-leader">11</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="panel mt-lg">
		<div class="panel-header">
			<span class="label">Buttons</span>
		</div>
		<div class="panel-body">
			<div class="flex gap-sm">
				<button class="btn">Default</button>
				<button class="btn btn-primary">Primary</button>
				<button class="btn btn-sm">Small</button>
			</div>
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--space-lg);
	}

	.header {
		margin-bottom: var(--space-lg);
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--space-sm);
	}

	.theme-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.theme-btn:hover {
		border-color: var(--accent-primary);
	}

	.theme-btn.active {
		border-color: var(--accent-primary);
		background: var(--bg-card-hover);
	}

	.theme-name {
		font-family: var(--font-display);
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.theme-type {
		font-size: 9px;
	}

	.game-card {
		max-width: 280px;
		padding: var(--space-md);
	}

	.game-status {
		margin-bottom: var(--space-sm);
	}

	.game-teams {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.team-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	@media (max-width: 640px) {
		.theme-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
