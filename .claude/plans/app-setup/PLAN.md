# Plan: app-setup

## Overview

**Goal:** NBA box scores website - browse games by date, view detailed stats
**Status:** In Progress
**Created:** 2026-01-30

## Tech Stack

- **Runtime:** Bun
- **Framework:** SvelteKit (unified frontend + backend)
- **Styling:** Pure CSS + design tokens
- **Data Viz:** Layercake (Svelte-native, D3 foundation)
- **API:** balldontlie.io (via server routes)
- **Database:** Supabase (Phase 5 - caching)
- **Hosting:** Vercel

*Architecture can split to separate backend later if needed.*

## Design

See [design-system.md](design-system.md) for full details.

- Dark mode default
- Sports broadcast aesthetic
- Fonts: IBM Plex Sans (display) + IBM Plex Mono (stats)
- Mobile-first, data-dense

## MVP Scope

### Day Picker
- Default to today
- Left/right arrows for quick navigation
- Jump to specific date

### Games List
- All games for selected date
- Teams, scores, game status
- Click to view details

### Game Details
- Player stats table
- Team stats summary
- Back to day view

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

### Phase 3: Day Picker & Games List
- [ ] Day picker component
- [ ] Box score cards
- [ ] Responsive layout

### Phase 4: Game Details
- [ ] Detail page/view
- [ ] Player stats table
- [ ] Team stats

### Phase 5: Caching & Polish
- [ ] Supabase integration
- [ ] Cache historical games
- [ ] Loading/error states
- [ ] Mobile optimization

### Phase 6: Data Viz (Future)
- [ ] Layercake setup
- [ ] Scoring charts
- [ ] Shot charts
- [ ] Player comparisons

### Phase 7: Production
- [ ] SEO/meta tags
- [ ] Performance tuning
- [ ] Final deploy

## Routes

```
/                     # Day picker + games list
/game/[id]            # Game details
/api/games            # Server: fetch games by date
/api/boxscore/[id]    # Server: fetch box score
```

## API Reference

**balldontlie.io**
- Docs: https://docs.balldontlie.io
- `GET /v1/games?dates[]=YYYY-MM-DD`
- `GET /v1/box_scores?game_id={id}`
- Rate limit: 30/min (free tier)
- API key required (server-side only)

## Success Criteria

- [ ] Browse any date's games
- [ ] View player/team stats for any game
- [ ] Mobile-responsive
- [ ] Deployed to Vercel
- [ ] < 2s load times

## Links

- Repo: https://github.com/daviseller/DennysData
- Design: [design-system.md](design-system.md)
