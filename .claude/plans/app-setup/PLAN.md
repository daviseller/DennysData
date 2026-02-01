# Plan: app-setup

## Overview

**Goal:** NBA box scores website - browse games by date, view detailed stats
**Status:** Complete (100%)
**Created:** 2026-01-30

## Tech Stack

- **Runtime:** Bun
- **Framework:** SvelteKit (unified frontend + backend)
- **Styling:** Pure CSS + design tokens
- **Data Viz:** Layercake (Svelte-native, D3 foundation)
- **API:** balldontlie.io (via server routes)
- **Database:** Supabase (caching)
- **Hosting:** Vercel

## Design

See [design-system.md](design-system.md) for full details.

- Light mode default (Arena theme)
- Sports broadcast aesthetic
- Fonts: IBM Plex Sans (display) + IBM Plex Mono (stats)
- Mobile-first, data-dense

## Phases

### Phase 1: Project Scaffolding ✓
- [x] SvelteKit + Bun init
- [x] Design tokens (CSS variables, themes)
- [x] Base styles (reset, typography)
- [x] Vercel deployment
- [x] Environment config

### Phase 2: API Integration ✓
- [x] Server routes for balldontlie.io
- [x] TypeScript types for API responses
- [x] NBA team colors (2 hex codes per team)
- [x] Error handling
- [x] Client fetch helpers

### Phase 3: Day Picker & Games List ✓
- [x] Day picker component
- [x] Box score cards
- [x] Responsive layout

### Phase 4: Game Details ✓
- [x] StatsTable component (sortable player stats)
- [x] TeamTotals component (team comparison bars)
- [x] BoxScorePanel component (reusable box score view)
- [x] Side-by-side layout (games left, box score right)
- [x] Mobile accordion (inline box score below selected game)
- [x] Game detail page route `/game/[id]`
- [x] Request cancellation for rapid navigation

### Phase 5: Caching & Polish ✓
- [x] Supabase integration
- [x] Cache historical games
- [x] Cache box scores
- [x] Skeleton loading states (player panel, game log)
- [x] Player panel with career stats + game log
- [x] Click game log → navigate to box score

*Remaining polish items moved to backlog*

### Phase 6: Data Viz → Spun off to `data-viz` plan
### Phase 7: Production → Spun off to `production` plan

## Routes

```
/                     # Day picker + games list + box score panel
/game/[id]            # Game details (standalone)
/api/games            # Server: fetch games by date (cached)
/api/boxscore/[id]    # Server: fetch box score (cached)
```

## Database Schema

```sql
games_cache (id INT PK, date DATE, data JSONB, cached_at TIMESTAMPTZ)
box_scores_cache (game_id INT PK, data JSONB, cached_at TIMESTAMPTZ)
```

## Success Criteria

- [x] Browse any date's games
- [x] View player/team stats for any game
- [x] Mobile-responsive
- [x] Caching for faster loads
- [x] Deployed to Vercel
- [ ] < 2s load times → moved to `production` plan

## Links

- Repo: https://github.com/daviseller/DennysData
- Supabase: rwzhinwyohngxvatahvg
- Design: [design-system.md](design-system.md)
