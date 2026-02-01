# Plan: production

**Created:** 2026-01-31
**Status:** Planned
**Scope:** Small (1-2 sessions)
**Spun off from:** app-setup Phase 7

## Goal

Prepare DennysData for production: SEO optimization, performance tuning, and final deployment verification.

## Success Criteria

- [ ] SEO meta tags on all pages
- [ ] Open Graph / social sharing cards
- [ ] Lighthouse score 90+ (Performance, Accessibility, SEO)
- [ ] < 2s load times on 3G
- [ ] Production deployment verified on Vercel

## Phases

### Phase 1: SEO & Meta Tags
- Add `<svelte:head>` to all pages
- Dynamic titles (game names, player names, dates)
- Meta descriptions
- Open Graph tags for social sharing
- Twitter card tags
- Favicon and app icons

### Phase 2: Performance Tuning
- Lighthouse audit
- Image optimization (if any)
- Bundle size analysis
- Lazy loading for off-screen content
- Preconnect to API domains
- Cache headers review

### Phase 3: Final Deploy
- Verify Vercel production build
- Test all routes in production
- Check error handling in production
- Monitor initial performance

## Technical Notes

### SvelteKit SEO
```svelte
<svelte:head>
  <title>{pageTitle} | DennysData</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:image" content="/og-image.png" />
</svelte:head>
```

### Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3s

## Backlog / Ideas

- [ ] Sitemap generation
- [ ] robots.txt
- [ ] Analytics integration
- [ ] Error tracking (Sentry?)
