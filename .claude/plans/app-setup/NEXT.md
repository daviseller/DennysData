# Next Session: app-setup

## Focus: Phase 5 Completion - Polish & UX

### Objectives

1. Add skeleton loading states
2. Improve error messages
3. Add keyboard navigation to day picker
4. Optional: Auto-refresh for live games

### Carry-Forward Tasks

These were planned but not completed in Session 5:

- [ ] Skeleton loaders for game cards and box score
- [ ] Better error messages with retry options
- [ ] Keyboard navigation for day picker (arrow keys)

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

- Auto-refresh for live games (30s polling)
- Quarter-by-quarter scoring breakdown
- Calendar picker for jumping to specific dates
- Stale-while-revalidate pattern for smoother UX

### Context

- Supabase caching is working (games_cache, box_scores_cache)
- Cache populates as users browse
- Project ID: `rwzhinwyohngxvatahvg`
