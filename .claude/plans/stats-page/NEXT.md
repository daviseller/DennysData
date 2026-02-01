# Next Session: stats-page

## Focus: Phase 2 - Stats Page Foundation

### Session Goals

1. **Create season picker component** - Dropdown to select NBA seasons (reuse DayPicker styling)
2. **Build stats table structure** - Reuse career stats table styling from PlayerPanel
3. **Wire up player panel** - Clicking a row opens PlayerSlidePanel (same as box scores)
4. **Add placeholder data** - Static mock data for testing layout

### Files to Create/Modify

- `src/lib/components/SeasonPicker.svelte` - Season dropdown component
- `src/lib/components/PlayerStatsTable.svelte` - Stats table for all players
- `src/routes/stats/+page.svelte` - Wire up components

### Implementation Ideas

#### Season Picker Component
```svelte
<!-- SeasonPicker.svelte -->
<div class="season-picker">
  <button class="nav-btn" onclick={prevSeason}>◀</button>
  <span class="season-display">{season}-{season + 1}</span>
  <button class="nav-btn" onclick={nextSeason}>▶</button>
</div>
```

#### Player Stats Table
- Columns: PLAYER, TEAM, GP, MIN, PTS, REB, AST, STL, BLK, FG%, 3P%, FT%
- Sortable headers (prepare for Phase 4)
- Clickable rows for player panel
- Sticky header (matches existing table patterns)

### Context from Phase 1

- AppNav component created at `src/lib/components/AppNav.svelte`
- Stats page scaffold at `src/routes/stats/+page.svelte`
- Navigation working between Box Scores (/) and Stats (/stats)
- Theme picker shared (replicated from box scores)

### Dependencies

- Need to query `player_season_stats` table from Supabase
- May need to create API endpoint in Phase 3, or fetch directly in page
