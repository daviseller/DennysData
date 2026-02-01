# Next Session: app-setup

## Focus: Phase 5 Completion - Polish & UX

### Completed Recently
- [x] Player game log tab with per-game stats
- [x] Skeleton loader for game log tab
- [x] Responsive scroll heights for both tables
- [x] Career stats now show full history from draft year

### Carry-Forward Tasks

- [ ] Skeleton loaders for game cards and box score
- [ ] Better error messages with retry options
- [ ] Keyboard navigation for day picker (arrow keys)

### Ideas from Sessions 8-9
- [ ] Click game in game log to navigate to that box score
- [ ] Summary stats at top of game log (season averages)
- [ ] Career totals row in season stats

### Implementation Ideas

#### Skeleton Loaders
```svelte
<!-- GameCardSkeleton.svelte -->
<div class="skeleton-card">
  <div class="skeleton-line short"></div>
  <div class="skeleton-line"></div>
  <div class="skeleton-line short"></div>
</div>
```

#### Keyboard Navigation
- Left/Right arrows: change date
- Escape: close box score panel
- Up/Down: navigate game list

### Optional Enhancements

- Quarter-by-quarter scoring breakdown
- Calendar picker for jumping to specific dates
- Stale-while-revalidate pattern for smoother UX

### Context

- Player cache was cleared; first load fetches full history from draft year
- API has basic data back to 1946, detailed stats from 1996+
- Supabase project: `rwzhinwyohngxvatahvg`
