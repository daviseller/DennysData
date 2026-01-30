# Next Session: app-setup

## Focus: Phase 3 - Day Picker & Games List

### Objectives

1. Build the day picker component
2. Create game cards showing scores and teams
3. Wire up to live API data
4. Implement responsive layout

### Pre-Session Checklist

- [x] API key configured in `.env.local`
- [x] API routes tested and working

### Components to Create

```
src/lib/components/
├── DayPicker.svelte      # Date navigation
├── GameCard.svelte       # Individual game display
└── GamesList.svelte      # Container for game cards
```

### Day Picker Requirements

- Default to today's date
- Left/right arrow buttons for ±1 day
- Click date to open calendar picker (optional)
- Display: "Friday, Jan 30, 2026"

### Game Card Requirements

- Show team abbreviations with colors
- Display score (or scheduled time if not started)
- Status indicator (Final, Live, Scheduled)
- Click to navigate to `/game/[id]`

### Data Flow

```
+page.svelte
  ├── DayPicker (controls selectedDate)
  ├── GamesList
  │     └── GameCard (for each game)
  └── Uses $lib/api.ts to fetch
```

### Deliverables

- [ ] DayPicker component
- [ ] GameCard component
- [ ] GamesList component
- [ ] Home page wired to API
- [ ] Responsive layout (mobile-first)
- [ ] Loading and error states
