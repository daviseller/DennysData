# Plan: stats-page

**Created:** 2026-01-31
**Status:** Planned
**Scope:** Medium (3-5 sessions)

## Goal

Add a Player Stats page as a new main section of the app, allowing users to browse, search, and sort NBA player season statistics.

## Success Criteria

- [ ] App has navigation between "Box Scores" and "Stats" pages
- [ ] Stats page shows all players with season averages in sortable table
- [ ] Users can search by player name or team
- [ ] Users can select different seasons
- [ ] Clicking a player opens the player panel (same as box scores)
- [ ] Layout matches box scores pattern (list left, detail right)
- [ ] Default sort by PTS/G descending

## Phases

### Phase 1: Navigation & Routing
- Add app-level navigation component (Box Scores | Stats)
- Set up `/stats` route
- Refactor `+page.svelte` to `/box-scores` or keep at `/` with nav
- Decide on URL structure

### Phase 2: Stats Page Foundation
- Create `/stats/+page.svelte` with basic layout
- Add season picker component (reuse pattern from game log)
- Create stats table structure (reuse career stats table styling)
- Wire up player panel slide-out (already exists)

### Phase 3: Data & API
- Create `/api/stats/+server.ts` endpoint
- Query `player_season_stats` from Supabase cache
- Support season parameter
- Return paginated player stats

### Phase 4: Search & Sort
- Add search input (player name, team)
- Implement client-side filtering
- Add sortable column headers
- Default sort: PTS/G descending
- Consider server-side search for performance

### Phase 5: Polish & UX
- Loading states / skeleton
- Empty states
- Mobile responsiveness
- Keyboard navigation (optional)

## Technical Notes

### Data Source
- Use existing `player_season_stats` Supabase cache
- Already populated from balldontlie API
- Schema has: player info, team, season, all stat averages

### Component Reuse
- `PlayerSlidePanel` - already exists, reuse directly
- Stats table styling - reuse from `PlayerPanel.svelte` career stats
- Season picker pattern - similar to game log season dropdown
- Layout pattern - mirror box scores (list + sidebar)

### URL Structure Options
1. Keep box scores at `/`, stats at `/stats`
2. Move box scores to `/box-scores`, add redirect from `/`
3. Keep `/` as landing, nav to both sections

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-31 | Use existing Supabase cache | Avoid redundant API calls, data already available |
| 2026-01-31 | Medium scope (3-5 sessions) | New page + nav + search + sort, but reuses components |

## Backlog / Ideas

- [ ] Advanced filters (position, conference, division)
- [ ] Compare players side-by-side
- [ ] Export to CSV
- [ ] Per-game breakdown link (like game log)
- [ ] League leaders highlights
