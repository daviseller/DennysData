<script lang="ts">
	import type { TeamBoxScore } from '$lib/types';

	interface Props {
		homeTeam: TeamBoxScore;
		visitorTeam: TeamBoxScore;
		homeColor: string;
		visitorColor: string;
	}

	let { homeTeam, visitorTeam, homeColor, visitorColor }: Props = $props();

	interface StatComparison {
		label: string;
		homeVal: string;
		visitorVal: string;
		homeRaw: number;
		visitorRaw: number;
	}

	function formatPct(pct: number): string {
		return `${(pct * 100).toFixed(1)}%`;
	}

	const stats = $derived<StatComparison[]>([
		{
			label: 'PTS',
			homeVal: String(homeTeam.totals.pts),
			visitorVal: String(visitorTeam.totals.pts),
			homeRaw: homeTeam.totals.pts,
			visitorRaw: visitorTeam.totals.pts
		},
		{
			label: 'REB',
			homeVal: String(homeTeam.totals.reb),
			visitorVal: String(visitorTeam.totals.reb),
			homeRaw: homeTeam.totals.reb,
			visitorRaw: visitorTeam.totals.reb
		},
		{
			label: 'AST',
			homeVal: String(homeTeam.totals.ast),
			visitorVal: String(visitorTeam.totals.ast),
			homeRaw: homeTeam.totals.ast,
			visitorRaw: visitorTeam.totals.ast
		},
		{
			label: 'STL',
			homeVal: String(homeTeam.totals.stl),
			visitorVal: String(visitorTeam.totals.stl),
			homeRaw: homeTeam.totals.stl,
			visitorRaw: visitorTeam.totals.stl
		},
		{
			label: 'BLK',
			homeVal: String(homeTeam.totals.blk),
			visitorVal: String(visitorTeam.totals.blk),
			homeRaw: homeTeam.totals.blk,
			visitorRaw: visitorTeam.totals.blk
		},
		{
			label: 'TO',
			homeVal: String(homeTeam.totals.turnover),
			visitorVal: String(visitorTeam.totals.turnover),
			homeRaw: homeTeam.totals.turnover,
			visitorRaw: visitorTeam.totals.turnover
		},
		{
			label: 'FG%',
			homeVal: formatPct(homeTeam.totals.fg_pct),
			visitorVal: formatPct(visitorTeam.totals.fg_pct),
			homeRaw: homeTeam.totals.fg_pct,
			visitorRaw: visitorTeam.totals.fg_pct
		},
		{
			label: '3P%',
			homeVal: formatPct(homeTeam.totals.fg3_pct),
			visitorVal: formatPct(visitorTeam.totals.fg3_pct),
			homeRaw: homeTeam.totals.fg3_pct,
			visitorRaw: visitorTeam.totals.fg3_pct
		},
		{
			label: 'FT%',
			homeVal: formatPct(homeTeam.totals.ft_pct),
			visitorVal: formatPct(visitorTeam.totals.ft_pct),
			homeRaw: homeTeam.totals.ft_pct,
			visitorRaw: visitorTeam.totals.ft_pct
		}
	]);

	function getBarWidths(homeRaw: number, visitorRaw: number, label: string): { home: number; visitor: number } {
		// For turnovers, lower is better - invert the comparison
		const invertComparison = label === 'TO';
		const total = homeRaw + visitorRaw;

		if (total === 0) return { home: 50, visitor: 50 };

		let homeWidth = (homeRaw / total) * 100;
		let visitorWidth = (visitorRaw / total) * 100;

		// Ensure minimum visible width
		if (homeWidth > 0 && homeWidth < 10) homeWidth = 10;
		if (visitorWidth > 0 && visitorWidth < 10) visitorWidth = 10;

		return { home: homeWidth, visitor: visitorWidth };
	}

	function getWinner(homeRaw: number, visitorRaw: number, label: string): 'home' | 'visitor' | 'tie' {
		// For turnovers, lower is better
		if (label === 'TO') {
			if (homeRaw < visitorRaw) return 'home';
			if (visitorRaw < homeRaw) return 'visitor';
			return 'tie';
		}
		if (homeRaw > visitorRaw) return 'home';
		if (visitorRaw > homeRaw) return 'visitor';
		return 'tie';
	}
</script>

<div class="team-totals">
	<div class="totals-header">
		<div class="team-col visitor">
			<span class="team-color" style="background: {visitorColor}"></span>
			<span class="team-abbr">{visitorTeam.team.abbreviation}</span>
		</div>
		<div class="label-col">TEAM STATS</div>
		<div class="team-col home">
			<span class="team-abbr">{homeTeam.team.abbreviation}</span>
			<span class="team-color" style="background: {homeColor}"></span>
		</div>
	</div>

	<div class="totals-body">
		{#each stats as stat (stat.label)}
			{@const widths = getBarWidths(stat.homeRaw, stat.visitorRaw, stat.label)}
			{@const winner = getWinner(stat.homeRaw, stat.visitorRaw, stat.label)}
			<div class="stat-row">
				<div class="stat-value visitor" class:winner={winner === 'visitor'}>
					{stat.visitorVal}
				</div>
				<div class="stat-bar-container">
					<div class="stat-bars">
						<div
							class="bar visitor"
							class:winner={winner === 'visitor'}
							style="width: {widths.visitor}%; background: {visitorColor}"
						></div>
						<div
							class="bar home"
							class:winner={winner === 'home'}
							style="width: {widths.home}%; background: {homeColor}"
						></div>
					</div>
					<span class="stat-label">{stat.label}</span>
				</div>
				<div class="stat-value home" class:winner={winner === 'home'}>
					{stat.homeVal}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.team-totals {
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.totals-header {
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-inset);
		border-bottom: 1px solid var(--border-secondary);
	}

	.team-col {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
	}

	.team-col.visitor {
		justify-content: flex-start;
	}

	.team-col.home {
		justify-content: flex-end;
	}

	.team-color {
		width: 4px;
		height: 20px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.team-abbr {
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text-primary);
	}

	.label-col {
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		text-align: center;
		padding: 0 var(--space-md);
	}

	.totals-body {
		padding: var(--space-sm) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.stat-value {
		font-family: var(--font-stats);
		font-size: 14px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		min-width: 48px;
	}

	.stat-value.visitor {
		text-align: left;
	}

	.stat-value.home {
		text-align: right;
	}

	.stat-value.winner {
		color: var(--text-primary);
		font-weight: 600;
	}

	.stat-bar-container {
		flex: 1;
		position: relative;
	}

	.stat-bars {
		display: flex;
		height: 6px;
		gap: 2px;
		border-radius: 1px;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		opacity: 0.4;
		transition: opacity var(--transition-fast);
	}

	.bar.visitor {
		border-radius: 1px 0 0 1px;
	}

	.bar.home {
		border-radius: 0 1px 1px 0;
	}

	.bar.winner {
		opacity: 0.8;
	}

	.stat-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		background: var(--bg-card);
		padding: 0 var(--space-xs);
	}

	@media (max-width: 640px) {
		.stat-value {
			font-size: 12px;
			min-width: 40px;
		}

		.stat-label {
			font-size: 9px;
		}
	}
</style>
