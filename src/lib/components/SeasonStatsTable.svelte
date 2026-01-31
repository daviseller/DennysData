<script lang="ts">
	import type { PlayerSeasonStats } from '$lib/types';
	import { getTeamColors } from '$lib/team-colors';

	interface Props {
		players: PlayerSeasonStats[];
		teamAbbr: string;
		teamId: number;
	}

	let { players, teamAbbr, teamId }: Props = $props();

	type SortKey = 'name' | 'gp' | 'min' | 'pts' | 'reb' | 'ast' | 'fg_pct' | 'fg3_pct';
	type SortDir = 'asc' | 'desc';

	let sortKey = $state<SortKey>('pts');
	let sortDir = $state<SortDir>('desc');

	function sortPlayers(players: PlayerSeasonStats[], key: SortKey, dir: SortDir): PlayerSeasonStats[] {
		return [...players].sort((a, b) => {
			let aVal: number | string;
			let bVal: number | string;

			switch (key) {
				case 'name':
					aVal = `${a.player.last_name} ${a.player.first_name}`;
					bVal = `${b.player.last_name} ${b.player.first_name}`;
					break;
				case 'gp':
					aVal = a.games_played ?? 0;
					bVal = b.games_played ?? 0;
					break;
				case 'min':
					aVal = a.min ?? 0;
					bVal = b.min ?? 0;
					break;
				case 'pts':
					aVal = a.pts ?? 0;
					bVal = b.pts ?? 0;
					break;
				case 'reb':
					aVal = a.reb ?? 0;
					bVal = b.reb ?? 0;
					break;
				case 'ast':
					aVal = a.ast ?? 0;
					bVal = b.ast ?? 0;
					break;
				case 'fg_pct':
					aVal = a.fg_pct ?? 0;
					bVal = b.fg_pct ?? 0;
					break;
				case 'fg3_pct':
					aVal = a.fg3_pct ?? 0;
					bVal = b.fg3_pct ?? 0;
					break;
				default:
					aVal = 0;
					bVal = 0;
			}

			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}

			return dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
		});
	}

	function handleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'desc' ? 'asc' : 'desc';
		} else {
			sortKey = key;
			sortDir = key === 'name' ? 'asc' : 'desc';
		}
	}

	// Filter to only players on this team with games played
	const teamPlayers = $derived(players.filter(p =>
		p.player.team_id === teamId && p.games_played > 0
	));
	const sortedPlayers = $derived(sortPlayers(teamPlayers, sortKey, sortDir));
	const colors = $derived(getTeamColors(teamAbbr));

	function formatStat(val: number | null): string {
		if (val === null || val === undefined) return '-';
		return val.toFixed(1);
	}

	function formatPct(val: number | null): string {
		if (val === null || val === undefined) return '-';
		return (val * 100).toFixed(0) + '%';
	}
</script>

<div class="stats-table-container">
	<div class="table-header">
		<span class="team-color-bar" style="background: linear-gradient(135deg, {colors.primary} 49%, {colors.secondary} 51%)"></span>
		<span class="team-label">{teamAbbr}</span>
		<span class="season-label">SEASON AVG</span>
	</div>

	<div class="table-scroll">
		<table class="stats-table">
			<thead>
				<tr>
					<th class="col-player">
						<button class="sort-btn" class:active={sortKey === 'name'} onclick={() => handleSort('name')}>
							PLAYER
							{#if sortKey === 'name'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'gp'} onclick={() => handleSort('gp')}>
							GP
							{#if sortKey === 'gp'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'min'} onclick={() => handleSort('min')}>
							MIN
							{#if sortKey === 'min'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'pts'} onclick={() => handleSort('pts')}>
							PPG
							{#if sortKey === 'pts'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'reb'} onclick={() => handleSort('reb')}>
							RPG
							{#if sortKey === 'reb'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'ast'} onclick={() => handleSort('ast')}>
							APG
							{#if sortKey === 'ast'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'fg_pct'} onclick={() => handleSort('fg_pct')}>
							FG%
							{#if sortKey === 'fg_pct'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat col-last">
						<button class="sort-btn" class:active={sortKey === 'fg3_pct'} onclick={() => handleSort('fg3_pct')}>
							3P%
							{#if sortKey === 'fg3_pct'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedPlayers as player (player.player.id)}
					<tr class:injured={player.injury}>
						<td class="col-player">
							<span class="player-name">
								{player.player.first_name.charAt(0)}. {player.player.last_name}
							</span>
							{#if player.injury}
								<span class="injury-badge injury-{player.injury.status.toLowerCase()}" title={player.injury.description || player.injury.status}>
									{player.injury.status === 'Out' ? 'OUT' : player.injury.status === 'Doubtful' ? 'DTD' : player.injury.status === 'Questionable' ? 'GTD' : player.injury.status.substring(0, 3).toUpperCase()}
								</span>
							{/if}
						</td>
						<td class="col-stat">{player.games_played}</td>
						<td class="col-stat">{formatStat(player.min)}</td>
						<td class="col-stat">{formatStat(player.pts)}</td>
						<td class="col-stat">{formatStat(player.reb)}</td>
						<td class="col-stat">{formatStat(player.ast)}</td>
						<td class="col-stat">{formatPct(player.fg_pct)}</td>
						<td class="col-stat col-last">{formatPct(player.fg3_pct)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.stats-table-container {
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		overflow: hidden;
		max-width: 100%;
	}

	.table-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-inset);
		border-bottom: 1px solid var(--border-secondary);
	}

	.team-color-bar {
		width: 14px;
		height: 14px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.team-label {
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-primary);
	}

	.season-label {
		margin-left: auto;
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.table-scroll {
		overflow-x: auto;
	}

	.stats-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-stats);
		font-size: 13px;
		white-space: nowrap;
	}

	thead {
		position: sticky;
		top: 0;
		background: var(--bg-inset);
		z-index: 1;
	}

	th {
		padding: var(--space-sm) var(--space-xs);
		text-align: right;
		font-weight: 500;
		font-size: 11px;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-secondary);
		white-space: nowrap;
	}

	th.col-player {
		text-align: left;
		padding-left: var(--space-md);
	}

	.sort-btn {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 2px;
		transition: color var(--transition-fast);
	}

	.sort-btn:hover,
	.sort-btn.active {
		color: var(--text-primary);
	}

	.sort-arrow {
		font-size: 8px;
		opacity: 0.7;
	}

	td {
		padding: var(--space-sm) var(--space-xs);
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-secondary);
	}

	td.col-player {
		text-align: left;
		padding-left: var(--space-md);
	}

	.player-name {
		color: var(--text-primary);
		font-weight: 500;
	}

	.injury-badge {
		display: inline-block;
		margin-left: var(--space-xs);
		padding: 1px 4px;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.02em;
		border-radius: 2px;
		vertical-align: middle;
	}

	.injury-out {
		background: var(--stat-negative);
		color: white;
	}

	.injury-doubtful {
		background: #c9553d;
		color: white;
	}

	.injury-questionable {
		background: #d4a017;
		color: #1a1a1a;
	}

	.injury-probable {
		background: var(--text-muted);
		color: var(--bg-card);
	}

	tr.injured {
		opacity: 0.7;
	}

	tr.injured:hover {
		opacity: 1;
	}

	.col-stat {
		min-width: 40px;
	}

	.col-last {
		padding-right: var(--space-md);
	}

	tbody tr:hover {
		background: var(--bg-card-hover);
	}

	@media (max-width: 640px) {
		.stats-table {
			font-size: 12px;
		}

		th, td {
			padding: var(--space-xs);
		}

		.col-stat {
			min-width: 36px;
		}
	}
</style>
