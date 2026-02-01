<script lang="ts">
	import { fetchPlayer, fetchPlayerGameLog } from '$lib/api';
	import { getTeamColors } from '$lib/team-colors';
	import type { PlayerProfileResponse, PlayerGameLogResponse } from '$lib/types';
	import PlayerPanelSkeleton from './PlayerPanelSkeleton.svelte';

	type TabId = 'seasons' | 'gamelog';

	interface Props {
		playerId: number;
		onClose?: () => void;
	}

	let { playerId, onClose }: Props = $props();

	let profile = $state<PlayerProfileResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let injuryExpanded = $state(false);
	let expandedSeasons = $state<Set<number>>(new Set());

	// Tab state
	let activeTab = $state<TabId>('seasons');

	// Game log state
	let gameLog = $state<PlayerGameLogResponse | null>(null);
	let gameLogLoading = $state(false);
	let gameLogError = $state<string | null>(null);
	let gameLogSeason = $state<number>(getCurrentSeason());

	function getCurrentSeason(): number {
		const now = new Date();
		const month = now.getMonth();
		const year = now.getFullYear();
		return month < 9 ? year - 1 : year;
	}

	function toggleSeasonExpanded(season: number) {
		const newSet = new Set(expandedSeasons);
		if (newSet.has(season)) {
			newSet.delete(season);
		} else {
			newSet.add(season);
		}
		expandedSeasons = newSet;
	}

	let abortController: AbortController | null = null;
	let gameLogAbortController: AbortController | null = null;

	$effect(() => {
		if (playerId) {
			injuryExpanded = false;
			activeTab = 'seasons';
			gameLog = null;
			gameLogError = null;
			loadPlayer(playerId);
		}

		return () => {
			if (abortController) {
				abortController.abort();
			}
			if (gameLogAbortController) {
				gameLogAbortController.abort();
			}
		};
	});

	// Load game log when tab is switched to gamelog
	$effect(() => {
		if (activeTab === 'gamelog' && playerId && !gameLog && !gameLogLoading) {
			loadGameLog(playerId, gameLogSeason);
		}
	});

	async function loadPlayer(id: number) {
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();

		loading = true;
		error = null;

		const result = await fetchPlayer(id, abortController.signal);

		if (result.error) {
			error = result.error.message;
			profile = null;
		} else if (result.data) {
			profile = result.data;
		}

		loading = false;
	}

	async function loadGameLog(id: number, season: number) {
		if (gameLogAbortController) {
			gameLogAbortController.abort();
		}
		gameLogAbortController = new AbortController();

		gameLogLoading = true;
		gameLogError = null;

		const result = await fetchPlayerGameLog(id, season, gameLogAbortController.signal);

		if (result.error) {
			gameLogError = result.error.message;
			gameLog = null;
		} else if (result.data) {
			gameLog = result.data;
		}

		gameLogLoading = false;
	}

	function handleSeasonChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const newSeason = parseInt(select.value, 10);
		if (!isNaN(newSeason)) {
			gameLogSeason = newSeason;
			gameLog = null;
			loadGameLog(playerId, newSeason);
		}
	}

	function formatGameDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatHeight(height: string | null): string {
		if (!height) return '-';
		// Height might be in format "6-8" or "6'8"
		return height.replace('-', "'") + '"';
	}

	function formatWeight(weight: string | null): string {
		if (!weight) return '-';
		return weight + ' lbs';
	}

	function formatDraft(year: number | null, round: number | null, pick: number | null): string {
		if (!year) return 'Undrafted';
		const roundStr = round === 1 ? '1st' : round === 2 ? '2nd' : `${round}th`;
		return `${year} ${roundStr} Rd, Pick ${pick}`;
	}

	function formatStat(val: number | null): string {
		if (val === null || val === undefined) return '-';
		return val.toFixed(1);
	}

	function formatPct(val: number | null): string {
		if (val === null || val === undefined) return '-';
		return (val * 100).toFixed(1);
	}

	function formatSeasonLabel(season: number): string {
		const nextYear = (season + 1).toString().slice(-2);
		return `${season}-${nextYear}`;
	}

	// Group seasons and calculate totals for multi-team seasons
	interface SeasonGroup {
		season: number;
		isMultiTeam: boolean;
		total: typeof profile.seasons[0] | null;
		teams: typeof profile.seasons;
	}

	const groupedSeasons = $derived.by(() => {
		if (!profile) return [];

		const seasonMap = new Map<number, typeof profile.seasons>();

		// Group by season
		for (const s of profile.seasons) {
			if (!seasonMap.has(s.season)) {
				seasonMap.set(s.season, []);
			}
			seasonMap.get(s.season)!.push(s);
		}

		// Build grouped array with totals for multi-team seasons
		const groups: SeasonGroup[] = [];

		for (const [season, teams] of seasonMap) {
			if (teams.length === 1) {
				groups.push({
					season,
					isMultiTeam: false,
					total: null,
					teams
				});
			} else {
				// Calculate combined totals
				const totalGames = teams.reduce((sum, t) => sum + t.games_played, 0);

				// Weighted averages based on games played
				const weightedAvg = (field: keyof typeof teams[0]) => {
					const validTeams = teams.filter((t) => t[field] !== null);
					if (validTeams.length === 0) return null;
					const totalWeight = validTeams.reduce((sum, t) => sum + t.games_played, 0);
					return validTeams.reduce((sum, t) => sum + (t[field] as number) * t.games_played, 0) / totalWeight;
				};

				// For percentages, recalculate from totals
				const totalFgm = teams.reduce((sum, t) => sum + (t.fgm || 0) * t.games_played, 0);
				const totalFga = teams.reduce((sum, t) => sum + (t.fga || 0) * t.games_played, 0);
				const totalFg3m = teams.reduce((sum, t) => sum + (t.fg3m || 0) * t.games_played, 0);
				const totalFg3a = teams.reduce((sum, t) => sum + (t.fg3a || 0) * t.games_played, 0);
				const totalFtm = teams.reduce((sum, t) => sum + (t.ftm || 0) * t.games_played, 0);
				const totalFta = teams.reduce((sum, t) => sum + (t.fta || 0) * t.games_played, 0);

				const total = {
					season,
					team: null, // TOT row has no single team
					games_played: totalGames,
					min: weightedAvg('min'),
					pts: weightedAvg('pts'),
					reb: weightedAvg('reb'),
					ast: weightedAvg('ast'),
					stl: weightedAvg('stl'),
					blk: weightedAvg('blk'),
					turnover: weightedAvg('turnover'),
					fgm: totalFgm / totalGames,
					fga: totalFga / totalGames,
					fg_pct: totalFga > 0 ? totalFgm / totalFga : null,
					fg3m: totalFg3m / totalGames,
					fg3a: totalFg3a / totalGames,
					fg3_pct: totalFg3a > 0 ? totalFg3m / totalFg3a : null,
					ftm: totalFtm / totalGames,
					fta: totalFta / totalGames,
					ft_pct: totalFta > 0 ? totalFtm / totalFta : null,
					oreb: weightedAvg('oreb'),
					dreb: weightedAvg('dreb')
				};

				groups.push({
					season,
					isMultiTeam: true,
					total: total as typeof profile.seasons[0],
					teams: teams.sort((a, b) => (b.games_played || 0) - (a.games_played || 0))
				});
			}
		}

		// Sort by season descending
		return groups.sort((a, b) => b.season - a.season);
	});

	const teamColors = $derived(profile?.player.team ? getTeamColors(profile.player.team.abbreviation) : null);
</script>

<div class="player-panel">
	{#if loading}
		<PlayerPanelSkeleton />
	{:else if error}
		<div class="error-state">
			<span class="error-icon">!</span>
			<span class="error-title">ERROR</span>
			<span class="error-description">{error}</span>
			<button class="retry-btn" onclick={() => loadPlayer(playerId)}>
				RETRY
			</button>
		</div>
	{:else if profile}
		{@const player = profile.player}

		<!-- Header -->
		<header class="player-header">
			{#if onClose}
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			{/if}

			<div class="player-name-row">
				<h1 class="player-name">{player.first_name} {player.last_name}</h1>
				{#if player.jersey_number}
					<span class="jersey-number">#{player.jersey_number}</span>
				{/if}
			</div>

			<div class="player-team-row">
				{#if player.team}
					<span class="team-color" style="background: linear-gradient(135deg, {teamColors?.primary} 49%, {teamColors?.secondary} 51%)"></span>
					<span class="team-name">{player.team.full_name}</span>
				{:else}
					<span class="team-name muted">Free Agent</span>
				{/if}
				{#if player.position}
					<span class="position-separator">·</span>
					<span class="position">{player.position}</span>
				{/if}
			</div>

			<div class="player-bio">
				<div class="bio-item">
					<span class="bio-label">HEIGHT</span>
					<span class="bio-value">{formatHeight(player.height)}</span>
				</div>
				<div class="bio-item">
					<span class="bio-label">WEIGHT</span>
					<span class="bio-value">{formatWeight(player.weight)}</span>
				</div>
				<div class="bio-item">
					<span class="bio-label">COUNTRY</span>
					<span class="bio-value">{player.country || '-'}</span>
				</div>
				<div class="bio-item">
					<span class="bio-label">DRAFT</span>
					<span class="bio-value">{formatDraft(player.draft_year, player.draft_round, player.draft_number)}</span>
				</div>
			</div>
		</header>

		<!-- Injury Status -->
		{#if profile.injury}
			<button
				class="injury-section injury-{profile.injury.status.toLowerCase()}"
				class:expanded={injuryExpanded}
				onclick={() => injuryExpanded = !injuryExpanded}
			>
				{#if injuryExpanded}
					<div class="injury-expanded-header">
						<span class="injury-status">{profile.injury.status.toUpperCase()}</span>
						<span class="injury-collapse-hint">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M18 15l-6-6-6 6"/>
							</svg>
						</span>
					</div>
					{#if profile.injury.description}
						<span class="injury-desc">{profile.injury.description}</span>
					{/if}
				{:else}
					<span class="injury-row">
						<span class="injury-status">{profile.injury.status.toUpperCase()}</span>
						{#if profile.injury.description}
							<span class="injury-desc">{profile.injury.description}</span>
						{/if}
					</span>
					<span class="injury-expand-hint">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</span>
				{/if}
			</button>
		{/if}

		<!-- Tabs -->
		<nav class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'seasons'}
				onclick={() => activeTab = 'seasons'}
			>
				CAREER STATS
			</button>
			<button
				class="tab"
				class:active={activeTab === 'gamelog'}
				onclick={() => activeTab = 'gamelog'}
			>
				GAME LOG
			</button>
		</nav>

		<!-- Season Stats -->
		{#if activeTab === 'seasons'}
		<section class="stats-section">
			<h2 class="section-title">SEASON AVERAGES</h2>

			{#if profile.seasons.length === 0}
				<div class="no-stats">
					<span class="no-stats-text">No season stats available</span>
				</div>
			{:else}
				<div class="table-scroll">
					<table class="stats-table">
						<thead>
							<tr>
								<th class="col-season">SEASON</th>
								<th class="col-team">TEAM</th>
								<th class="col-stat">GP</th>
								<th class="col-stat">MIN</th>
								<th class="col-stat">PTS</th>
								<th class="col-stat">REB</th>
								<th class="col-stat">AST</th>
								<th class="col-stat">STL</th>
								<th class="col-stat">BLK</th>
								<th class="col-stat">FG%</th>
								<th class="col-stat">3P%</th>
								<th class="col-stat col-last">FT%</th>
							</tr>
						</thead>
						<tbody>
							{#each groupedSeasons as group (group.season)}
								{#if group.isMultiTeam && group.total}
									{@const isExpanded = expandedSeasons.has(group.season)}
									<!-- Multi-team season: Total row -->
									<tr class="row-total">
										<td class="col-season">{formatSeasonLabel(group.season)}</td>
										<td class="col-team">
											<div class="tot-wrapper">
												<button
													class="team-tot-chip"
													class:expanded={isExpanded}
													onclick={() => toggleSeasonExpanded(group.season)}
												>TOT</button>
												<div class="tot-tooltip">
													{#each group.teams as t}
														{@const tColors = t.team ? getTeamColors(t.team.abbreviation) : null}
														<div class="tooltip-team">
															{#if t.team}
																<span class="team-pip" style="background: linear-gradient(135deg, {tColors?.primary} 49%, {tColors?.secondary} 51%)"></span>
																<span class="tooltip-team-name">{t.team.abbreviation}</span>
																<span class="tooltip-games">{t.games_played}</span>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										</td>
										<td class="col-stat">{group.total.games_played}</td>
										<td class="col-stat">{formatStat(group.total.min)}</td>
										<td class="col-stat">{formatStat(group.total.pts)}</td>
										<td class="col-stat">{formatStat(group.total.reb)}</td>
										<td class="col-stat">{formatStat(group.total.ast)}</td>
										<td class="col-stat">{formatStat(group.total.stl)}</td>
										<td class="col-stat">{formatStat(group.total.blk)}</td>
										<td class="col-stat">{formatPct(group.total.fg_pct)}</td>
										<td class="col-stat">{formatPct(group.total.fg3_pct)}</td>
										<td class="col-stat col-last">{formatPct(group.total.ft_pct)}</td>
									</tr>
									<!-- Individual team rows (hidden by default) -->
									{#if isExpanded}
										{#each group.teams as season (`${group.season}-${season.team?.id}`)}
											{@const seasonTeamColors = season.team ? getTeamColors(season.team.abbreviation) : null}
											<tr class="row-team-split">
												<td class="col-season"></td>
												<td class="col-team">
													{#if season.team}
														<span class="team-pip" style="background: linear-gradient(135deg, {seasonTeamColors?.primary} 49%, {seasonTeamColors?.secondary} 51%)"></span>
														{season.team.abbreviation}
													{:else}
														-
													{/if}
												</td>
												<td class="col-stat">{season.games_played}</td>
												<td class="col-stat">{formatStat(season.min)}</td>
												<td class="col-stat">{formatStat(season.pts)}</td>
												<td class="col-stat">{formatStat(season.reb)}</td>
												<td class="col-stat">{formatStat(season.ast)}</td>
												<td class="col-stat">{formatStat(season.stl)}</td>
												<td class="col-stat">{formatStat(season.blk)}</td>
												<td class="col-stat">{formatPct(season.fg_pct)}</td>
												<td class="col-stat">{formatPct(season.fg3_pct)}</td>
												<td class="col-stat col-last">{formatPct(season.ft_pct)}</td>
											</tr>
										{/each}
									{/if}
								{:else}
									<!-- Single-team season -->
									{@const season = group.teams[0]}
									{@const seasonTeamColors = season.team ? getTeamColors(season.team.abbreviation) : null}
									<tr>
										<td class="col-season">{formatSeasonLabel(season.season)}</td>
										<td class="col-team">
											{#if season.team}
												<span class="team-pip" style="background: linear-gradient(135deg, {seasonTeamColors?.primary} 49%, {seasonTeamColors?.secondary} 51%)"></span>
												{season.team.abbreviation}
											{:else}
												-
											{/if}
										</td>
										<td class="col-stat">{season.games_played}</td>
										<td class="col-stat">{formatStat(season.min)}</td>
										<td class="col-stat">{formatStat(season.pts)}</td>
										<td class="col-stat">{formatStat(season.reb)}</td>
										<td class="col-stat">{formatStat(season.ast)}</td>
										<td class="col-stat">{formatStat(season.stl)}</td>
										<td class="col-stat">{formatStat(season.blk)}</td>
										<td class="col-stat">{formatPct(season.fg_pct)}</td>
										<td class="col-stat">{formatPct(season.fg3_pct)}</td>
										<td class="col-stat col-last">{formatPct(season.ft_pct)}</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
		{/if}

		<!-- Game Log -->
		{#if activeTab === 'gamelog'}
		<section class="stats-section">
			<div class="section-header">
				<h2 class="section-title">GAME LOG</h2>
				<select class="season-select" value={gameLogSeason} onchange={handleSeasonChange}>
					{#each Array.from({ length: 10 }, (_, i) => getCurrentSeason() - i) as season (season)}
						<option value={season}>{formatSeasonLabel(season)}</option>
					{/each}
				</select>
			</div>

			{#if gameLogLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<span>Loading game log...</span>
				</div>
			{:else if gameLogError}
				<div class="error-inline">
					<span>{gameLogError}</span>
					<button class="retry-btn-small" onclick={() => loadGameLog(playerId, gameLogSeason)}>
						Retry
					</button>
				</div>
			{:else if gameLog && gameLog.games.length === 0}
				<div class="no-stats">
					<span class="no-stats-text">No games found for {formatSeasonLabel(gameLogSeason)}</span>
				</div>
			{:else if gameLog}
				<div class="table-scroll gamelog-scroll">
					<table class="stats-table gamelog-table">
						<thead>
							<tr>
								<th class="col-date">DATE</th>
								<th class="col-matchup">OPP</th>
								<th class="col-result">RESULT</th>
								<th class="col-stat">MIN</th>
								<th class="col-stat">PTS</th>
								<th class="col-stat">REB</th>
								<th class="col-stat">AST</th>
								<th class="col-stat">STL</th>
								<th class="col-stat">BLK</th>
								<th class="col-stat">FG</th>
								<th class="col-stat">3P</th>
								<th class="col-stat col-last">FT</th>
							</tr>
						</thead>
						<tbody>
							{#each gameLog.games as game (game.game_id)}
								{@const oppColors = game.opponent ? getTeamColors(game.opponent.abbreviation) : null}
								<tr class:dnp-row={game.dnp}>
									<td class="col-date">{formatGameDate(game.date)}</td>
									<td class="col-matchup">
										<span class="home-away">{game.is_home ? 'vs' : '@'}</span>
										{#if game.opponent}
											<span class="team-pip" style="background: linear-gradient(135deg, {oppColors?.primary} 49%, {oppColors?.secondary} 51%)"></span>
											{game.opponent.abbreviation}
										{:else}
											-
										{/if}
									</td>
									<td class="col-result">
										{#if game.result}
											<span class="result result-{game.result.toLowerCase()}">{game.result}</span>
											<span class="score">{game.final_score}</span>
										{:else}
											-
										{/if}
									</td>
									{#if game.dnp}
										<td class="col-stat dnp-label" colspan="9">DNP</td>
									{:else}
										<td class="col-stat">{game.min || '-'}</td>
										<td class="col-stat">{game.pts ?? '-'}</td>
										<td class="col-stat">{game.reb ?? '-'}</td>
										<td class="col-stat">{game.ast ?? '-'}</td>
										<td class="col-stat">{game.stl ?? '-'}</td>
										<td class="col-stat">{game.blk ?? '-'}</td>
										<td class="col-stat">{game.fgm ?? 0}-{game.fga ?? 0}</td>
										<td class="col-stat">{game.fg3m ?? 0}-{game.fg3a ?? 0}</td>
										<td class="col-stat col-last">{game.ftm ?? 0}-{game.fta ?? 0}</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
		{/if}
	{/if}
</div>

<style>
	.player-panel {
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		background: var(--bg-app);
	}

	/* Error State */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-2xl);
		margin: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--stat-negative);
		border-radius: var(--radius-sm);
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
	}

	.error-description {
		font-family: var(--font-display);
		font-size: 13px;
		color: var(--text-secondary);
		text-align: center;
	}

	.retry-btn {
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
	}

	.retry-btn:hover {
		border-color: var(--accent-primary);
	}

	/* Header */
	.player-header {
		position: relative;
		padding: var(--space-lg);
		background: var(--bg-card);
		border-bottom: 1px solid var(--border-primary);
	}

	.close-btn {
		position: absolute;
		top: var(--space-md);
		right: var(--space-md);
		padding: var(--space-xs);
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: color var(--transition-fast), background var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-inset);
	}

	.player-name-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.player-name {
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.jersey-number {
		font-family: var(--font-stats);
		font-size: 16px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.player-team-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.team-color {
		width: 14px;
		height: 14px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.team-name {
		font-family: var(--font-display);
		font-size: 14px;
		color: var(--text-secondary);
	}

	.team-name.muted {
		color: var(--text-muted);
		font-style: italic;
	}

	.position-separator {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.position {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
	}

	/* Injury Section */
	.injury-section {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		margin: 0;
		text-align: left;
		cursor: pointer;
		border: none;
		border-bottom: 1px solid var(--border-primary);
		transition: background var(--transition-fast);
	}

	.injury-section:hover {
		background: var(--bg-card-hover);
	}

	.injury-section.expanded {
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-xs);
	}

	.injury-out {
		background: rgba(220, 38, 38, 0.1);
	}

	.injury-doubtful {
		background: rgba(201, 85, 61, 0.1);
	}

	.injury-questionable {
		background: rgba(212, 160, 23, 0.1);
	}

	.injury-probable {
		background: var(--bg-inset);
	}

	.injury-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.injury-status {
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.03em;
		flex-shrink: 0;
	}

	.injury-out .injury-status { color: var(--stat-negative); }
	.injury-doubtful .injury-status { color: #c9553d; }
	.injury-questionable .injury-status { color: #d4a017; }
	.injury-probable .injury-status { color: var(--text-muted); }

	.injury-desc {
		font-family: var(--font-display);
		font-size: 12px;
		color: var(--text-secondary);
	}

	/* Collapsed: truncate description */
	.injury-section:not(.expanded) .injury-desc {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Expanded: wrap description */
	.injury-section.expanded .injury-desc {
		white-space: normal;
		line-height: 1.5;
	}

	.injury-expand-hint,
	.injury-collapse-hint {
		flex-shrink: 0;
		color: var(--text-muted);
		opacity: 0.6;
	}

	.injury-expanded-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	/* Bio */
	.player-bio {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-sm) var(--space-lg);
	}

	.bio-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bio-label {
		font-family: var(--font-stats);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.bio-value {
		font-family: var(--font-stats);
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
	}

	/* Tabs */
	.tabs {
		display: flex;
		background: var(--bg-inset);
		border-bottom: 1px solid var(--border-primary);
	}

	.tab {
		flex: 1;
		padding: var(--space-sm) var(--space-md);
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tab:hover {
		color: var(--text-secondary);
		background: var(--bg-card-hover);
	}

	.tab.active {
		color: var(--accent-primary);
		border-bottom-color: var(--accent-primary);
		background: var(--bg-card);
	}

	/* Stats Section */
	.stats-section {
		padding: var(--space-md);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-md);
	}

	.section-header .section-title {
		margin-bottom: 0;
	}

	.season-select {
		padding: var(--space-xs) var(--space-sm);
		font-family: var(--font-stats);
		font-size: 12px;
		color: var(--text-primary);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.season-select:hover {
		border-color: var(--accent-primary);
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-2xl);
		color: var(--text-muted);
		font-family: var(--font-display);
		font-size: 13px;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--border-secondary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-inline {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--bg-card);
		border: 1px solid var(--stat-negative);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-family: var(--font-display);
		font-size: 13px;
	}

	.retry-btn-small {
		padding: var(--space-xs) var(--space-sm);
		font-family: var(--font-stats);
		font-size: 11px;
		color: var(--text-primary);
		background: var(--bg-inset);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.retry-btn-small:hover {
		border-color: var(--accent-primary);
	}

	.section-title {
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin: 0 0 var(--space-md) 0;
	}

	.no-stats {
		padding: var(--space-xl);
		text-align: center;
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.no-stats-text {
		font-family: var(--font-display);
		font-size: 14px;
		color: var(--text-muted);
	}

	/* Stats Table */
	.table-scroll {
		overflow-x: auto;
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
	}

	.stats-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-stats);
		font-size: 12px;
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
		font-size: 10px;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-secondary);
	}

	th.col-season,
	th.col-team {
		text-align: left;
		padding-left: var(--space-md);
	}

	td {
		padding: var(--space-sm) var(--space-xs);
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-secondary);
	}

	td.col-season {
		text-align: left;
		padding-left: var(--space-md);
		font-weight: 600;
		color: var(--text-primary);
	}

	td.col-team {
		text-align: left;
		padding-left: var(--space-md);
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.team-pip {
		width: 10px;
		height: 10px;
		border-radius: 1px;
		flex-shrink: 0;
	}

	.col-stat {
		min-width: 36px;
	}

	.col-last {
		padding-right: var(--space-md);
	}

	tbody tr:hover {
		background: var(--bg-card-hover);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	/* Game log table */
	.gamelog-table .col-date {
		text-align: left;
		padding-left: var(--space-md);
		font-weight: 500;
		color: var(--text-primary);
	}

	.gamelog-table .col-matchup {
		text-align: left;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.gamelog-table th.col-date,
	.gamelog-table th.col-matchup,
	.gamelog-table th.col-result {
		text-align: left;
		padding-left: var(--space-md);
	}

	.gamelog-table td.col-result {
		text-align: left;
		padding-left: var(--space-md);
	}

	.home-away {
		font-size: 10px;
		color: var(--text-muted);
		width: 16px;
		flex-shrink: 0;
	}

	.result {
		font-weight: 600;
		margin-right: 4px;
	}

	.result-w {
		color: var(--stat-positive);
	}

	.result-l {
		color: var(--stat-negative);
	}

	.score {
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		font-size: 11px;
	}

	/* Starter badge - matches StatsTable */
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

	/* DNP row styles */
	.dnp-row {
		opacity: 0.5;
	}

	.dnp-row:hover {
		opacity: 0.7;
	}

	.dnp-label {
		text-align: center !important;
		font-style: italic;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	/* Game log scrollable container */
	.gamelog-scroll {
		max-height: 450px;
		overflow-y: auto;
	}

	.gamelog-scroll thead {
		position: sticky;
		top: 0;
		z-index: 2;
	}

	/* Game log column widths - ensure proper sizing */
	.gamelog-table .col-date {
		min-width: 75px;
		max-width: 85px;
		white-space: nowrap;
	}

	.gamelog-table .col-matchup {
		min-width: 65px;
		max-width: 75px;
	}

	.gamelog-table .col-result {
		min-width: 70px;
		max-width: 85px;
	}

	/* Multi-team season styles */
	.row-total td.col-season {
		font-weight: 700;
	}

	.team-tot-chip {
		padding: 2px 6px;
		font-family: var(--font-stats);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.03em;
		color: var(--text-muted);
		background: var(--bg-inset);
		border: 1px solid var(--border-secondary);
		border-radius: 3px;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.team-tot-chip:hover {
		background: var(--bg-card-hover);
		border-color: var(--border-primary);
		color: var(--text-secondary);
	}

	.team-tot-chip.expanded {
		background: var(--bg-card-hover);
		color: var(--text-secondary);
	}

	.tot-wrapper {
		position: relative;
		display: inline-block;
	}

	.tot-tooltip {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--space-sm);
		background: var(--bg-card);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		opacity: 0;
		visibility: hidden;
		transition: opacity var(--transition-fast), visibility var(--transition-fast);
		white-space: nowrap;
	}

	.tot-wrapper:hover .tot-tooltip {
		opacity: 1;
		visibility: visible;
	}

	.tot-wrapper:has(.team-tot-chip.expanded) .tot-tooltip {
		display: none;
	}

	.tooltip-team {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.tooltip-team-name {
		font-family: var(--font-display);
		font-size: 12px;
		color: var(--text-primary);
	}

	.tooltip-games {
		font-family: var(--font-stats);
		font-size: 11px;
		color: var(--text-muted);
		margin-left: auto;
		padding-left: var(--space-sm);
	}

	.row-team-split td {
		color: var(--text-muted);
		font-size: 11px;
	}

	.row-team-split td.col-team {
		padding-left: calc(var(--space-md) + var(--space-sm));
	}

	@media (max-width: 640px) {
		.player-header {
			padding: var(--space-md);
		}

		.player-name {
			font-size: 20px;
		}

		.player-bio {
			gap: var(--space-xs) var(--space-md);
		}

		.stats-table {
			font-size: 11px;
		}

		th, td {
			padding: var(--space-xs);
		}
	}
</style>
