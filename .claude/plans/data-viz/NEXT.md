# Next Session: data-viz

## Focus: Phase 1 - Layercake Setup

### Session Goals

1. Install Layercake package
2. Create base chart wrapper component
3. Build a simple test chart with game scoring data
4. Establish chart color tokens from design system

### Files to Create

- `src/lib/components/charts/` - Chart components directory
- `src/lib/components/charts/ChartWrapper.svelte` - Base responsive container
- `src/lib/components/charts/ScoringBar.svelte` - Simple bar chart

### Resources

- Layercake docs: https://layercake.graphics/
- Examples: https://layercake.graphics/examples

### Implementation Ideas

```svelte
<!-- ChartWrapper.svelte -->
<script>
  import { LayerCake } from 'layercake';
</script>

<div class="chart-container">
  <LayerCake {...$$props}>
    <slot />
  </LayerCake>
</div>
```

### Context

- Design system already has chart-friendly colors
- Game data includes quarter scores (home_team_score, visitor_team_score by period)
