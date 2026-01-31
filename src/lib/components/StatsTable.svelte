<script lang="ts">
	import type { PlayerStats, TeamTotals } from '$lib/types';
	import { getTeamColors } from '$lib/team-colors';

	interface Props {
		players: PlayerStats[];
		totals?: TeamTotals;
		teamColor?: string;
		teamAbbr?: string;
		showTeamColumn?: boolean;
		starters?: Set<number>;
	}

	let { players, totals, teamColor, teamAbbr, showTeamColumn = false, starters = new Set() }: Props = $props();

	type SortKey = 'name' | 'min' | 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'fg' | 'fg3' | 'ft';
	type SortDir = 'asc' | 'desc';

	let sortKey = $state<SortKey>('pts');
	let sortDir = $state<SortDir>('desc');

	function parseMinutes(min: string): number {
		if (!min) return 0;
		const parts = min.split(':');
		return parseInt(parts[0]) || 0;
	}

	function sortPlayers(players: PlayerStats[], key: SortKey, dir: SortDir): PlayerStats[] {
		return [...players].sort((a, b) => {
			let aVal: number | string;
			let bVal: number | string;

			switch (key) {
				case 'name':
					aVal = `${a.player.last_name} ${a.player.first_name}`;
					bVal = `${b.player.last_name} ${b.player.first_name}`;
					break;
				case 'min':
					aVal = parseMinutes(a.min);
					bVal = parseMinutes(b.min);
					break;
				case 'pts':
					aVal = a.pts;
					bVal = b.pts;
					break;
				case 'reb':
					aVal = a.reb;
					bVal = b.reb;
					break;
				case 'ast':
					aVal = a.ast;
					bVal = b.ast;
					break;
				case 'stl':
					aVal = a.stl;
					bVal = b.stl;
					break;
				case 'blk':
					aVal = a.blk;
					bVal = b.blk;
					break;
				case 'fg':
					aVal = a.fgm;
					bVal = b.fgm;
					break;
				case 'fg3':
					aVal = a.fg3m;
					bVal = b.fg3m;
					break;
				case 'ft':
					aVal = a.ftm;
					bVal = b.ftm;
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

	function findLeaderFromList(list: PlayerStats[], key: 'pts' | 'reb' | 'ast' | 'stl' | 'blk'): number {
		if (list.length === 0) return -1;
		let maxVal = -1;
		let maxId = -1;
		for (const p of list) {
			if (p[key] > maxVal) {
				maxVal = p[key];
				maxId = p.player.id;
			}
		}
		return maxVal > 0 ? maxId : -1;
	}

	// Filter out players with 0 minutes (didn't play)
	const activePlayers = $derived(players.filter(p => {
		if (!p.min) return false;
		// Handle both plain minutes ("26") and MM:SS format ("26:34")
		const parts = p.min.split(':');
		const mins = parseInt(parts[0]) || 0;
		const secs = parts.length > 1 ? (parseInt(parts[1]) || 0) : 0;
		return mins > 0 || secs > 0;
	}));
	const sortedPlayers = $derived(sortPlayers(activePlayers, sortKey, sortDir));
	const ptsLeader = $derived(findLeaderFromList(activePlayers, 'pts'));
	const rebLeader = $derived(findLeaderFromList(activePlayers, 'reb'));
	const astLeader = $derived(findLeaderFromList(activePlayers, 'ast'));

	function formatMinutes(min: string): string {
		if (!min) return '-';
		// Handle both plain minutes ("26") and MM:SS format ("26:34")
		const parts = min.split(':');
		if (parts.length < 2) {
			// Plain minutes - remove leading zero
			const mins = parseInt(min) || 0;
			return String(mins);
		}
		// MM:SS format - remove leading zero from minutes
		const mins = parseInt(parts[0]) || 0;
		const secs = parts[1].padStart(2, '0');
		return `${mins}:${secs}`;
	}

	function formatShootingLine(made: number, attempted: number): string {
		if (attempted === 0) return '-';
		return `${made}-${attempted}`;
	}
</script>

<div class="stats-table-container">
	{#if teamAbbr}
		{@const colors = getTeamColors(teamAbbr)}
		<div class="table-header">
			<span class="team-color-bar" style="background: linear-gradient(135deg, {colors.primary} 49%, {colors.secondary} 51%)"></span>
			<span class="team-label">{teamAbbr}</span>
		</div>
	{/if}

	<div class="table-scroll">
		<table class="stats-table">
			<thead>
				<tr>
					{#if showTeamColumn}
						<th class="col-team">TEAM</th>
					{/if}
					<th class="col-player">
						<button class="sort-btn" class:active={sortKey === 'name'} onclick={() => handleSort('name')}>
							PLAYER
							{#if sortKey === 'name'}
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
							PTS
							{#if sortKey === 'pts'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'reb'} onclick={() => handleSort('reb')}>
							REB
							{#if sortKey === 'reb'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'ast'} onclick={() => handleSort('ast')}>
							AST
							{#if sortKey === 'ast'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'stl'} onclick={() => handleSort('stl')}>
							STL
							{#if sortKey === 'stl'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-stat">
						<button class="sort-btn" class:active={sortKey === 'blk'} onclick={() => handleSort('blk')}>
							BLK
							{#if sortKey === 'blk'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-shooting">
						<button class="sort-btn" class:active={sortKey === 'fg'} onclick={() => handleSort('fg')}>
							FG
							{#if sortKey === 'fg'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-shooting">
						<button class="sort-btn" class:active={sortKey === 'fg3'} onclick={() => handleSort('fg3')}>
							3PT
							{#if sortKey === 'fg3'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
					<th class="col-shooting">
						<button class="sort-btn" class:active={sortKey === 'ft'} onclick={() => handleSort('ft')}>
							FT
							{#if sortKey === 'ft'}
								<span class="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedPlayers as player (player.player.id)}
					<tr>
						{#if showTeamColumn}
							{@const playerColors = getTeamColors(player.team.abbreviation)}
							<td class="col-team">
								<span class="team-color-pip" style="background: linear-gradient(135deg, {playerColors.primary} 49%, {playerColors.secondary} 51%)"></span>
								{player.team.abbreviation}
							</td>
						{/if}
						<td class="col-player">
							<span class="player-name">
								{player.player.first_name.charAt(0)}. {player.player.last_name}
							</span>
							{#if starters.has(player.player.id)}
								<span class="starter-badge">S</span>
							{/if}
						</td>
						<td class="col-stat">{formatMinutes(player.min)}</td>
						<td class="col-stat" class:stat-leader={player.player.id === ptsLeader}>{player.pts}</td>
						<td class="col-stat" class:stat-leader={player.player.id === rebLeader}>{player.reb}</td>
						<td class="col-stat" class:stat-leader={player.player.id === astLeader}>{player.ast}</td>
						<td class="col-stat">{player.stl}</td>
						<td class="col-stat">{player.blk}</td>
						<td class="col-shooting">{formatShootingLine(player.fgm, player.fga)}</td>
						<td class="col-shooting">{formatShootingLine(player.fg3m, player.fg3a)}</td>
						<td class="col-shooting">{formatShootingLine(player.ftm, player.fta)}</td>
					</tr>
				{/each}
			</tbody>
			{#if totals}
				<tfoot>
					<tr class="totals-row">
						{#if showTeamColumn}
							<td class="col-team"></td>
						{/if}
						<td class="col-player">TOTALS</td>
						<td class="col-stat">-</td>
						<td class="col-stat">{totals.pts}</td>
						<td class="col-stat">{totals.reb}</td>
						<td class="col-stat">{totals.ast}</td>
						<td class="col-stat">{totals.stl}</td>
						<td class="col-stat">{totals.blk}</td>
						<td class="col-shooting">{formatShootingLine(totals.fgm, totals.fga)}</td>
						<td class="col-shooting">{formatShootingLine(totals.fg3m, totals.fg3a)}</td>
						<td class="col-shooting">{formatShootingLine(totals.ftm, totals.fta)}</td>
					</tr>
				</tfoot>
			{/if}
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

	th.col-team,
	td.col-team {
		text-align: left;
		padding-left: var(--space-md);
		font-weight: 600;
		color: var(--text-muted);
		min-width: 48px;
	}

	td.col-team {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.team-color-pip {
		width: 10px;
		height: 10px;
		border-radius: 1px;
		flex-shrink: 0;
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

	.starter-badge {
		margin-left: var(--space-xs);
		padding: 1px 4px;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-muted);
		background: var(--bg-inset);
		border-radius: 2px;
		vertical-align: middle;
	}

	.col-stat {
		min-width: 36px;
	}

	.col-shooting {
		min-width: 48px;
		padding-right: var(--space-sm);
	}

	.stat-leader {
		color: var(--stat-leader);
		font-weight: 600;
	}

	tbody tr:hover {
		background: var(--bg-card-hover);
	}

	tfoot .totals-row {
		background: var(--bg-inset);
	}

	tfoot .totals-row td {
		font-weight: 600;
		color: var(--text-primary);
		border-bottom: none;
	}

	@media (max-width: 640px) {
		.stats-table {
			font-size: 12px;
		}

		th, td {
			padding: var(--space-xs);
		}

		.col-stat {
			min-width: 32px;
		}

		.col-shooting {
			min-width: 40px;
		}
	}
</style>
