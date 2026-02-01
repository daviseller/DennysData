# Next Session: production

## Focus: Phase 1 - SEO & Meta Tags

### Session Goals

1. Add `<svelte:head>` to all page routes
2. Create dynamic titles for each page type
3. Add meta descriptions
4. Add Open Graph tags for social sharing

### Pages to Update

- `/` (Box Scores) - "NBA Box Scores - [Date] | DennysData"
- `/stats` - "NBA Player Stats - [Season] | DennysData"
- `/player/[id]` - "[Player Name] Stats | DennysData"

### Implementation

```svelte
<!-- +page.svelte -->
<svelte:head>
  <title>NBA Box Scores - {formattedDate} | DennysData</title>
  <meta name="description" content="View NBA box scores, player stats, and game details for {formattedDate}." />
  <meta property="og:title" content="NBA Box Scores - {formattedDate}" />
  <meta property="og:description" content="View NBA box scores and player stats." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://dennysdata.vercel.app/" />
</svelte:head>
```

### Assets Needed

- [ ] OG image (1200x630px)
- [ ] Favicon
- [ ] Apple touch icon
