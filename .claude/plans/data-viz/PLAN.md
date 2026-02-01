# Plan: data-viz

**Created:** 2026-01-31
**Status:** Planned
**Scope:** Medium (3-5 sessions)
**Spun off from:** app-setup Phase 6

## Goal

Add data visualizations to enhance the NBA stats experience using Layercake (Svelte-native charting with D3 foundation).

## Success Criteria

- [ ] Layercake integrated and working
- [ ] Scoring charts (quarter-by-quarter, run charts)
- [ ] Shot charts (if data available)
- [ ] Player comparison visualizations

## Phases

### Phase 1: Layercake Setup
- Install and configure Layercake
- Create base chart components
- Establish chart styling to match design system
- Test with sample data

### Phase 2: Scoring Charts
- Quarter-by-quarter scoring breakdown
- Game flow / run charts
- Team scoring comparison bars

### Phase 3: Shot Charts (if data available)
- Research balldontlie shot data availability
- Shot location visualization
- Heat maps or scatter plots

### Phase 4: Player Comparisons
- Side-by-side player stat comparisons
- Radar/spider charts for player profiles
- Integration with player panel

## Technical Notes

### Layercake
- Svelte-native, built on D3
- Composable chart components
- Good for responsive, interactive charts

### Data Requirements
- Check if balldontlie has play-by-play data
- Check if shot location data is available
- May need to cache additional data types

## Backlog / Ideas

- [ ] Season-over-season trend lines
- [ ] Team performance dashboards
- [ ] Live game charts (real-time updates)
