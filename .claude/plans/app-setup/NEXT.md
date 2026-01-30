# Next Session: app-setup

## Focus: Phase 5 - Caching & Polish

### Objectives

1. Set up Supabase for caching historical games
2. Implement cache layer for API responses
3. Polish loading/error states
4. Mobile optimization refinements

### Pre-Session Checklist

- [ ] Supabase project created
- [ ] Database schema designed
- [ ] Environment variables configured

### Database Schema Ideas

```sql
-- Games cache
CREATE TABLE games (
  id INT PRIMARY KEY,          -- balldontlie game ID
  date DATE NOT NULL,
  home_team_id INT NOT NULL,
  visitor_team_id INT NOT NULL,
  home_team_score INT,
  visitor_team_score INT,
  status TEXT NOT NULL,
  period INT,
  time TEXT,
  data JSONB NOT NULL,         -- Full API response
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Box scores cache
CREATE TABLE box_scores (
  game_id INT PRIMARY KEY,
  data JSONB NOT NULL,         -- Full API response
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX games_date_idx ON games(date);
CREATE INDEX box_scores_game_id_idx ON box_scores(game_id);
```

### Cache Strategy

1. **Historical games** (> 24h old): Cache indefinitely
2. **Recent games** (< 24h old): Cache for 5 min
3. **Live games**: No cache, fetch fresh

### Polish Items

- [ ] Skeleton loading states
- [ ] Stale-while-revalidate pattern
- [ ] Better error messages
- [ ] Empty state illustrations
- [ ] Keyboard navigation for day picker

### Optional Enhancements

- Auto-refresh for live games (30s interval)
- Quarter-by-quarter scoring breakdown
- Calendar picker for date jumping
