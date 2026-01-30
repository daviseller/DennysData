# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DennysData** - NBA box scores website built with Bun + SvelteKit, deployed to Vercel.

## Tech Stack

- **Runtime:** Bun
- **Framework:** SvelteKit
- **Styling:** Pure CSS + design tokens
- **Data Viz:** Layercake (Svelte-native, D3 foundation)
- **API:** balldontlie.io (via server routes for security)
- **Database:** Supabase (for caching)
- **Hosting:** Vercel

## Commands

```bash
# Install dependencies
bun install

# Dev server
bun run dev

# Build
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Home - day picker + games list
│   ├── game/[id]/
│   │   └── +page.svelte      # Game details view
│   └── api/
│       ├── games/+server.ts  # Proxy: fetch games by date
│       └── boxscore/[id]/+server.ts  # Proxy: fetch box score
└── lib/
    ├── api.ts                # Client-side fetch helpers
    ├── styles/
    │   ├── tokens.css        # CSS variables, themes
    │   └── base.css          # Reset, typography
    └── components/
        ├── Panel.svelte
        ├── StatusIndicator.svelte
        ├── GameCard.svelte
        ├── DayPicker.svelte
        └── StatsTable.svelte
```

## Environment Variables

```bash
# .env.local (never committed)
BALLDONTLIE_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

Server-side only (no `VITE_` prefix). Add to Vercel dashboard for production.

## Design System

See `.claude/plans/app-setup/design-system.md` for full details.

Key principles:
- **Tactile** - Elements have weight, borders feel like bezels
- **Structural** - Clear hierarchy through inset panels
- **Durable** - High contrast, works in any lighting
- Fonts: IBM Plex Sans (display) + IBM Plex Mono (stats)
- Sharp corners (2px max radius), no shadows or gradients
- 10 themes (5 dark, 5 light) - sports-themed names

## Svelte MCP Server

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit documentation.

### Available MCP Tools:

#### 1. list-sections
Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

#### 2. get-documentation
Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

#### 3. svelte-autofixer
Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

#### 4. playground-link
Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Supabase MCP Server

You have access to the Supabase MCP server for direct database management.

**Project:** dennysdata (`rwzhinwyohngxvatahvg`)

### Database Schema

```sql
-- Cache tables for API responses
games_cache (id INT PK, date DATE, data JSONB, cached_at TIMESTAMPTZ)
box_scores_cache (game_id INT PK, data JSONB, cached_at TIMESTAMPTZ)
```

### Available MCP Tools:

- `list_projects` - List all Supabase projects
- `list_tables` - View tables and schema
- `apply_migration` - Run DDL (CREATE, ALTER, etc.)
- `execute_sql` - Run queries (SELECT, INSERT, etc.)
- `get_logs` - View service logs for debugging

### Usage Examples

```
# Create a new table
mcp__supabase__apply_migration(project_id, name, query)

# Insert/query data
mcp__supabase__execute_sql(project_id, query)

# Check table structure
mcp__supabase__list_tables(project_id, schemas: ["public"])
```

## Workflow

Plans and session tracking are in `.claude/plans/`. See `.claude/INDEX.md` for current status.
