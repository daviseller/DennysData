<script lang="ts">
	import type { TeamBoxScore } from '$lib/types';
	import type { TeamColors } from '$lib/team-colors';

	interface Props {
		homeTeam: TeamBoxScore;
		visitorTeam: TeamBoxScore;
		homeColors: TeamColors;
		visitorColors: TeamColors;
	}

	let { homeTeam, visitorTeam, homeColors, visitorColors }: Props = $props();

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

	function getBarWidth(value: number, otherValue: number): number {
		const max = Math.max(value, otherValue);
		if (max === 0) return 0;
		// Scale to percentage of the half (max gets 100% of its half)
		return (value / max) * 100;
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
			<span class="team-color" style="background: linear-gradient(135deg, {visitorColors.primary} 49%, {visitorColors.secondary} 51%)"></span>
			<span class="team-abbr">{visitorTeam.team.abbreviation}</span>
		</div>
		<div class="label-col">TEAM STATS</div>
		<div class="team-col home">
			<span class="team-abbr">{homeTeam.team.abbreviation}</span>
			<span class="team-color" style="background: linear-gradient(135deg, {homeColors.primary} 49%, {homeColors.secondary} 51%)"></span>
		</div>
	</div>

	<div class="totals-body">
		{#each stats as stat (stat.label)}
			{@const visitorWidth = getBarWidth(stat.visitorRaw, stat.homeRaw)}
			{@const homeWidth = getBarWidth(stat.homeRaw, stat.visitorRaw)}
			{@const winner = getWinner(stat.homeRaw, stat.visitorRaw, stat.label)}
			<div class="stat-row">
				<div class="stat-value visitor" class:winner={winner === 'visitor'}>
					{stat.visitorVal}
				</div>
				<div class="stat-bars">
					<div class="bar-half visitor">
						<div
							class="bar"
							class:winner={winner === 'visitor'}
							style="width: {visitorWidth}%; background: {visitorColors.primary}"
						></div>
					</div>
					<span class="stat-label">{stat.label}</span>
					<div class="bar-half home">
						<div
							class="bar"
							class:winner={winner === 'home'}
							style="width: {homeWidth}%; background: {homeColors.primary}"
						></div>
					</div>
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
		width: 14px;
		height: 14px;
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
		text-align: right;
	}

	.stat-value.home {
		text-align: left;
	}

	.stat-value.winner {
		color: var(--text-primary);
		font-weight: 600;
	}

	.stat-bars {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.bar-half {
		flex: 1;
		height: 8px;
		display: flex;
		background: var(--bg-inset);
		border-radius: 1px;
		overflow: hidden;
	}

	.bar-half.visitor {
		justify-content: flex-end;
	}

	.bar-half.home {
		justify-content: flex-start;
	}

	.bar {
		height: 100%;
		opacity: 0.5;
		transition: opacity var(--transition-fast);
		border-radius: 1px;
	}

	.bar.winner {
		opacity: 0.9;
	}

	.stat-label {
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		min-width: 32px;
		text-align: center;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.stat-value {
			font-size: 12px;
			min-width: 40px;
		}

		.stat-label {
			font-size: 9px;
			min-width: 28px;
		}

		.bar-half {
			height: 6px;
		}
	}
</style>
