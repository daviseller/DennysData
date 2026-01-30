# Next Session: app-setup

## Focus: Phase 1 - Project Scaffolding

### Objectives

1. Initialize SvelteKit project with Bun
2. Set up design tokens and base styles
3. Set up environment for API key
4. Deploy to Vercel (basic)

### Pre-Session Checklist

- [ ] Bun installed (`bun --version`)
- [ ] Vercel account ready
- [ ] balldontlie.io API key obtained

### Commands

```bash
# Init SvelteKit (skeleton, TypeScript)
bun create svelte@latest .

# Install deps
bun install

# Run dev
bun run dev
```

### File Structure to Create

```
src/lib/styles/
├── tokens.css    # CSS variables, all 10 themes
└── base.css      # Reset, typography, global styles
```

### Environment Setup

```bash
# .env.local
BALLDONTLIE_API_KEY=your_key_here
```

Add to Vercel dashboard after first deploy.

### Deliverables

- [ ] SvelteKit running locally
- [ ] Design tokens working (themes switchable)
- [ ] Base typography with IBM Plex fonts
- [ ] Deployed to Vercel
- [ ] Env var configured
