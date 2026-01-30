# Design System

> **"The scoreboard is a machine."**

---

## Philosophy

The interface feels like arena hardware—scoreboards, stat displays, tunnel signage. Physical and structural. Every element looks like it could be bolted to a wall or mounted above a locker. You could read this from the nosebleeds.

**Functional minimalism. Stadium infrastructure. Built to last.**

Dense data in organized, scannable layouts. No decorations. The screen is equipment.

---

## Principles

### Tactile
Elements have weight and presence. Borders feel like bezels. Cards feel like mounted displays. The UI has the permanence of arena infrastructure—not pixels, but panels.

### Scannable
Box scores are dense by nature. Typography, spacing, and alignment guide the eye to what matters—scores, leaders, key stats. Information at a glance from across the room.

### Structural
Clear visual hierarchy through inset panels and defined regions. Like looking at a control board. Every section has a purpose and a border.

### Neutral
No team bias in the base design. Team colors appear in context (logos, accents) but the system itself is neutral territory. The scoreboard doesn't pick sides.

### Durable
Works in any lighting, any screen. High contrast. Readable in bright arenas or dark rooms. Designed for harsh conditions.

---

## Typography

### Font Stack

```css
--font-display: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-stats: 'IBM Plex Mono', 'Consolas', monospace;
```

| Context | Font | Weight |
|---------|------|--------|
| Headers, labels | IBM Plex Sans | 500-600 |
| Body text | IBM Plex Sans | 400 |
| Scores, stats, numbers | IBM Plex Mono | 500-700 |
| Team abbreviations | IBM Plex Mono | 600 |

### Text Treatments

- **Headers**: UPPERCASE with `letter-spacing: 0.05em`
- **Labels**: UPPERCASE with `letter-spacing: 0.03em`
- **Team names**: UPPERCASE, monospace for alignment (LAL, BOS, NYK)
- **Scores**: Large, bold mono. The most important number.
- **Stats**: `font-variant-numeric: tabular-nums` for column alignment

---

## 10 Themes

Each theme uses the same semantic tokens. Users can switch via theme picker.

### Dark Themes

| Theme | Character |
|-------|-----------|
| **Hardwood** (default) | Classic court browns, warm blacks |
| **Broadcast** | TV broadcast blacks, crisp white text |
| **Tunnel** | Player tunnel concrete grays |
| **Jumbotron** | Arena screen deep blues |
| **Blackout** | Pure dark mode, high contrast |

### Light Themes

| Theme | Character |
|-------|-----------|
| **Arena** | Bright stadium lighting, clean whites |
| **Courtside** | Warm maple wood tones |
| **Pressbox** | Professional, paper-like grays |
| **Practice** | Gym floor warmth, muted |
| **Chalk** | Whiteboard clean, blue accents |

### Semantic Tokens

Every theme defines these variables:

```css
/* Backgrounds */
--bg-app            /* Main background */
--bg-card           /* Game cards, panels */
--bg-card-hover     /* Hover state */
--bg-inset          /* Table headers, stat blocks */

/* Text */
--text-primary      /* Scores, key info */
--text-secondary    /* Supporting text */
--text-muted        /* Labels, timestamps */

/* Borders */
--border-primary    /* Panel bezels, card frames */
--border-secondary  /* Subtle dividers */

/* Status */
--status-live       /* Live game - red */
--status-final      /* Completed - muted */
--status-scheduled  /* Upcoming - neutral */

/* Stats */
--stat-positive     /* Good performance - green */
--stat-negative     /* Below average - red */
--stat-leader       /* Game leader highlight - amber */

/* Accent */
--accent-primary    /* Interactive elements */
--accent-secondary  /* Hover state */
```

### Example: Hardwood (Default Dark)

```css
[data-theme="hardwood"] {
  --bg-app: #0d0b09;
  --bg-card: #1a1714;
  --bg-card-hover: #242019;
  --bg-inset: #0a0908;

  --text-primary: #f5f0e8;
  --text-secondary: #a89f91;
  --text-muted: #6b6358;

  --border-primary: #2e2923;
  --border-secondary: #1f1c18;

  --status-live: #ef4444;
  --status-final: #6b6358;
  --status-scheduled: #a89f91;

  --stat-positive: #22c55e;
  --stat-negative: #ef4444;
  --stat-leader: #f59e0b;

  --accent-primary: #f59e0b;
  --accent-secondary: #fbbf24;
}
```

---

## Status Indicators

LED-style indicators for game state. Like arena display hardware.

| State | Symbol | Treatment |
|-------|--------|-----------|
| **LIVE** | ● | Red, pulsing glow |
| **FINAL** | ○ | Muted, static |
| **SCHEDULED** | ◇ | Neutral, shows time |
| **HALFTIME** | ◐ | Amber |

### Usage

```svelte
<StatusIndicator status="live">Q3 4:32</StatusIndicator>
<StatusIndicator status="final">FINAL</StatusIndicator>
<StatusIndicator status="scheduled">7:30 PM</StatusIndicator>
```

---

## Components

### Panel

Section wrapper with bezel-like border. Everything lives in panels.

```svelte
<Panel label="TEAM STATS">
  <StatsTable data={teamStats} />
</Panel>
```

### Box Score Card

Like a mounted scoreboard display.

```
┌────────────────────────────────┐
│ ● LIVE   Q3 4:32               │
├────────────────────────────────┤
│  LAL                      98   │
│  BOS                     102   │
└────────────────────────────────┘
```

- Sharp corners (border-radius: 2px max)
- Defined bezel border
- Score is the largest element
- LED indicator for status

### Day Picker

Hardware-style date selector.

```
┌─────────────────────────────────┐
│  ◀  THU, JAN 30, 2025  ▶       │
└─────────────────────────────────┘
```

- Chevron buttons for navigation
- Uppercase date
- Feels like a mounted display

### Stats Table

Dense data display with clear alignment.

```
PLAYER          MIN   PTS  REB  AST  FG
─────────────────────────────────────────
L. James         38    32   10    8  12-22
A. Davis         36    28   14    3  11-18
```

- Sticky header with inset background
- Monospace for all numbers
- Right-align numeric columns
- Subtle row dividers
- Highlight row for stat leaders

### Buttons

```css
.btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border: 1px solid var(--border-primary);
  border-radius: 2px;
  background: var(--bg-card);
}
```

Variants: `.btn-primary`, `.btn-danger`, `.btn-sm`

---

## Data Visualization

**Library:** Layercake (Svelte-native, D3 foundation)

### Chart Types (Planned)

- **Bar**: Team comparisons, leader boards
- **Line**: Scoring runs, quarter-by-quarter
- **Shot chart**: Court visualization (future)

### Viz Principles

- Dark backgrounds, light data marks
- Team colors only when comparing teams
- Animate on load only—no hover animations
- Labels > legends
- Grid lines subtle, data prominent
- Feels like arena display graphics

---

## Spacing

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

---

## Responsive

Mobile compatible at all breakpoints.

| Breakpoint | Target |
|------------|--------|
| `< 640px` | Mobile (single column) |
| `640-1024px` | Tablet (2-col games) |
| `> 1024px` | Desktop (3-col, side stats) |

---

## Avoid

- Border-radius > 2px
- Box shadows on cards
- Gradients
- Hover animations (fade only, if any)
- Pure white (#fff) backgrounds
- Pure black (#000) text
- Decorative icons or illustrations
- Team-specific colors in base UI
- Rounded buttons or pill shapes
- Floating elements without borders

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/styles/tokens.css` | CSS variables, themes |
| `src/lib/styles/base.css` | Reset, typography |
| `src/lib/components/Panel.svelte` | Section wrapper |
| `src/lib/components/StatusIndicator.svelte` | LED indicator |
| `src/lib/components/GameCard.svelte` | Box score card |
| `src/lib/components/DayPicker.svelte` | Date navigation |
| `src/lib/components/StatsTable.svelte` | Player/team stats |

---

*"The scoreboard doesn't decorate. It reports."*
